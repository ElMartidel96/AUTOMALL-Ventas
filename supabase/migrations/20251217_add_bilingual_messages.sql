-- =====================================================
-- MIGRATION: Add Bilingual Message Support
--
-- Adds Spanish message field to permanent_special_invites
-- and special_invites tables for i18n support.
--
-- Date: 2025-12-17
-- =====================================================

-- Add custom_message_es to permanent_special_invites
ALTER TABLE public.permanent_special_invites
ADD COLUMN IF NOT EXISTS custom_message_es TEXT DEFAULT NULL;

-- Add custom_message_es to special_invites (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'special_invites') THEN
        ALTER TABLE public.special_invites
        ADD COLUMN IF NOT EXISTS custom_message_es TEXT DEFAULT NULL;
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN public.permanent_special_invites.custom_message_es IS 'Spanish version of custom message for i18n support';

-- Update existing invite with the star referrer to have Spanish message
-- (This is the specific invite mentioned by the user)
UPDATE public.permanent_special_invites
SET custom_message_es = 'CryptoGift Wallets: el DeLorean que convierte tus regalos en viajes directos al futuro financiero. Un pequeño clic para ti, un salto gigante para ese amigo que todavía mira las criptos con desconfianza. Frente a ti está la píldora roja más amable para entrar a Web3… e incluso regalársela a otros. La decisión está en tus manos.'
WHERE invite_code = 'PI-MJ3CJ0IF-D313F4D99755F78F';
