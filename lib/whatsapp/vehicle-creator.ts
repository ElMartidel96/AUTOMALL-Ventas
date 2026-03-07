/**
 * Vehicle Creator — WhatsApp AI Pipeline
 *
 * Creates a vehicle listing from extracted AI data.
 * Vehicle is created as 'active' (visible on catalog immediately).
 * Facebook publishing is handled separately by session-manager after user confirmation.
 */

import { getTypedClient } from '@/lib/supabase/client';
import { finalizeVehicleImages } from './image-pipeline';
import type { ExtractedVehicle } from './types';
import type { StagedImage } from './image-pipeline';

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'autosmall.org';

export interface VehicleCreateResult {
  vehicleId: string;
  catalogUrl: string;
}

export async function createVehicleFromExtraction(
  extracted: ExtractedVehicle,
  sellerAddress: string,
  stagedImages: StagedImage[],
): Promise<VehicleCreateResult> {
  const supabase = getTypedClient();
  const walletAddr = sellerAddress.toLowerCase();

  // 1. Lookup seller info (must be active)
  const { data: seller } = await supabase
    .from('sellers')
    .select('id, handle, phone, whatsapp, city, state, latitude, longitude')
    .eq('wallet_address', walletAddr)
    .eq('is_active', true)
    .single();

  if (!seller) {
    throw new Error('Seller not found or inactive');
  }

  // 2. Create vehicle as active (immediately visible on catalog)
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
    status: 'active' as const,
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

  // 3. Finalize staged images (move from staging → vehicle folder + create records)
  await finalizeVehicleImages(stagedImages, vehicleId, walletAddr);

  const catalogUrl = `https://${seller.handle}.${APP_DOMAIN}/catalog/${vehicleId}`;

  return { vehicleId, catalogUrl };
}
