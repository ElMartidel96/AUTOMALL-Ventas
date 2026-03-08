/**
 * Meta Auto-Publisher
 *
 * Publishes vehicle posts to Facebook when status changes:
 *   draft → active  = "New listing" post
 *   active → sold   = "Sold" post
 *
 * Supports single-image and carousel (multi-image) posts.
 * Errors are logged to meta_publication_log AND re-thrown.
 * Callers decide how to handle: inventory status endpoint uses fire-and-forget
 * (.catch()), WhatsApp flow uses await to detect failures.
 */

import { getTypedClient } from '@/lib/supabase/client';
import {
  publishPhotoPost,
  uploadUnpublishedPhoto,
  publishCarouselPost,
} from './facebook-api';
import { generateCaption } from './caption-generator';
import type { MetaConnection, VehicleForFeed, SellerForFeed, PublicationPostType } from './types';

const MAX_CAROUSEL_IMAGES = 10;

interface StatusChangeEvent {
  vehicleId: string;
  sellerAddress: string;
  oldStatus: string;
  newStatus: string;
  /** Skip auto_publish_on_active/sold check (e.g. explicit user confirmation via WhatsApp) */
  forcePublish?: boolean;
}

export async function handleStatusChange(event: StatusChangeEvent): Promise<void> {
  const { vehicleId, sellerAddress, oldStatus, newStatus } = event;

  // Determine post type
  let postType: PublicationPostType | null = null;
  if (oldStatus === 'draft' && newStatus === 'active') {
    postType = 'new_listing';
  } else if (oldStatus === 'active' && newStatus === 'sold') {
    postType = 'sold';
  }

  if (!postType) return;

  try {
    const supabase = getTypedClient();

    // Get active Meta connection for this seller
    const { data: connection } = await supabase
      .from('seller_meta_connections')
      .select('*')
      .eq('wallet_address', sellerAddress)
      .eq('is_active', true)
      .single();

    if (!connection) return; // No Meta connection — skip silently

    const conn = connection as unknown as MetaConnection;

    // Check if auto-publish is enabled for this event type (skip if forcePublish)
    if (!event.forcePublish) {
      if (postType === 'new_listing' && !conn.auto_publish_on_active) return;
      if (postType === 'sold' && !conn.auto_publish_on_sold) return;
    }

    // Get vehicle details
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('id, brand, model, year, price, mileage, condition, transmission, fuel_type, drivetrain, body_type, exterior_color, vin, description, status, seller_address')
      .eq('id', vehicleId)
      .single();

    if (!vehicle) return;

    // Get seller details
    const { data: seller } = await supabase
      .from('sellers')
      .select('id, handle, business_name, phone, whatsapp, city, state, address, wallet_address')
      .eq('wallet_address', sellerAddress)
      .single();

    if (!seller) return;

    const vehicleData: VehicleForFeed = {
      id: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      price: vehicle.price,
      mileage: vehicle.mileage,
      condition: vehicle.condition,
      transmission: vehicle.transmission,
      fuel_type: vehicle.fuel_type,
      drivetrain: vehicle.drivetrain,
      body_type: vehicle.body_type,
      exterior_color: vehicle.exterior_color,
      vin: vehicle.vin,
      description: vehicle.description,
      status: vehicle.status,
      seller_address: vehicle.seller_address,
    };

    const sellerData: SellerForFeed = {
      id: seller.id,
      handle: seller.handle,
      business_name: seller.business_name || seller.handle,
      phone: seller.phone || null,
      whatsapp: seller.whatsapp || null,
      city: seller.city || null,
      state: seller.state || null,
      address: seller.address || null,
      wallet_address: seller.wallet_address,
    };

    // Generate caption
    const caption = generateCaption({
      postType,
      vehicle: vehicleData,
      seller: sellerData,
      connection: conn,
    });

    // Get vehicle images
    const { data: images } = await supabase
      .from('vehicle_images')
      .select('id, public_url, display_order')
      .eq('vehicle_id', vehicleId)
      .order('display_order', { ascending: true })
      .limit(MAX_CAROUSEL_IMAGES);

    const imageUrls = (images || []).map((img: { id: string; public_url: string; display_order: number }) => img.public_url);

    console.log(`[MetaPublisher] ${postType} for ${vehicleId}: ${imageUrls.length} images`);
    if (imageUrls.length > 0) {
      console.log(`[MetaPublisher] Image URLs being sent to Facebook:`);
      imageUrls.forEach((url: string, i: number) => console.log(`  [${i}] ${url}`));
    }

    // Create pending log entry
    const { data: logEntry } = await supabase
      .from('meta_publication_log')
      .insert({
        vehicle_id: vehicleId,
        seller_id: conn.seller_id,
        connection_id: conn.id,
        post_type: postType,
        status: 'pending',
        caption,
        image_urls: imageUrls,
      })
      .select('id')
      .single();

    const logId = logEntry?.id;

    // Publish to Facebook
    let fbPostId: string | null = null;

    if (imageUrls.length === 0) {
      // No images — skip (FB posts without images get very low engagement)
      if (logId) {
        await supabase
          .from('meta_publication_log')
          .update({ status: 'failed', error_message: 'No images available' })
          .eq('id', logId);
      }
      return;
    }

    if (imageUrls.length === 1) {
      // Single image post
      const result = await publishPhotoPost(
        conn.fb_page_id,
        conn.fb_page_access_token,
        caption,
        imageUrls[0]
      );
      fbPostId = result.id || result.post_id || null;
    } else {
      // Carousel (multi-image) post
      const photoIds: string[] = [];
      for (const url of imageUrls) {
        const photo = await uploadUnpublishedPhoto(
          conn.fb_page_id,
          conn.fb_page_access_token,
          url
        );
        photoIds.push(photo.id);
      }

      const result = await publishCarouselPost(
        conn.fb_page_id,
        conn.fb_page_access_token,
        caption,
        photoIds
      );
      fbPostId = result.id || null;
    }

    // Update log as published
    if (logId) {
      await supabase
        .from('meta_publication_log')
        .update({ status: 'published', fb_post_id: fbPostId })
        .eq('id', logId);
    }

    console.log(`[MetaPublisher] Published ${postType} for vehicle ${vehicleId} → FB post ${fbPostId}`);
  } catch (error) {
    console.error(`[MetaPublisher] Error publishing ${postType} for vehicle ${vehicleId}:`, error);

    // Log the error to meta_publication_log
    try {
      const supabase = getTypedClient();
      await supabase
        .from('meta_publication_log')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('vehicle_id', vehicleId)
        .eq('status', 'pending');
    } catch {
      // Swallow — we already logged the primary error
    }

    // Re-throw so callers can detect failure.
    // Inventory status endpoint uses fire-and-forget (.catch()), so this is safe.
    // WhatsApp flow awaits this call and needs to know if it failed.
    throw error;
  }
}
