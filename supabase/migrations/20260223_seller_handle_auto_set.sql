-- Migration: Auto-set seller_handle on vehicles
-- Backfills existing vehicles and creates a trigger for future inserts/updates

-- 1. Backfill: set seller_handle on existing vehicles that have a matching seller
UPDATE vehicles v
SET seller_handle = s.handle
FROM sellers s
WHERE v.seller_address = s.wallet_address
  AND v.seller_handle IS NULL
  AND s.is_active = true;

-- 2. Function: auto-set seller_handle from seller_address
CREATE OR REPLACE FUNCTION fn_auto_set_seller_handle()
RETURNS TRIGGER AS $$
BEGIN
  -- Only lookup if seller_address is provided and seller_handle is not already set
  IF NEW.seller_address IS NOT NULL AND (NEW.seller_handle IS NULL OR NEW.seller_handle = '') THEN
    SELECT handle INTO NEW.seller_handle
    FROM sellers
    WHERE wallet_address = NEW.seller_address
      AND is_active = true
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger: fires before insert or update on vehicles
DROP TRIGGER IF EXISTS trg_auto_set_seller_handle ON vehicles;
CREATE TRIGGER trg_auto_set_seller_handle
  BEFORE INSERT OR UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION fn_auto_set_seller_handle();
