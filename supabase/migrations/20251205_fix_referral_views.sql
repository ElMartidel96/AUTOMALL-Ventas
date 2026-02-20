-- =====================================================
-- 🔧 FIX REFERRAL VIEWS - CRITICAL FIX
-- =====================================================
-- Created: 2025-12-05
-- Purpose: Fix referral_network and referral_leaderboard views
--
-- CRITICAL ISSUES FIXED:
-- 1. referral_network was filtering by status='active' only (hiding pending referrals)
-- 2. referral_network was missing referrer_address column (service queries by this)
-- 3. referral_network was missing critical fields (tasks_completed, cgc_earned, etc.)
-- 4. referral_leaderboard was using wrong column names
--
-- Made by mbxarts.com The Moon in a Box property
-- Co-Author: Godez22
-- =====================================================

BEGIN;

-- =====================================================
-- FIX 1: RECREATE referral_network VIEW (CRITICAL)
-- =====================================================
-- Issue: View was filtering WHERE status='active' AND missing referrer_address
-- Fix: Show ALL referrals and include ALL necessary fields

DROP VIEW IF EXISTS public.referral_network CASCADE;
CREATE VIEW public.referral_network AS
SELECT
  r.id,
  r.referrer_address,              -- ✅ ADDED - Service queries by this
  r.referred_address,
  r.referral_code,
  r.level,
  r.status,
  r.tasks_completed,                -- ✅ ADDED - Required by service
  r.cgc_earned,                     -- ✅ ADDED - Required by service
  r.referrer_earnings,              -- ✅ ADDED - Required by service
  r.joined_at,
  r.last_activity,                  -- ✅ ADDED - Required by service
  r.source,
  r.campaign,
  -- Profile data from referred user
  p2.username as username,
  p2.display_name as display_name,
  p2.avatar_url as avatar,
  -- Profile data from referrer (for info)
  p1.username as referrer_username
FROM public.referrals r
LEFT JOIN public.referral_codes rc ON r.referral_code = rc.code
LEFT JOIN public.user_profiles p1 ON rc.wallet_address = p1.wallet_address
LEFT JOIN public.user_profiles p2 ON r.referred_address = p2.wallet_address;
-- ✅ REMOVED: WHERE r.status = 'active' (was hiding pending referrals!)

-- =====================================================
-- FIX 2: RECREATE referral_leaderboard VIEW
-- =====================================================
-- Issue: View using wrong column names from referral_codes
-- Fix: Use correct column names (code, total_earnings)

DROP VIEW IF EXISTS public.referral_leaderboard CASCADE;
CREATE VIEW public.referral_leaderboard AS
SELECT
  ROW_NUMBER() OVER (ORDER BY rc.total_earnings DESC, rc.total_referrals DESC) as rank,
  ROW_NUMBER() OVER (ORDER BY rc.total_earnings DESC) as earnings_rank,
  ROW_NUMBER() OVER (ORDER BY rc.total_referrals DESC) as referrals_rank,
  rc.wallet_address,
  rc.code,
  rc.custom_code,
  rc.total_referrals,
  rc.total_earnings,
  rc.click_count,
  rc.conversion_rate,
  rc.created_at,
  -- Profile data
  p.username,
  p.display_name,
  p.avatar_url,
  -- Network breakdown (calculate from referrals table)
  COALESCE(
    (SELECT COUNT(*) FROM public.referrals
     WHERE referrer_address = rc.wallet_address AND level = 1),
    0
  ) as level1_count,
  COALESCE(
    (SELECT COUNT(*) FROM public.referrals
     WHERE referrer_address = rc.wallet_address AND level = 2),
    0
  ) as level2_count,
  COALESCE(
    (SELECT COUNT(*) FROM public.referrals
     WHERE referrer_address = rc.wallet_address AND level = 3),
    0
  ) as level3_count
FROM public.referral_codes rc
LEFT JOIN public.user_profiles p ON rc.wallet_address = p.wallet_address
WHERE rc.is_active = true
ORDER BY rc.total_earnings DESC, rc.total_referrals DESC;

COMMIT;

-- =====================================================
-- ✅ VERIFICATION
-- =====================================================
-- After running, test with:
-- SELECT * FROM referral_network WHERE referrer_address = '0x...';
-- SELECT * FROM referral_leaderboard LIMIT 10;
-- =====================================================
