-- =====================================================
-- EMAIL OTP VERIFICATIONS TABLE
-- For educational flow email verification without wallet
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =====================================================

-- Create the table for storing OTPs for educational flow
CREATE TABLE IF NOT EXISTS email_otp_verifications (
  email TEXT PRIMARY KEY,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster expiry checks
CREATE INDEX IF NOT EXISTS idx_email_otp_expires_at ON email_otp_verifications(expires_at);

-- Enable Row Level Security
ALTER TABLE email_otp_verifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access
CREATE POLICY "Service role can do everything" ON email_otp_verifications
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment to table
COMMENT ON TABLE email_otp_verifications IS 'Temporary OTP storage for educational flow email verification (no wallet required)';

-- Grant permissions to service role
GRANT ALL ON email_otp_verifications TO service_role;

-- Optional: Create a function to clean expired OTPs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM email_otp_verifications WHERE expires_at < NOW();
END;
$$;

-- You can schedule this function using pg_cron or call it manually:
-- SELECT cleanup_expired_otps();

-- =====================================================
-- VERIFICATION QUERY (for testing)
-- =====================================================
-- SELECT * FROM email_otp_verifications;
