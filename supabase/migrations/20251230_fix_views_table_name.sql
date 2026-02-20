-- =============================================================================
-- MIGRATION: Fix Views Using Wrong Table Name
-- Date: 2025-12-30
-- Purpose: Fix views that reference 'profiles' table (doesn't exist)
--          instead of 'user_profiles' (the actual table)
-- =============================================================================

-- Made by mbxarts.com The Moon in a Box property
-- Co-Author: Godez22

-- =============================================================================
-- CONTEXT: The previous security migration (20251230_fix_security_advisor_errors.sql)
-- incorrectly referenced 'profiles' table, but our actual table is 'user_profiles'
-- as defined in 002_user_profiles.sql
-- =============================================================================

-- Fix 1: leaderboard_view - uses user_profiles not profiles
DROP VIEW IF EXISTS public.leaderboard_view;
CREATE VIEW public.leaderboard_view
WITH (security_invoker = true)
AS
SELECT
  p.wallet_address,
  p.display_name,
  p.avatar_url,
  p.total_cgc_earned,
  p.total_tasks_completed as tasks_completed,
  COALESCE(p.role, 'member') as role,
  COALESCE(p.level, 1) as level,
  COALESCE(p.xp, 0) as xp,
  RANK() OVER (ORDER BY p.total_cgc_earned DESC) as rank
FROM user_profiles p
WHERE p.is_active = true
ORDER BY p.total_cgc_earned DESC;

-- Fix 2: profile_leaderboard - uses user_profiles not profiles
DROP VIEW IF EXISTS public.profile_leaderboard;
CREATE VIEW public.profile_leaderboard
WITH (security_invoker = true)
AS
SELECT
  wallet_address,
  display_name,
  avatar_url,
  total_cgc_earned,
  total_tasks_completed as tasks_completed,
  COALESCE(role, 'member') as role,
  COALESCE(level, 1) as level,
  COALESCE(xp, 0) as xp,
  RANK() OVER (ORDER BY total_cgc_earned DESC) as rank
FROM user_profiles
WHERE is_active = true
ORDER BY total_cgc_earned DESC
LIMIT 100;

-- Fix 3: public_profiles - uses user_profiles not profiles
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT
  wallet_address,
  display_name,
  avatar_url,
  bio,
  COALESCE(role, 'member') as role,
  COALESCE(level, 1) as level,
  COALESCE(xp, 0) as xp,
  total_cgc_earned,
  total_tasks_completed as tasks_completed,
  created_at
FROM user_profiles
WHERE is_active = true AND is_public = true;

-- Fix 4: referral_leaderboard - uses user_profiles for profiles join
DROP VIEW IF EXISTS public.referral_leaderboard;
CREATE VIEW public.referral_leaderboard
WITH (security_invoker = true)
AS
SELECT
  rc.wallet_address,
  rc.referral_code,
  p.display_name,
  p.avatar_url,
  COUNT(DISTINCT r.referred_wallet) as total_referrals,
  COALESCE(SUM(rr.amount), 0) as total_earnings,
  rc.tier,
  RANK() OVER (ORDER BY COUNT(DISTINCT r.referred_wallet) DESC) as rank
FROM referral_codes rc
LEFT JOIN referrals r ON rc.wallet_address = r.referrer_wallet
LEFT JOIN referral_rewards rr ON rc.wallet_address = rr.wallet_address
LEFT JOIN user_profiles p ON rc.wallet_address = p.wallet_address
GROUP BY rc.wallet_address, rc.referral_code, rc.tier, p.display_name, p.avatar_url
ORDER BY total_referrals DESC;

-- Fix 5: referral_network - uses user_profiles for profiles join
DROP VIEW IF EXISTS public.referral_network;
CREATE VIEW public.referral_network
WITH (security_invoker = true)
AS
SELECT
  r.referrer_wallet,
  r.referred_wallet,
  r.level,
  r.status,
  r.created_at,
  p.display_name as referred_display_name,
  p.avatar_url as referred_avatar
FROM referrals r
LEFT JOIN user_profiles p ON r.referred_wallet = p.wallet_address
WHERE r.status = 'active';

-- Fix 6: active_tasks_with_assignees - uses user_profiles for profiles join
DROP VIEW IF EXISTS public.active_tasks_with_assignees;
CREATE VIEW public.active_tasks_with_assignees
WITH (security_invoker = true)
AS
SELECT
  t.id,
  t.title,
  t.description,
  t.category,
  t.difficulty,
  t.cgc_reward,
  t.xp_reward,
  t.status,
  t.assignee_wallet,
  t.estimated_hours,
  t.due_date,
  t.created_at,
  p.display_name as assignee_name,
  p.avatar_url as assignee_avatar
FROM tasks t
LEFT JOIN user_profiles p ON t.assignee_wallet = p.wallet_address
WHERE t.status IN ('available', 'claimed', 'in_progress')
ORDER BY t.created_at DESC;

-- Fix 7: v_proposals_with_stats - uses user_profiles for profiles join
DROP VIEW IF EXISTS public.v_proposals_with_stats;
CREATE VIEW public.v_proposals_with_stats
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.title,
  p.description,
  p.proposal_type,
  p.status,
  p.creator_wallet,
  p.start_date,
  p.end_date,
  p.created_at,
  p.aragon_proposal_id,
  p.votes_for,
  p.votes_against,
  p.votes_abstain,
  p.total_voting_power,
  pr.display_name as creator_name,
  pr.avatar_url as creator_avatar,
  CASE
    WHEN p.end_date < NOW() THEN 'ended'
    WHEN p.start_date > NOW() THEN 'pending'
    ELSE 'active'
  END as time_status
FROM proposals p
LEFT JOIN user_profiles pr ON p.creator_wallet = pr.wallet_address;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Views fixed to use user_profiles table';
  RAISE NOTICE '✅ 7 views updated with correct table name';
END $$;

SELECT 'Views table name fix completed' as status;
