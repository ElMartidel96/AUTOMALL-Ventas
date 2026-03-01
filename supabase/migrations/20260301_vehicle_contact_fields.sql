-- ============================================================
-- Per-vehicle contact fields
-- Prefilled from seller profile, editable per vehicle
-- ============================================================

-- Add contact columns to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS contact_whatsapp TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS contact_city TEXT DEFAULT 'Houston';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS contact_state TEXT DEFAULT 'TX';

-- Backfill existing vehicles: copy contact info from seller profile
UPDATE vehicles v
SET contact_phone = s.phone,
    contact_whatsapp = s.whatsapp,
    contact_city = COALESCE(s.city, 'Houston'),
    contact_state = COALESCE(s.state, 'TX')
FROM sellers s
WHERE v.seller_address = s.wallet_address
  AND v.contact_phone IS NULL;
