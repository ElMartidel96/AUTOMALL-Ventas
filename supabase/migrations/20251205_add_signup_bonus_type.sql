-- =====================================================
-- 🎯 ADD SIGNUP_BONUS TO REWARD_TYPE CONSTRAINT
-- =====================================================
-- Created: 2025-12-05
-- Purpose: Fix constraint violation for signup bonus
--
-- Issue: reward_type constraint doesn't include 'signup_bonus'
-- Fix: Add 'signup_bonus' to allowed values
--
-- Made by mbxarts.com The Moon in a Box property
-- Co-Author: Godez22
-- =====================================================

BEGIN;

-- Drop existing constraint
ALTER TABLE public.referral_rewards
DROP CONSTRAINT IF EXISTS referral_rewards_reward_type_check;

-- Recreate constraint with signup_bonus
ALTER TABLE public.referral_rewards
ADD CONSTRAINT referral_rewards_reward_type_check
CHECK (reward_type IN (
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
    'signup_bonus'       -- 🆕 Permanent invite signup bonus (200 CGC)
));

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- After running this, test with:
-- INSERT INTO referral_rewards (referrer_address, referred_address, reward_type, amount)
-- VALUES ('0x123...', '0x456...', 'signup_bonus', 200.00);
-- Should work without constraint violation
-- =====================================================
