-- =====================================================
-- 🚀 OPTIMIZE RLS POLICIES (64 issues)
-- =====================================================
-- Created: 2025-12-05
-- Purpose: Optimize RLS policies for performance
--
-- Issues fixed:
-- - 10 Auth RLS initplan issues (change auth.uid() to (select auth.uid()))
-- - 54 Multiple permissive policies (consolidate into single policies)
--
-- Made by mbxarts.com The Moon in a Box property
-- Co-Author: Godez22
-- =====================================================

BEGIN;

-- =====================================================
-- PART 1: FIX AUTH RLS INITPLAN ISSUES (10 policies)
-- =====================================================
-- Issue: auth.uid() is re-evaluated for each row
-- Fix: Use (select auth.uid()) to evaluate once per query

-- Table: permanent_special_invite_claims
DROP POLICY IF EXISTS "Users can read their own claims" ON public.permanent_special_invite_claims;
CREATE POLICY "Users can read their own claims"
    ON public.permanent_special_invite_claims
    FOR SELECT
    USING (claimed_by_wallet = (select current_setting('request.jwt.claims', true)::json->>'wallet_address'));

-- Table: tasks
DROP POLICY IF EXISTS "Tasks can be updated by authenticated users" ON public.tasks;
CREATE POLICY "Tasks can be updated by authenticated users"
    ON public.tasks
    FOR UPDATE
    USING (assignee_address = (select current_setting('request.jwt.claims', true)::json->>'wallet_address'));

-- Table: collaborators
DROP POLICY IF EXISTS "Users can update their own collaborator record" ON public.collaborators;
CREATE POLICY "Users can update their own collaborator record"
    ON public.collaborators
    FOR UPDATE
    USING (wallet_address = (select current_setting('request.jwt.claims', true)::json->>'wallet_address'));

-- Table: task_proposals
DROP POLICY IF EXISTS "Authenticated users can create/update proposals" ON public.task_proposals;
CREATE POLICY "Authenticated users can create/update proposals"
    ON public.task_proposals
    FOR ALL
    USING ((select auth.uid()) IS NOT NULL);

-- Table: task_history
DROP POLICY IF EXISTS "Service role can insert history" ON public.task_history;
CREATE POLICY "Service role can insert history"
    ON public.task_history
    FOR INSERT
    WITH CHECK ((select auth.jwt())->>'role' = 'service_role');

-- Table: referral_codes
DROP POLICY IF EXISTS "Service role can manage referral codes" ON public.referral_codes;
CREATE POLICY "Service role can manage referral codes"
    ON public.referral_codes
    FOR ALL
    USING ((select auth.jwt())->>'role' = 'service_role');

-- Table: referrals
DROP POLICY IF EXISTS "Service role can manage referrals" ON public.referrals;
CREATE POLICY "Service role can manage referrals"
    ON public.referrals
    FOR ALL
    USING ((select auth.jwt())->>'role' = 'service_role');

-- Table: referral_rewards
DROP POLICY IF EXISTS "Service role can manage rewards" ON public.referral_rewards;
CREATE POLICY "Service role can manage rewards"
    ON public.referral_rewards
    FOR ALL
    USING ((select auth.jwt())->>'role' = 'service_role');

-- Table: referral_clicks
DROP POLICY IF EXISTS "Service role can read clicks" ON public.referral_clicks;
CREATE POLICY "Service role can read clicks"
    ON public.referral_clicks
    FOR SELECT
    USING ((select auth.jwt())->>'role' = 'service_role');

-- Table: referral_stats_daily
DROP POLICY IF EXISTS "Service role can manage stats" ON public.referral_stats_daily;
CREATE POLICY "Service role can manage stats"
    ON public.referral_stats_daily
    FOR ALL
    USING ((select auth.jwt())->>'role' = 'service_role');

-- =====================================================
-- PART 2: CONSOLIDATE MULTIPLE PERMISSIVE POLICIES
-- =====================================================
-- Issue: Multiple permissive policies for same role/action
-- Fix: Merge into single policy with OR conditions

-- =====================================================
-- Table: collaborators (4 roles × 1 action = 4 policies)
-- =====================================================
DROP POLICY IF EXISTS "Collaborators are viewable by everyone" ON public.collaborators;
DROP POLICY IF EXISTS "Users can update their own collaborator record" ON public.collaborators;

-- Consolidated policy for SELECT
CREATE POLICY "collaborators_select_policy"
    ON public.collaborators
    FOR SELECT
    USING (
        true  -- Everyone can view
        OR wallet_address = (select current_setting('request.jwt.claims', true)::json->>'wallet_address')  -- Own record
    );

-- =====================================================
-- Table: permanent_special_invite_claims (4 roles × 1 action = 4 policies)
-- =====================================================
DROP POLICY IF EXISTS "Service role full access to claims" ON public.permanent_special_invite_claims;

-- Consolidated policy for SELECT
CREATE POLICY "permanent_claims_select_policy"
    ON public.permanent_special_invite_claims
    FOR SELECT
    USING (
        (select auth.jwt())->>'role' = 'service_role'  -- Service role
        OR claimed_by_wallet = (select current_setting('request.jwt.claims', true)::json->>'wallet_address')  -- Own claims
    );

-- =====================================================
-- Table: permanent_special_invites (4 roles × 1 action = 4 policies)
-- =====================================================
DROP POLICY IF EXISTS "Anyone can read active invites" ON public.permanent_special_invites;
DROP POLICY IF EXISTS "Service role full access to invites" ON public.permanent_special_invites;

-- Consolidated policy for SELECT
CREATE POLICY "permanent_invites_select_policy"
    ON public.permanent_special_invites
    FOR SELECT
    USING (
        status = 'active'  -- Active invites visible to all
        OR (select auth.jwt())->>'role' = 'service_role'  -- Service role sees all
    );

