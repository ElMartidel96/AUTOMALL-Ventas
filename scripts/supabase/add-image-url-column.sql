-- Migration: Add image_url column to special_invites table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Add image_url column if it doesn't exist
ALTER TABLE special_invites
ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN special_invites.image_url IS 'URL of custom image uploaded for the invite card (Supabase Storage)';

-- Create RPC function for the API to call
CREATE OR REPLACE FUNCTION add_image_url_column_to_special_invites()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Add column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'special_invites'
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE special_invites ADD COLUMN image_url TEXT DEFAULT NULL;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION add_image_url_column_to_special_invites() TO authenticated;
GRANT EXECUTE ON FUNCTION add_image_url_column_to_special_invites() TO service_role;

-- Verify the column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'special_invites'
ORDER BY ordinal_position;
