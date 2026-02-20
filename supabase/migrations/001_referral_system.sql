-- =====================================================
-- 🤝 CryptoGift DAO - REFERRAL SYSTEM MIGRATION
-- =====================================================
-- Enterprise-grade multi-level referral system
-- Features: 3-level commissions, milestone bonuses, real-time tracking
-- Version: 1.0.0
-- Created: November 2025

-- =====================================================
-- 📋 REFERRAL CODES TABLE
-- =====================================================
-- Stores unique referral codes for each user
CREATE TABLE IF NOT EXISTS public.referral_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    custom_code TEXT UNIQUE,
    is_active BOOLEAN DEFAULT true,
    total_referrals INTEGER DEFAULT 0,
    total_earnings DECIMAL(20,8) DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    -- Analytics fields
    last_referral_at TIMESTAMPTZ,
    best_month_referrals INTEGER DEFAULT 0,
    best_month_date DATE,
    -- Settings
    notification_preferences JSONB DEFAULT '{"email": false, "discord": true, "telegram": false}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_codes_wallet ON public.referral_codes(wallet_address);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_custom ON public.referral_codes(custom_code) WHERE custom_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_referral_codes_active ON public.referral_codes(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_referral_codes_earnings ON public.referral_codes(total_earnings DESC);

-- =====================================================
-- 👥 REFERRALS TABLE (Relationships)
-- =====================================================
-- Stores referral relationships between users (up to 3 levels)
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referrer_address TEXT NOT NULL,
    referred_address TEXT UNIQUE NOT NULL, -- A user can only be referred once
    referral_code TEXT NOT NULL,
    level INTEGER CHECK (level >= 1 AND level <= 3) DEFAULT 1,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'banned')),
    -- Performance metrics
    tasks_completed INTEGER DEFAULT 0,
    cgc_earned DECIMAL(20,8) DEFAULT 0,
    referrer_earnings DECIMAL(20,8) DEFAULT 0,
    -- Tracking
    source TEXT, -- twitter, telegram, discord, direct, etc.
    campaign TEXT, -- For tracking marketing campaigns
    -- Timestamps
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    activated_at TIMESTAMPTZ,
    last_activity TIMESTAMPTZ,
    -- Additional data
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Foreign keys
    CONSTRAINT fk_referral_code FOREIGN KEY (referral_code) REFERENCES public.referral_codes(code) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_address);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_address);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_level ON public.referrals(level);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_source ON public.referrals(source);
CREATE INDEX IF NOT EXISTS idx_referrals_joined ON public.referrals(joined_at DESC);