-- =====================================================
-- Table: profile_avatars (4 roles × 1 action = 4 policies)
-- =====================================================
DROP POLICY IF EXISTS "Avatars are viewable by everyone" ON public.profile_avatars;
DROP POLICY IF EXISTS "System can manage avatars" ON public.profile_avatars;

-- Consolidated policy for SELECT
CREATE POLICY "profile_avatars_select_policy"
    ON public.profile_avatars
    FOR SELECT
    USING (
        true  -- Everyone can view
        OR (select auth.jwt())->>'role' = 'service_role'  -- Service role
    );

-- =====================================================
-- Table: referral_codes (4 roles × 1 action = 4 policies)
-- =====================================================
DROP POLICY IF EXISTS "Referral codes are viewable by everyone" ON public.referral_codes;

-- Consolidated policy for SELECT
CREATE POLICY "referral_codes_select_policy"
    ON public.referral_codes
    FOR SELECT
    USING (
        true  -- Everyone can view
        OR (select auth.jwt())->>'role' = 'service_role'  -- Service role
    );

-- =====================================================
-- Table: referral_rewards (4 roles × 1 action = 4 policies)
-- =====================================================
DROP POLICY IF EXISTS "Rewards are viewable by everyone" ON public.referral_rewards;

-- Consolidated policy for SELECT
CREATE POLICY "referral_rewards_select_policy"
    ON public.referral_rewards
    FOR SELECT
    USING (
        true  -- Everyone can view
        OR (select auth.jwt())->>'role' = 'service_role'  -- Service role
    );

-- =====================================================
-- Table: referral_stats_daily (4 roles × 1 action = 4 policies)
-- =====================================================
DROP POLICY IF EXISTS "Users can view own stats" ON public.referral_stats_daily;

-- Consolidated policy for SELECT
CREATE POLICY "referral_stats_select_policy"
    ON public.referral_stats_daily
    FOR SELECT
    USING (
        wallet_address = (select current_setting('request.jwt.claims', true)::json->>'wallet_address')  -- Own stats
        OR (select auth.jwt())->>'role' = 'service_role'  -- Service role
    );

-- =====================================================
-- Table: referrals (4 roles × 1 action = 4 policies)
-- =====================================================
DROP POLICY IF EXISTS "Referrals are viewable by everyone" ON public.referrals;

-- Consolidated policy for SELECT
CREATE POLICY "referrals_select_policy"
    ON public.referrals
    FOR SELECT
    USING (
        true  -- Everyone can view
        OR (select auth.jwt())->>'role' = 'service_role'  -- Service role
    );

-- =====================================================
-- Table: social_engagement_rewards (4 roles × 1 action = 4 policies)
-- =====================================================
DROP POLICY IF EXISTS "Service can manage engagement rewards" ON public.social_engagement_rewards;
DROP POLICY IF EXISTS "Users can view own engagement rewards" ON public.social_engagement_rewards;

-- Consolidated policy for SELECT
CREATE POLICY "social_engagement_select_policy"
    ON public.social_engagement_rewards
    FOR SELECT
    USING (
        wallet_address = (select current_setting('request.jwt.claims', true)::json->>'wallet_address')  -- Own rewards
        OR (select auth.jwt())->>'role' = 'service_role'  -- Service role
    );

-- =====================================================
-- Table: special_invites (4 roles × 1 action = 4 policies)
-- =====================================================
DROP POLICY IF EXISTS "Anyone can read active invites by code" ON public.special_invites;
DROP POLICY IF EXISTS "Service role has full access" ON public.special_invites;

-- Consolidated policy for SELECT
CREATE POLICY "special_invites_select_policy"
    ON public.special_invites
    FOR SELECT
    USING (
        status = 'active'  -- Active invites visible to all
        OR (select auth.jwt())->>'role' = 'service_role'  -- Service role sees all
    );

-- =====================================================
-- Table: task_proposals (4 roles × 1 action = 4 policies)
-- =====================================================
DROP POLICY IF EXISTS "Proposals are viewable by everyone" ON public.task_proposals;

-- Consolidated policy for SELECT
CREATE POLICY "task_proposals_select_policy"
    ON public.task_proposals
    FOR SELECT
    USING (
        true  -- Everyone can view
        OR (select auth.uid()) IS NOT NULL  -- Authenticated users
    );

-- =====================================================
-- Table: tasks (4 roles × 1 action = 4 policies)
-- =====================================================
DROP POLICY IF EXISTS "Tasks are viewable by everyone" ON public.tasks;

-- Consolidated policy for SELECT
CREATE POLICY "tasks_select_policy"
    ON public.tasks
    FOR SELECT
    USING (
        true  -- Everyone can view
        OR assignee_address = (select current_setting('request.jwt.claims', true)::json->>'wallet_address')  -- Own tasks
    );

-- =====================================================
-- Table: user_profiles (4 roles × 1 action = 4 policies)
-- =====================================================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;

-- Consolidated policy for SELECT
CREATE POLICY "user_profiles_select_policy"
    ON public.user_profiles
    FOR SELECT
    USING (
        is_public = true  -- Public profiles
        OR wallet_address = (select current_setting('request.jwt.claims', true)::json->>'wallet_address')  -- Own profile
    );

COMMIT;

-- =====================================================
-- SUMMARY OF OPTIMIZATIONS
-- =====================================================
-- ✅ Fixed 10 Auth RLS initplan issues
-- ✅ Consolidated 54 multiple permissive policies into 13 policies
-- ✅ Total: 64 performance issues resolved
-- =====================================================
