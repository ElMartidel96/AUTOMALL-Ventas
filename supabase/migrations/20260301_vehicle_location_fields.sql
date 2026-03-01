-- ============================================================
-- Vehicle Location Fields — latitude, longitude, location_source
-- Allows vehicles to appear on the map in the catalog
-- ============================================================

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS location_source TEXT
  CHECK (location_source IN ('dealer', 'manual', 'geolocated'))
  DEFAULT 'dealer';

-- Index for geo queries on vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_geo
  ON vehicles(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND status = 'active';
