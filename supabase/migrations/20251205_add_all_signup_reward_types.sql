-- =====================================================
-- 🎯 ADD ALL SIGNUP REWARD TYPES TO CONSTRAINT
-- =====================================================
-- Created: 2025-12-05
-- Purpose: Fix constraint violation for signup commissions
--
-- Issue: reward_type constraint is missing commission types:
--   - signup_commission_l1 (20 CGC to level 1 referrer)
--   - signup_commission_l2 (10 CGC to level 2 referrer)
--   - signup_commission_l3 (5 CGC to level 3 referrer)
--
-- Fix: Add ALL signup-related reward types to allowed values
--
-- Made by mbxarts.com The Moon in a Box property
-- Co-Author: Godez22
-- =====================================================

BEGIN;

-- Drop existing constraint
ALTER TABLE public.referral_rewards
DROP CONSTRAINT IF EXISTS referral_rewards_reward_type_check;

-- Recreate constraint with ALL reward types (existing + new)
ALTER TABLE public.referral_rewards
ADD CONSTRAINT referral_rewards_reward_type_check
CHECK (reward_type IN (
    -- 🏆 ORIGINAL TYPES (from 001_referral_system.sql)
    'direct_bonus',      -- Level 1: 10%
    'level2_bonus',      -- Level 2: 5%
    'level3_bonus',      -- Level 3: 2.5%
    'milestone_5',       -- 5 referrals: 50 CGC
    'milestone_10',      -- 10 referrals: 150 CGC
    'milestone_25',      -- 25 referrals: 500 CGC
    'milestone_50',      -- 50 referrals: 1500 CGC
    'milestone_100',     -- 100 referrals: 5000 CGC
    'activation_bonus',  -- When referral becomes active
    'special_bonus',     -- Manual/promotional bonus

    -- 💰 SIGNUP BONUS SYSTEM (new user receives this)
    'signup_bonus',      -- New user signup bonus (200 CGC)

    -- 📈 SIGNUP COMMISSIONS (referrers receive these)
    'signup_commission_l1',  -- Level 1 commission: 20 CGC (10% of 200)
    'signup_commission_l2',  -- Level 2 commission: 10 CGC (5% of 200)
    'signup_commission_l3'   -- Level 3 commission: 5 CGC (2.5% of 200)
));

COMMIT;

-- =====================================================
-- ✅ VERIFICATION
-- =====================================================
-- After running this, test with:
--
-- -- Test signup bonus (new user)
-- INSERT INTO referral_rewards (referrer_address, referred_address, reward_type, amount, status)
-- VALUES ('0x123...', '0x123...', 'signup_bonus', 200.00, 'paid');
--
-- -- Test level 1 commission (direct referrer)
-- INSERT INTO referral_rewards (referrer_address, referred_address, reward_type, amount, status)
-- VALUES ('0xAAA...', '0x123...', 'signup_commission_l1', 20.00, 'paid');
--
-- -- Test level 2 commission (referrer's referrer)
-- INSERT INTO referral_rewards (referrer_address, referred_address, reward_type, amount, status)
-- VALUES ('0xBBB...', '0x123...', 'signup_commission_l2', 10.00, 'paid');
--
-- -- Test level 3 commission (top of chain)
-- INSERT INTO referral_rewards (referrer_address, referred_address, reward_type, amount, status)
-- VALUES ('0xCCC...', '0x123...', 'signup_commission_l3', 5.00, 'paid');
--
-- All 4 inserts should work without constraint violation.
-- =====================================================
