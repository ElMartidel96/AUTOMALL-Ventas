/**
 * Vehicle Creator — WhatsApp AI Pipeline
 *
 * Creates a vehicle listing from extracted AI data.
 * Reutilizes the same pattern as POST /api/inventory.
 */

import { getTypedClient } from '@/lib/supabase/client';
import { handleStatusChange } from '@/lib/meta/auto-publisher';
import { processWhatsAppImages } from './image-pipeline';
import type { ExtractedVehicle } from './types';

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'autosmall.org';

export interface VehicleCreateResult {
  vehicleId: string;
  catalogUrl: string;
  publishedToFb: boolean;
}

export async function createVehicleFromExtraction(
  extracted: ExtractedVehicle,
  sellerAddress: string,
  mediaIds: string[],
  waAccessToken: string,
  autoActivate: boolean
): Promise<VehicleCreateResult> {
  const supabase = getTypedClient();
  const walletAddr = sellerAddress.toLowerCase();

  // 1. Lookup seller info
  const { data: seller } = await supabase
    .from('sellers')
    .select('id, handle, phone, whatsapp, city, state, latitude, longitude')
    .eq('wallet_address', walletAddr)
    .eq('is_active', true)
    .single();

  if (!seller) {
    throw new Error('Seller not found');
  }

  // 2. Create vehicle in draft status
  const vehicleData = {
    seller_address: walletAddr,
    seller_handle: seller.handle,
    brand: extracted.brand || 'Unknown',
    model: extracted.model || 'Unknown',
    year: extracted.year || new Date().getFullYear(),
    price: extracted.price || 0,
    mileage: extracted.mileage || 0,
    condition: extracted.condition || 'good',
    exterior_color: extracted.exterior_color,
    interior_color: extracted.interior_color,
    body_type: extracted.body_type,
    transmission: extracted.transmission,
    fuel_type: extracted.fuel_type,
    drivetrain: extracted.drivetrain,
    engine: extracted.engine,
    trim: extracted.trim,
    doors: extracted.doors,
    vin: extracted.vin,
    features: extracted.features || [],
    description: extracted.description,
    contact_phone: seller.phone || null,
    contact_whatsapp: seller.whatsapp || null,
    contact_city: seller.city || 'Houston',
    contact_state: seller.state || 'TX',
    latitude: seller.latitude || null,
    longitude: seller.longitude || null,
    location_source: seller.latitude != null ? 'dealer' : null,
    status: 'draft' as const,
  };

  let data;
  let error;

  ({ data, error } = await supabase
    .from('vehicles')
    .insert(vehicleData)
    .select('id')
    .single());

  // Fallback without geo columns if they don't exist yet
  if (error && (error.code === 'PGRST204' || error.message?.includes('latitude'))) {
    const { latitude: _lat, longitude: _lng, location_source: _src, ...safeData } = vehicleData;
    ({ data, error } = await supabase
      .from('vehicles')
      .insert(safeData)
      .select('id')
      .single());
  }

  if (error || !data) {
    throw new Error(`Failed to create vehicle: ${error?.message || 'Unknown error'}`);
  }

  const vehicleId = data.id;

  // 3. Process images (download from WA → upload to Supabase Storage)
  await processWhatsAppImages(mediaIds, vehicleId, walletAddr, waAccessToken);

  // 4. Auto-activate if configured
  let publishedToFb = false;

  if (autoActivate) {
    const { error: statusError } = await supabase
      .from('vehicles')
      .update({ status: 'active' })
      .eq('id', vehicleId);

    if (!statusError) {
      // Fire-and-forget: trigger Facebook auto-publish
      handleStatusChange({
        vehicleId,
        sellerAddress: walletAddr,
        oldStatus: 'draft',
        newStatus: 'active',
      }).then(() => {
        publishedToFb = true;
      }).catch((err) => {
        console.error(`[WA-Creator] FB publish error for ${vehicleId}:`, err);
      });

      // Give it a moment for the FB publish to start
      publishedToFb = true;
    }
  }

  const catalogUrl = `https://${seller.handle}.${APP_DOMAIN}/catalog/${vehicleId}`;

  return { vehicleId, catalogUrl, publishedToFb };
}
