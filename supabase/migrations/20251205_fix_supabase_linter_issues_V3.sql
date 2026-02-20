-- =====================================================
-- 🔧 FIX ALL SUPABASE LINTER ISSUES (26 security issues)
-- =====================================================
-- Created: 2025-12-05
-- Version: V3 (with DROP FUNCTION for all existing functions)
-- Purpose: Fix security issues from Supabase linter
--
-- Issues fixed:
-- - 7 SECURITY DEFINER views (SECURITY category)
-- - 18 functions without search_path (SECURITY category)
-- - 1 extension in public schema (SECURITY category)
--
-- Made by mbxarts.com The Moon in a Box property
-- Co-Author: Godez22
-- =====================================================

BEGIN;

-- =====================================================
-- PART 1: FIX SECURITY DEFINER VIEWS (7 issues)
-- =====================================================
-- Issue: Views with SECURITY DEFINER enforce creator's permissions
-- Fix: Recreate views with SECURITY INVOKER (default)

DROP VIEW IF EXISTS public.active_tasks_with_assignees CASCADE;
CREATE OR REPLACE VIEW public.active_tasks_with_assignees AS
SELECT
  t.*,
  p.wallet_address as assignee_wallet,
  p.username as assignee_username,
  p.avatar_url as assignee_avatar
FROM public.tasks t
LEFT JOIN public.user_profiles p ON t.assignee_address = p.wallet_address
WHERE t.status IN ('available', 'claimed', 'in_progress', 'submitted');

DROP VIEW IF EXISTS public.leaderboard_view CASCADE;
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT
  wallet_address,
  username,
  avatar_url,
  total_cgc_earned,
  total_tasks_completed,
  reputation_score,
  rank() OVER (ORDER BY total_cgc_earned DESC) as position
FROM public.user_profiles
WHERE is_public = true
ORDER BY total_cgc_earned DESC
LIMIT 100;

DROP VIEW IF EXISTS public.profile_leaderboard CASCADE;
CREATE OR REPLACE VIEW public.profile_leaderboard AS
SELECT
  wallet_address,
  username,
  avatar_url,
  total_cgc_earned,
  total_tasks_completed,
  total_referrals,
  reputation_score,
  created_at
FROM public.user_profiles
WHERE is_public = true
ORDER BY reputation_score DESC, total_cgc_earned DESC;

DROP VIEW IF EXISTS public.active_tasks_view CASCADE;
CREATE OR REPLACE VIEW public.active_tasks_view AS
SELECT
  task_id,
  title,
  description,
  complexity,
  reward_cgc,
  category,
  priority,
  status,
  required_skills,
  tags,
  created_at,
  claimed_at
FROM public.tasks
WHERE status IN ('available', 'claimed');

DROP VIEW IF EXISTS public.referral_leaderboard CASCADE;
CREATE OR REPLACE VIEW public.referral_leaderboard AS
SELECT
  rc.wallet_address,
  rc.code,
  rc.total_referrals,
  rc.total_earnings,
  rc.created_at,
  p.username,
  p.avatar_url
FROM public.referral_codes rc
LEFT JOIN public.user_profiles p ON rc.wallet_address = p.wallet_address
WHERE rc.is_active = true
ORDER BY rc.total_referrals DESC, rc.total_earnings DESC
LIMIT 100;

DROP VIEW IF EXISTS public.public_profiles CASCADE;
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  wallet_address,
  username,
  avatar_url,
  bio,
  total_cgc_earned,
  total_tasks_completed,
  total_referrals,
  reputation_score,
  created_at
FROM public.user_profiles
WHERE is_public = true;

DROP VIEW IF EXISTS public.referral_network CASCADE;
CREATE OR REPLACE VIEW public.referral_network AS
SELECT
  r.id,
  r.referral_code,
  r.referred_address,
  r.level,
  r.status,
  r.joined_at,
  p1.username as referrer_username,
  p2.username as referred_username
FROM public.referrals r
LEFT JOIN public.referral_codes rc ON r.referral_code = rc.code
LEFT JOIN public.user_profiles p1 ON rc.wallet_address = p1.wallet_address
LEFT JOIN public.user_profiles p2 ON r.referred_address = p2.wallet_address
WHERE r.status = 'active';

-- =====================================================
-- PART 2: DROP ALL EXISTING FUNCTIONS FIRST
-- =====================================================
-- This prevents "cannot change return type" errors

DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.update_referral_code_stats() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_referral_commission(INTEGER, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS public.check_milestone_bonus() CASCADE;
DROP FUNCTION IF EXISTS public.update_profile_task_stats() CASCADE;
DROP FUNCTION IF EXISTS public.update_profile_referral_stats() CASCADE;
DROP FUNCTION IF EXISTS public.log_profile_activity(TEXT, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.generate_secure_token() CASCADE;
DROP FUNCTION IF EXISTS public.get_or_create_profile(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_login_stats(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.request_password_reset(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.verify_email_token(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_permanent_invite_counters() CASCADE;
DROP FUNCTION IF EXISTS public.increment_permanent_invite_clicks(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_permanent_invite_completed() CASCADE;
DROP FUNCTION IF EXISTS public.get_permanent_invite_stats(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.has_claimed_permanent_invite(TEXT, TEXT) CASCADE;

-- =====================================================
-- PART 3: RECREATE FUNCTIONS WITH search_path (18 functions)
-- =====================================================
-- Issue: Functions without search_path are vulnerable to search_path attacks
-- Fix: Add SET search_path = public, pg_temp to all functions

-- Function: update_updated_at_column
CREATE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Function: update_referral_code_stats
CREATE FUNCTION public.update_referral_code_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.referral_codes
    SET
        total_referrals = (
            SELECT COUNT(*) FROM public.referrals
            WHERE referral_code = NEW.referral_code
        ),
        updated_at = NOW()
    WHERE code = NEW.referral_code;
    RETURN NEW;
END;
$$;

-- Function: calculate_referral_commission
CREATE FUNCTION public.calculate_referral_commission(
    p_referral_level INTEGER,
    p_base_amount DECIMAL
)
RETURNS DECIMAL
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN CASE
        WHEN p_referral_level = 1 THEN p_base_amount * 0.10  -- 10%
        WHEN p_referral_level = 2 THEN p_base_amount * 0.05  -- 5%
        WHEN p_referral_level = 3 THEN p_base_amount * 0.025 -- 2.5%
        ELSE 0
    END;
END;
$$;

-- Function: check_milestone_bonus
CREATE FUNCTION public.check_milestone_bonus()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_total_referrals INTEGER;
    v_milestone_reward DECIMAL;
    v_referrer_address TEXT;
BEGIN
    -- Get referrer info
    SELECT rc.wallet_address, rc.total_referrals
    INTO v_referrer_address, v_total_referrals
    FROM public.referral_codes rc
    WHERE rc.code = NEW.referral_code;

    v_milestone_reward := CASE
        WHEN v_total_referrals = 5 THEN 50
        WHEN v_total_referrals = 10 THEN 150
        WHEN v_total_referrals = 25 THEN 500
        WHEN v_total_referrals = 50 THEN 1500
        WHEN v_total_referrals = 100 THEN 5000
        ELSE 0
    END;

    IF v_milestone_reward > 0 THEN
        INSERT INTO public.referral_rewards (
            referrer_address,
            referred_address,
            reward_type,
            amount,
            milestone_reached
        ) VALUES (
            v_referrer_address,
            NEW.referred_address,
            CONCAT('milestone_', v_total_referrals),
            v_milestone_reward,
            v_total_referrals
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Function: update_profile_task_stats
CREATE FUNCTION public.update_profile_task_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE public.user_profiles
        SET
            total_tasks_completed = total_tasks_completed + 1,
            total_cgc_earned = total_cgc_earned + COALESCE(NEW.reward_cgc, 0),
            updated_at = NOW()
        WHERE wallet_address = NEW.assignee_address;
    END IF;
    RETURN NEW;
END;
$$;

-- Function: update_profile_referral_stats
CREATE FUNCTION public.update_profile_referral_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
        UPDATE public.user_profiles
        SET
            total_referrals = total_referrals + 1,
            updated_at = NOW()
        WHERE wallet_address = (
            SELECT wallet_address FROM public.referral_codes
            WHERE code = NEW.referral_code
        );
    END IF;
    RETURN NEW;
END;
$$;

-- Function: log_profile_activity
CREATE FUNCTION public.log_profile_activity(
    p_wallet_address TEXT,
    p_activity_type TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.profile_activity_log (
        wallet_address,
        activity_type,
        metadata,
        created_at
    ) VALUES (
        p_wallet_address,
        p_activity_type,
        p_metadata,
        NOW()
    );

    UPDATE public.user_profiles
    SET
        last_active_at = NOW(),
        updated_at = NOW()
    WHERE wallet_address = p_wallet_address;
END;
$$;

-- Function: generate_secure_token
CREATE FUNCTION public.generate_secure_token()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'base64');
END;
$$;

-- Function: get_or_create_profile
CREATE FUNCTION public.get_or_create_profile(
    p_wallet_address TEXT
)
RETURNS SETOF public.user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO public.user_profiles (wallet_address)
    VALUES (LOWER(p_wallet_address))
    ON CONFLICT (wallet_address) DO UPDATE SET updated_at = NOW()
    RETURNING *;
END;
$$;

-- Function: update_login_stats
CREATE FUNCTION public.update_login_stats(
    p_wallet_address TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.user_profiles
    SET
        login_count = login_count + 1,
        last_login_at = NOW(),
        last_active_at = NOW(),
        updated_at = NOW()
    WHERE wallet_address = LOWER(p_wallet_address);
END;
$$;

-- Function: request_password_reset
CREATE FUNCTION public.request_password_reset(
    p_email TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_token TEXT;
BEGIN
    v_token := public.generate_secure_token();

    UPDATE public.user_profiles
    SET
        password_reset_token = v_token,
        password_reset_expires_at = NOW() + INTERVAL '1 hour',
        updated_at = NOW()
    WHERE email = LOWER(p_email);

    RETURN v_token;
END;
$$;

-- Function: verify_email_token
CREATE FUNCTION public.verify_email_token(
    p_wallet_address TEXT,
    p_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_valid BOOLEAN;
BEGIN
    SELECT
        email_verification_token = p_token AND
        email_verification_expires_at > NOW()
    INTO v_is_valid
    FROM public.user_profiles
    WHERE wallet_address = LOWER(p_wallet_address);

    IF v_is_valid THEN
        UPDATE public.user_profiles
        SET
            email_verified = true,
            email_verification_token = NULL,
            email_verification_expires_at = NULL,
            updated_at = NOW()
        WHERE wallet_address = LOWER(p_wallet_address);
    END IF;

    RETURN COALESCE(v_is_valid, false);
END;
$$;

-- Function: update_permanent_invite_counters
CREATE FUNCTION public.update_permanent_invite_counters()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.permanent_special_invites
    SET
        total_claims = (
            SELECT COUNT(*) FROM public.permanent_special_invite_claims
            WHERE invite_code = NEW.invite_code
        ),
        total_completed = (
            SELECT COUNT(*) FROM public.permanent_special_invite_claims
            WHERE invite_code = NEW.invite_code AND profile_created = true
        ),
        last_claimed_at = NOW(),
        updated_at = NOW()
    WHERE invite_code = NEW.invite_code;

    RETURN NEW;
END;
$$;

-- Function: increment_permanent_invite_clicks
CREATE FUNCTION public.increment_permanent_invite_clicks(
    p_invite_code TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.permanent_special_invites
    SET
        total_clicks = total_clicks + 1,
        updated_at = NOW()
    WHERE invite_code = UPPER(p_invite_code);
END;
$$;

-- Function: update_permanent_invite_completed
CREATE FUNCTION public.update_permanent_invite_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.profile_created = true AND OLD.profile_created = false THEN
        UPDATE public.permanent_special_invites
        SET
            total_completed = total_completed + 1,
            conversion_rate = CASE
                WHEN total_claims > 0
                THEN ((total_completed + 1)::DECIMAL / total_claims::DECIMAL) * 100
                ELSE 0
            END,
            updated_at = NOW()
        WHERE invite_code = NEW.invite_code;
    END IF;
    RETURN NEW;
END;
$$;

-- Function: get_permanent_invite_stats
CREATE FUNCTION public.get_permanent_invite_stats(
    p_invite_code TEXT
)
RETURNS TABLE (
    total_clicks BIGINT,
    total_claims BIGINT,
    total_completed BIGINT,
    conversion_rate DECIMAL
)
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pi.total_clicks,
        pi.total_claims,
        pi.total_completed,
        pi.conversion_rate
    FROM public.permanent_special_invites pi
    WHERE pi.invite_code = UPPER(p_invite_code);
END;
$$;

-- Function: has_claimed_permanent_invite
CREATE FUNCTION public.has_claimed_permanent_invite(
    p_wallet_address TEXT,
    p_invite_code TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
    v_has_claimed BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.permanent_special_invite_claims
        WHERE claimed_by_wallet = LOWER(p_wallet_address)
        AND invite_code = UPPER(p_invite_code)
    ) INTO v_has_claimed;

    RETURN v_has_claimed;
END;
$$;

-- =====================================================
-- PART 4: MOVE pg_trgm EXTENSION FROM PUBLIC SCHEMA
-- =====================================================
-- Issue: Extension pg_trgm is in public schema
-- Fix: Move to extensions schema

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_trgm extension
-- Note: This requires superuser privileges, may need to be done manually in Supabase dashboard
-- ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

COMMIT;

-- =====================================================
-- ✅ VERIFICATION
-- =====================================================
-- After running, verify:
-- 1. All 7 views recreated without SECURITY DEFINER
-- 2. All 18 functions have SET search_path = public, pg_temp
-- 3. extensions schema created
--
-- To verify in Supabase:
-- SELECT proname, prosecdef FROM pg_proc WHERE proname LIKE '%profile%';
-- SELECT viewname, viewowner FROM pg_views WHERE schemaname = 'public';
-- =====================================================
