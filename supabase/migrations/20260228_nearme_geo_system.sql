-- ============================================================================
-- Autos MALL — Near Me Geographic System
-- Adds geolocation fields to sellers, Haversine distance function,
-- catalog display modes, and helper functions for geo queries.
-- ============================================================================

-- ── 1. Add geo columns to sellers ─────────────────────────────────────────
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS service_radius_km DOUBLE PRECISION DEFAULT 40.0;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS geocode_status TEXT DEFAULT 'pending'
  CHECK (geocode_status IN ('pending', 'success', 'failed', 'manual'));
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS catalog_display_mode TEXT DEFAULT 'service_area'
  CHECK (catalog_display_mode IN ('service_area', 'full_catalog', 'personal_only'));

-- ── 2. Index for geo queries (only geocoded active sellers) ───────────────
CREATE INDEX IF NOT EXISTS idx_sellers_geo
  ON sellers(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND is_active = true;

-- ── 3. Haversine distance function (returns km) ──────────────────────────
CREATE OR REPLACE FUNCTION haversine_distance(
  lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
  R CONSTANT DOUBLE PRECISION := 6371.0;
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a DOUBLE PRECISION;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat / 2) * sin(dlat / 2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlon / 2) * sin(dlon / 2);
  RETURN R * 2 * atan2(sqrt(a), sqrt(1 - a));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── 4. Function: Find sellers within radius of a point ────────────────────
CREATE OR REPLACE FUNCTION sellers_within_radius(
  center_lat DOUBLE PRECISION,
  center_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 50.0
) RETURNS TABLE(
  id UUID,
  handle TEXT,
  business_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  service_radius_km DOUBLE PRECISION,
  logo_url TEXT,
  phone TEXT,
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id, s.handle, s.business_name,
    s.latitude, s.longitude, s.service_radius_km,
    s.logo_url, s.phone,
    haversine_distance(center_lat, center_lng, s.latitude, s.longitude) AS distance_km
  FROM sellers s
  WHERE s.is_active = true
    AND s.latitude IS NOT NULL
    AND s.longitude IS NOT NULL
    AND haversine_distance(center_lat, center_lng, s.latitude, s.longitude) <= radius_km
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ── 5. Function: Get seller handles within a dealer's service area ────────
CREATE OR REPLACE FUNCTION seller_handles_in_service_area(
  dealer_lat DOUBLE PRECISION,
  dealer_lng DOUBLE PRECISION,
  dealer_radius DOUBLE PRECISION
) RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT s.handle
    FROM sellers s
    WHERE s.is_active = true
      AND s.latitude IS NOT NULL
      AND s.longitude IS NOT NULL
      AND haversine_distance(dealer_lat, dealer_lng, s.latitude, s.longitude) <= dealer_radius
  );
END;
$$ LANGUAGE plpgsql STABLE;
