-- ============================================================================
-- Autos MALL — RLS Policies + Storage Setup for Vehicle Inventory
-- Run this AFTER 20260220_vehicles_inventory.sql
-- ============================================================================

-- ── Enable RLS ──────────────────────────────────────────────────────────────
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies for vehicles ───────────────────────────────────────────────

-- Public can read active vehicles (catalog)
CREATE POLICY "vehicles_public_read" ON vehicles
  FOR SELECT USING (status = 'active');

-- Service role (admin) can do everything (API routes use service key)
CREATE POLICY "vehicles_service_all" ON vehicles
  FOR ALL USING (auth.role() = 'service_role');

-- ── RLS Policies for vehicle_images ─────────────────────────────────────────

-- Public can read images of active vehicles
CREATE POLICY "vehicle_images_public_read" ON vehicle_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vehicles WHERE vehicles.id = vehicle_images.vehicle_id AND vehicles.status = 'active'
    )
  );

-- Service role (admin) can do everything
CREATE POLICY "vehicle_images_service_all" ON vehicle_images
  FOR ALL USING (auth.role() = 'service_role');

-- ── Additional indexes for catalog performance ──────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vehicles_status_published ON vehicles(status, published_at DESC)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_vehicles_price ON vehicles(price)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_vehicles_year ON vehicles(year DESC)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_vehicles_mileage ON vehicles(mileage)
  WHERE status = 'active';

-- ── Auto-set published_at when status changes to 'active' ──────────────────
CREATE OR REPLACE FUNCTION set_vehicle_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD.status IS DISTINCT FROM 'active') THEN
    NEW.published_at = now();
  END IF;
  IF NEW.status = 'sold' AND (OLD.status IS DISTINCT FROM 'sold') THEN
    NEW.sold_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vehicles_set_published_at ON vehicles;
CREATE TRIGGER vehicles_set_published_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION set_vehicle_published_at();