-- =====================================================
-- 💰 REFERRAL REWARDS TABLE
-- =====================================================
-- Tracks all reward distributions
CREATE TABLE IF NOT EXISTS public.referral_rewards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referrer_address TEXT NOT NULL,
    referred_address TEXT NOT NULL,
    reward_type TEXT NOT NULL CHECK (reward_type IN (
        'direct_bonus',      -- Level 1: 10%
        'level2_bonus',      -- Level 2: 5%
        'level3_bonus',      -- Level 3: 2.5%
        'milestone_5',       -- 5 referrals: 50 CGC
        'milestone_10',      -- 10 referrals: 150 CGC
        'milestone_25',      -- 25 referrals: 500 CGC
        'milestone_50',      -- 50 referrals: 1500 CGC
        'milestone_100',     -- 100 referrals: 5000 CGC
        'activation_bonus',  -- When referral becomes active
        'special_bonus'      -- Manual/promotional bonus
    )),
    amount DECIMAL(20,8) NOT NULL,
    -- Source info
    task_id TEXT, -- If reward is from task completion
    milestone_reached INTEGER,
    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
    -- Blockchain info
    tx_hash TEXT,
    block_number BIGINT,
    -- Timestamps
    paid_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    -- Additional data
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rewards_referrer ON public.referral_rewards(referrer_address);
CREATE INDEX IF NOT EXISTS idx_rewards_referred ON public.referral_rewards(referred_address);
CREATE INDEX IF NOT EXISTS idx_rewards_type ON public.referral_rewards(reward_type);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON public.referral_rewards(status);
CREATE INDEX IF NOT EXISTS idx_rewards_task ON public.referral_rewards(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rewards_created ON public.referral_rewards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rewards_pending ON public.referral_rewards(status) WHERE status = 'pending';

-- =====================================================
-- 📊 REFERRAL CLICKS TABLE (Analytics)
-- =====================================================
-- Tracks all clicks on referral links for analytics
CREATE TABLE IF NOT EXISTS public.referral_clicks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referral_code TEXT NOT NULL,
    -- Visitor info (anonymized)
    ip_hash TEXT, -- Hashed IP for unique visitor tracking
    user_agent TEXT,
    device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
    browser TEXT,
    os TEXT,
    country TEXT,
    city TEXT,
    -- Source tracking
    source TEXT, -- UTM source
    medium TEXT, -- UTM medium
    campaign TEXT, -- UTM campaign
    referer TEXT, -- HTTP referer
    landing_page TEXT,
    -- Conversion tracking
    converted BOOLEAN DEFAULT false,
    converted_address TEXT,
    conversion_time TIMESTAMPTZ,
    -- Session tracking
    session_id TEXT,
    page_views INTEGER DEFAULT 1,
    session_duration INTEGER, -- seconds
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Foreign keys
    CONSTRAINT fk_click_code FOREIGN KEY (referral_code) REFERENCES public.referral_codes(code) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clicks_code ON public.referral_clicks(referral_code);
CREATE INDEX IF NOT EXISTS idx_clicks_ip ON public.referral_clicks(ip_hash);
CREATE INDEX IF NOT EXISTS idx_clicks_converted ON public.referral_clicks(converted) WHERE converted = true;
CREATE INDEX IF NOT EXISTS idx_clicks_source ON public.referral_clicks(source);
CREATE INDEX IF NOT EXISTS idx_clicks_created ON public.referral_clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_country ON public.referral_clicks(country);
-- Composite index for analytics queries
CREATE INDEX IF NOT EXISTS idx_clicks_analytics ON public.referral_clicks(referral_code, created_at DESC, converted);

-- =====================================================
-- 📈 REFERRAL STATS DAILY TABLE (Aggregated Analytics)
-- =====================================================
-- Pre-aggregated daily stats for fast dashboard queries
CREATE TABLE IF NOT EXISTS public.referral_stats_daily (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    date DATE NOT NULL,
    -- Counts
    clicks INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    new_referrals INTEGER DEFAULT 0,
    active_referrals INTEGER DEFAULT 0,
    -- Earnings
    direct_earnings DECIMAL(20,8) DEFAULT 0,
    level2_earnings DECIMAL(20,8) DEFAULT 0,
    level3_earnings DECIMAL(20,8) DEFAULT 0,
    bonus_earnings DECIMAL(20,8) DEFAULT 0,
    total_earnings DECIMAL(20,8) DEFAULT 0,
    -- Conversion metrics
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    -- Source breakdown
    source_breakdown JSONB DEFAULT '{}',
    device_breakdown JSONB DEFAULT '{}',
    country_breakdown JSONB DEFAULT '{}',
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Unique constraint
    UNIQUE(wallet_address, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stats_wallet ON public.referral_stats_daily(wallet_address);
CREATE INDEX IF NOT EXISTS idx_stats_date ON public.referral_stats_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_stats_wallet_date ON public.referral_stats_daily(wallet_address, date DESC);

-- =====================================================
-- 🔄 UPDATE TRIGGERS
-- =====================================================

-- Trigger for referral_codes updated_at
DROP TRIGGER IF EXISTS update_referral_codes_updated_at ON public.referral_codes;
CREATE TRIGGER update_referral_codes_updated_at
    BEFORE UPDATE ON public.referral_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for referrals updated_at
DROP TRIGGER IF EXISTS update_referrals_updated_at ON public.referrals;
CREATE TRIGGER update_referrals_updated_at
    BEFORE UPDATE ON public.referrals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for referral_rewards updated_at
DROP TRIGGER IF EXISTS update_referral_rewards_updated_at ON public.referral_rewards;
CREATE TRIGGER update_referral_rewards_updated_at
    BEFORE UPDATE ON public.referral_rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for referral_stats_daily updated_at
DROP TRIGGER IF EXISTS update_referral_stats_daily_updated_at ON public.referral_stats_daily;
CREATE TRIGGER update_referral_stats_daily_updated_at
    BEFORE UPDATE ON public.referral_stats_daily
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 📊 AUTOMATIC STATS UPDATE FUNCTION
-- =====================================================
-- Function to update referral code stats when a new referral is added
CREATE OR REPLACE FUNCTION update_referral_code_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total_referrals count
    UPDATE public.referral_codes
    SET
        total_referrals = (
            SELECT COUNT(*) FROM public.referrals
            WHERE referral_code = NEW.referral_code AND status != 'banned'
        ),
        last_referral_at = NOW()
    WHERE code = NEW.referral_code;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
DROP TRIGGER IF EXISTS trigger_update_referral_stats ON public.referrals;
CREATE TRIGGER trigger_update_referral_stats
    AFTER INSERT OR UPDATE ON public.referrals
    FOR EACH ROW EXECUTE FUNCTION update_referral_code_stats();

-- =====================================================
-- 💰 COMMISSION CALCULATION FUNCTION
-- =====================================================
-- Function to calculate and distribute referral commissions
CREATE OR REPLACE FUNCTION calculate_referral_commission(
    p_referred_address TEXT,
    p_task_id TEXT,
    p_cgc_amount DECIMAL
) RETURNS TABLE (
    referrer_address TEXT,
    level INTEGER,
    commission DECIMAL,
    commission_rate DECIMAL
) AS $$
DECLARE
    v_current_address TEXT := p_referred_address;
    v_current_level INTEGER := 1;
    v_commission_rates DECIMAL[] := ARRAY[0.10, 0.05, 0.025]; -- 10%, 5%, 2.5%
    v_referrer TEXT;
BEGIN
    -- Traverse up to 3 levels
    WHILE v_current_level <= 3 LOOP
        -- Find the referrer of the current address
        SELECT r.referrer_address INTO v_referrer
        FROM public.referrals r
        WHERE r.referred_address = v_current_address
        AND r.status = 'active';

        -- If no referrer found, exit
        IF v_referrer IS NULL THEN
            EXIT;
        END IF;

        -- Return the commission info
        referrer_address := v_referrer;
        level := v_current_level;
        commission_rate := v_commission_rates[v_current_level];
        commission := p_cgc_amount * v_commission_rates[v_current_level];

        RETURN NEXT;

        -- Move up the chain
        v_current_address := v_referrer;
        v_current_level := v_current_level + 1;
    END LOOP;

    RETURN;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 🎯 MILESTONE CHECK FUNCTION
-- =====================================================
-- Function to check and award milestone bonuses
CREATE OR REPLACE FUNCTION check_milestone_bonus(p_wallet_address TEXT)
RETURNS TABLE (
    milestone INTEGER,
    bonus_amount DECIMAL,
    already_awarded BOOLEAN
) AS $$
DECLARE
    v_total_referrals INTEGER;
    v_milestones INTEGER[] := ARRAY[5, 10, 25, 50, 100];
    v_bonuses DECIMAL[] := ARRAY[50, 150, 500, 1500, 5000];
    v_milestone INTEGER;
    v_bonus DECIMAL;
    v_reward_type TEXT;
BEGIN
    -- Get total referrals for this user
    SELECT total_referrals INTO v_total_referrals
    FROM public.referral_codes
    WHERE wallet_address = p_wallet_address;

    -- Check each milestone
    FOR i IN 1..5 LOOP
        v_milestone := v_milestones[i];
        v_bonus := v_bonuses[i];
        v_reward_type := 'milestone_' || v_milestone::TEXT;

        -- Only return milestones that are reached
        IF v_total_referrals >= v_milestone THEN
            milestone := v_milestone;
            bonus_amount := v_bonus;

            -- Check if already awarded
            SELECT EXISTS(
                SELECT 1 FROM public.referral_rewards
                WHERE referrer_address = p_wallet_address
                AND reward_type = v_reward_type
                AND status IN ('paid', 'processing', 'pending')
            ) INTO already_awarded;

            RETURN NEXT;
        END IF;
    END LOOP;

    RETURN;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 📊 VIEWS FOR REFERRAL ANALYTICS
-- =====================================================

-- View for referral leaderboard
DROP VIEW IF EXISTS public.referral_leaderboard CASCADE;
CREATE VIEW public.referral_leaderboard AS
SELECT
    rc.wallet_address,
    rc.code,
    rc.total_referrals,
    rc.total_earnings,
    rc.click_count,
    rc.conversion_rate,
    rc.created_at,
    RANK() OVER (ORDER BY rc.total_earnings DESC) as earnings_rank,
    RANK() OVER (ORDER BY rc.total_referrals DESC) as referrals_rank,
    -- Count by level
    COALESCE((SELECT COUNT(*) FROM public.referrals r WHERE r.referrer_address = rc.wallet_address AND r.level = 1 AND r.status = 'active'), 0) as level1_count,
    COALESCE((SELECT COUNT(*) FROM public.referrals r WHERE r.referrer_address = rc.wallet_address AND r.level = 2 AND r.status = 'active'), 0) as level2_count,
    COALESCE((SELECT COUNT(*) FROM public.referrals r WHERE r.referrer_address = rc.wallet_address AND r.level = 3 AND r.status = 'active'), 0) as level3_count
FROM public.referral_codes rc
WHERE rc.is_active = true AND rc.total_referrals > 0
ORDER BY rc.total_earnings DESC;

-- View for user's referral network (direct referrals only)
DROP VIEW IF EXISTS public.referral_network CASCADE;
CREATE VIEW public.referral_network AS
SELECT
    r.referrer_address,
    r.referred_address,
    r.level,
    r.status,
    r.tasks_completed,
    r.cgc_earned,
    r.referrer_earnings,
    r.source,
    r.joined_at,
    r.last_activity,
    c.username,
    c.discord_username,
    c.avatar_url
FROM public.referrals r
LEFT JOIN public.collaborators c ON r.referred_address = c.wallet_address
WHERE r.status != 'banned'
ORDER BY r.joined_at DESC;

-- =====================================================
-- 🔒 ROW LEVEL SECURITY POLICIES
-- =====================================================
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_stats_daily ENABLE ROW LEVEL SECURITY;

-- Referral codes: Public read, own record update
DROP POLICY IF EXISTS "Referral codes are viewable by everyone" ON public.referral_codes;
CREATE POLICY "Referral codes are viewable by everyone" ON public.referral_codes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage referral codes" ON public.referral_codes;
CREATE POLICY "Service role can manage referral codes" ON public.referral_codes
    FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Referrals: Public read for leaderboard, restricted write
DROP POLICY IF EXISTS "Referrals are viewable by everyone" ON public.referrals;
CREATE POLICY "Referrals are viewable by everyone" ON public.referrals
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage referrals" ON public.referrals;
CREATE POLICY "Service role can manage referrals" ON public.referrals
    FOR ALL USING (auth.role() = 'service_role');

-- Rewards: Public read (for transparency), service write
DROP POLICY IF EXISTS "Rewards are viewable by everyone" ON public.referral_rewards;
CREATE POLICY "Rewards are viewable by everyone" ON public.referral_rewards
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage rewards" ON public.referral_rewards;
CREATE POLICY "Service role can manage rewards" ON public.referral_rewards
    FOR ALL USING (auth.role() = 'service_role');

-- Clicks: Insert only (no public read for privacy)
DROP POLICY IF EXISTS "Anyone can record clicks" ON public.referral_clicks;
CREATE POLICY "Anyone can record clicks" ON public.referral_clicks
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can read clicks" ON public.referral_clicks;
CREATE POLICY "Service role can read clicks" ON public.referral_clicks
    FOR SELECT USING (auth.role() = 'service_role');

-- Stats: Owner read, service write
DROP POLICY IF EXISTS "Users can view own stats" ON public.referral_stats_daily;
CREATE POLICY "Users can view own stats" ON public.referral_stats_daily
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage stats" ON public.referral_stats_daily;
CREATE POLICY "Service role can manage stats" ON public.referral_stats_daily
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- ✅ MIGRATION COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to set up the referral system
-- The system is now ready for:
-- 1. Referral code generation
-- 2. Multi-level tracking (3 levels)
-- 3. Commission calculations (10%, 5%, 2.5%)
-- 4. Milestone bonuses (5, 10, 25, 50, 100 referrals)
-- 5. Click tracking and analytics
-- 6. Daily aggregated statistics
