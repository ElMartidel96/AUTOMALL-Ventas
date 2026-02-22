-- ============================================================================
-- Autos MALL — Complete Vehicle Inventory System
-- Tables, RLS, Indexes, Triggers — Single migration file
-- ============================================================================

-- ── Tables ────────────────────────────────────────────────────────────────────

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_address TEXT NOT NULL,
  vin TEXT,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2030),
  trim TEXT,
  body_type TEXT,
  doors INTEGER,
  price DECIMAL(12,2) NOT NULL CHECK (price > 0),
  price_negotiable BOOLEAN DEFAULT true,
  mileage INTEGER NOT NULL CHECK (mileage >= 0),
  condition TEXT NOT NULL DEFAULT 'good'
    CHECK (condition IN ('new','like_new','excellent','good','fair')),
  exterior_color TEXT,
  interior_color TEXT,
  transmission TEXT CHECK (transmission IN ('automatic','manual','cvt')),
  fuel_type TEXT CHECK (fuel_type IN ('gasoline','diesel','electric','hybrid','plugin_hybrid')),
  drivetrain TEXT CHECK (drivetrain IN ('fwd','rwd','awd','4wd')),
  engine TEXT,
  description TEXT,
  features TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','sold','archived')),
  primary_image_url TEXT,
  image_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  inquiries_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ
);

-- Vehicle images table
CREATE TABLE IF NOT EXISTS vehicle_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  file_size INTEGER,
  mime_type TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Enable RLS ────────────────────────────────────────────────────────────────

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies for vehicles ─────────────────────────────────────────────────

-- Public can read active vehicles (catalog)
CREATE POLICY "vehicles_public_read" ON vehicles
  FOR SELECT USING (status = 'active');

-- Service role (admin) can do everything (API routes use service key)
CREATE POLICY "vehicles_service_all" ON vehicles
  FOR ALL USING (auth.role() = 'service_role');

-- ── RLS Policies for vehicle_images ───────────────────────────────────────────

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

-- ── Indexes ───────────────────────────────────────────────────────────────────

-- Basic query indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_seller ON vehicles(seller_address);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand_year ON vehicles(brand, year);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle ON vehicle_images(vehicle_id);

-- Catalog performance indexes (partial, only active vehicles)
CREATE INDEX IF NOT EXISTS idx_vehicles_status_published ON vehicles(status, published_at DESC)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_vehicles_price ON vehicles(price)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_vehicles_year ON vehicles(year DESC)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_vehicles_mileage ON vehicles(mileage)
  WHERE status = 'active';

-- ── Triggers ──────────────────────────────────────────────────────────────────

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vehicle_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vehicles_updated_at ON vehicles;
CREATE TRIGGER vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_vehicle_timestamp();

-- Auto-set published_at when status changes to 'active', sold_at when 'sold'
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
