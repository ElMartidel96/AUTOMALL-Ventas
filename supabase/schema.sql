-- =====================================================
-- 🏗️  CryptoGift DAO - Complete Database Schema
-- =====================================================
-- This script creates all tables needed for the DAO system
-- Run this in Supabase SQL editor to initialize the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 📋 TASKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    complexity INTEGER CHECK (complexity >= 1 AND complexity <= 10),
    reward_cgc DECIMAL(20,2) DEFAULT 0,
    estimated_days INTEGER DEFAULT 1,
    platform TEXT DEFAULT 'github' CHECK (platform IN ('github', 'discord', 'manual', 'custom')),
    category TEXT CHECK (category IN ('security', 'frontend', 'backend', 'mobile', 'ai', 'defi', 'governance', 'analytics', 'documentation', 'blockchain', 'nft', 'performance', 'testing', 'localization', 'social', 'notifications', 'treasury', 'integration', 'automation', 'algorithm', 'compliance', 'infrastructure', 'gamification', 'search')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'in_progress', 'submitted', 'validated', 'completed', 'cancelled', 'expired')),
    required_skills TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    assignee_address TEXT,
    assignee_discord_id TEXT,
    claimed_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    evidence_url TEXT,
    pr_url TEXT,
    validation_hash TEXT,
    validators TEXT[] DEFAULT '{}',
    validated_at TIMESTAMPTZ,
    validator_address TEXT,
    validation_notes TEXT,
    rejected_at TIMESTAMPTZ,
    rejected_by TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON public.tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assignee_address);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);

-- =====================================================
-- 📋 MIGRATE EXISTING TASKS TABLE - ADD MISSING COLUMNS
-- =====================================================
-- Add missing columns to existing tasks table
DO $$ 
BEGIN
    -- Add validated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'validated_at') THEN
        ALTER TABLE public.tasks ADD COLUMN validated_at TIMESTAMPTZ;
    END IF;
    
    -- Add validator_address column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'validator_address') THEN
        ALTER TABLE public.tasks ADD COLUMN validator_address TEXT;
    END IF;
    
    -- Add validation_notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'validation_notes') THEN
        ALTER TABLE public.tasks ADD COLUMN validation_notes TEXT;
    END IF;
    
    -- Add rejected_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'rejected_at') THEN
        ALTER TABLE public.tasks ADD COLUMN rejected_at TIMESTAMPTZ;
    END IF;
    
    -- Add rejected_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tasks' AND column_name = 'rejected_by') THEN
        ALTER TABLE public.tasks ADD COLUMN rejected_by TEXT;
    END IF;
END $$;

-- =====================================================
-- 🔄 MIGRATE EXISTING DATA TO MATCH NEW CONSTRAINTS  
-- =====================================================
-- CRITICAL: Drop existing constraints FIRST, then update data, then add new constraints

-- Step 1: Drop existing constraints to allow data updates
DO $$
BEGIN
    ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_platform_check;
    ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_category_check;
    ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
END $$;

-- Step 2: Update existing data to match new enum values
UPDATE public.tasks 
SET platform = CASE 
    WHEN platform = 'zealy' THEN 'custom'
    WHEN platform NOT IN ('github', 'discord', 'manual', 'custom') THEN 'manual'
    ELSE platform
END
WHERE platform IS NOT NULL;

UPDATE public.tasks 
SET category = CASE 
    WHEN category = 'development' THEN 'backend'
    WHEN category = 'design' THEN 'frontend'  
    WHEN category = 'marketing' THEN 'social'
    WHEN category = 'community' THEN 'governance'
    WHEN category = 'general' THEN 'documentation'
    WHEN category NOT IN ('security', 'frontend', 'backend', 'mobile', 'ai', 'defi', 'governance', 'analytics', 'documentation', 'blockchain', 'nft', 'performance', 'testing', 'localization', 'social', 'notifications', 'treasury', 'integration', 'automation', 'algorithm', 'compliance', 'infrastructure', 'gamification', 'search') THEN 'documentation'
    ELSE category
END
WHERE category IS NOT NULL;

-- Step 3: Now safely add the new constraints
DO $$
BEGIN    
    -- Add updated constraints
    ALTER TABLE public.tasks ADD CONSTRAINT tasks_platform_check 
        CHECK (platform IN ('github', 'discord', 'manual', 'custom'));
    
    ALTER TABLE public.tasks ADD CONSTRAINT tasks_category_check 
        CHECK (category IN ('security', 'frontend', 'backend', 'mobile', 'ai', 'defi', 'governance', 'analytics', 'documentation', 'blockchain', 'nft', 'performance', 'testing', 'localization', 'social', 'notifications', 'treasury', 'integration', 'automation', 'algorithm', 'compliance', 'infrastructure', 'gamification', 'search') OR category IS NULL);
        
    ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check 
        CHECK (status IN ('available', 'claimed', 'in_progress', 'submitted', 'validated', 'completed', 'cancelled', 'expired'));
END $$;

-- =====================================================
-- 👥 COLLABORATORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.collaborators (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_address TEXT UNIQUE,
    username TEXT,
    discord_username TEXT,
    github_username TEXT,
    telegram_username TEXT,
    bio TEXT,
    avatar_url TEXT,
    skills TEXT[] DEFAULT '{}',
    preferred_categories TEXT[] DEFAULT '{}',
    total_cgc_earned DECIMAL(20,2) DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    tasks_in_progress INTEGER DEFAULT 0,
    reputation_score INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_collaborators_wallet ON public.collaborators(wallet_address);
CREATE INDEX IF NOT EXISTS idx_collaborators_discord ON public.collaborators(discord_username);
CREATE INDEX IF NOT EXISTS idx_collaborators_cgc ON public.collaborators(total_cgc_earned DESC);

-- =====================================================
-- 📜 PROPOSALS TABLE - MIGRATE EXISTING
-- =====================================================
-- Drop existing table to recreate with correct structure
DROP TABLE IF EXISTS public.task_proposals CASCADE;

CREATE TABLE public.task_proposals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    proposed_by_address TEXT,
    proposed_by_discord TEXT,
    platform_origin TEXT NOT NULL,
    estimated_complexity INTEGER,
    estimated_days INTEGER,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reviewing')),
    review_notes TEXT,
    approved_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.task_proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_proposer ON public.task_proposals(proposed_by_address);

-- =====================================================
-- 📊 TASK HISTORY TABLE - MIGRATE EXISTING
-- =====================================================
-- Drop existing table to recreate with correct structure
DROP TABLE IF EXISTS public.task_history CASCADE;

CREATE TABLE public.task_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('created', 'claimed', 'submitted', 'validated', 'completed', 'expired')),
    actor_address TEXT,
    actor_discord TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_history_task ON public.task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_history_actor ON public.task_history(actor_address);
CREATE INDEX IF NOT EXISTS idx_history_created ON public.task_history(created_at DESC);

-- =====================================================
-- 🔄 UPDATE TRIGGERS
-- =====================================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers (safe creation)
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON public.tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_collaborators_updated_at ON public.collaborators;
CREATE TRIGGER update_collaborators_updated_at 
    BEFORE UPDATE ON public.collaborators 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_proposals_updated_at ON public.task_proposals;
CREATE TRIGGER update_proposals_updated_at 
    BEFORE UPDATE ON public.task_proposals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 🔒 ROW LEVEL SECURITY POLICIES
-- =====================================================
-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

-- Tasks policies (public read, authenticated write) - Safe creation
DROP POLICY IF EXISTS "Tasks are viewable by everyone" ON public.tasks;
CREATE POLICY "Tasks are viewable by everyone" ON public.tasks
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Tasks can be updated by authenticated users" ON public.tasks;
CREATE POLICY "Tasks can be updated by authenticated users" ON public.tasks
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Collaborators policies (public read, own record update) - Safe creation
DROP POLICY IF EXISTS "Collaborators are viewable by everyone" ON public.collaborators;
CREATE POLICY "Collaborators are viewable by everyone" ON public.collaborators
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own collaborator record" ON public.collaborators;
CREATE POLICY "Users can update their own collaborator record" ON public.collaborators
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Proposals policies (public read, authenticated create/update) - Safe creation  
DROP POLICY IF EXISTS "Proposals are viewable by everyone" ON public.task_proposals;
CREATE POLICY "Proposals are viewable by everyone" ON public.task_proposals
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create/update proposals" ON public.task_proposals;
CREATE POLICY "Authenticated users can create/update proposals" ON public.task_proposals
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- History policies (public read, service write) - Safe creation
DROP POLICY IF EXISTS "History is viewable by everyone" ON public.task_history;
CREATE POLICY "History is viewable by everyone" ON public.task_history
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can insert history" ON public.task_history;
CREATE POLICY "Service role can insert history" ON public.task_history
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 📊 VIEWS - SAFE RECREATION
-- =====================================================
-- Drop existing views before recreating to avoid structure conflicts
DROP VIEW IF EXISTS public.active_tasks_with_assignees CASCADE;
DROP VIEW IF EXISTS public.active_tasks_view CASCADE;
DROP VIEW IF EXISTS public.leaderboard_view CASCADE;
DROP VIEW IF EXISTS public.leaderboard CASCADE;

-- View for active tasks with assignee info
CREATE VIEW public.active_tasks_with_assignees AS
SELECT 
    t.*,
    c.username as assignee_username,
    c.discord_username as assignee_discord
FROM public.tasks t
LEFT JOIN public.collaborators c ON t.assignee_address = c.wallet_address
WHERE t.status IN ('available', 'claimed', 'in_progress', 'submitted');

-- View for active tasks
CREATE VIEW public.active_tasks_view AS
SELECT 
    task_id,
    title,
    assignee_address,
    assignee_discord_id,
    (created_at + INTERVAL '1 day' * estimated_days) as estimated_completion,
    CASE 
        WHEN status = 'completed' THEN 100
        WHEN status = 'submitted' THEN 90
        WHEN status = 'in_progress' THEN 50
        WHEN status = 'claimed' THEN 25
        ELSE 0
    END as progress_percentage
FROM public.tasks
WHERE assignee_address IS NOT NULL AND status != 'completed';

-- View for leaderboard
CREATE VIEW public.leaderboard_view AS
SELECT 
    wallet_address as address,
    discord_username as discord_id,
    github_username,
    total_cgc_earned,
    tasks_completed,
    CASE 
        WHEN total_cgc_earned >= 10000 THEN 'legend'
        WHEN total_cgc_earned >= 5000 THEN 'master'
        WHEN total_cgc_earned >= 2000 THEN 'expert'
        WHEN total_cgc_earned >= 500 THEN 'contributor'
        ELSE 'novice'
    END as level,
    RANK() OVER (ORDER BY total_cgc_earned DESC) as rank
FROM public.collaborators
WHERE is_active = true AND total_cgc_earned > 0
ORDER BY total_cgc_earned DESC;

-- =====================================================
-- ✅ SCHEMA INITIALIZATION COMPLETE
-- =====================================================
-- The database is now ready for the CryptoGift DAO system!
-- Next steps:
-- 1. Run the init-tasks API to populate the 34 predefined tasks
-- 2. Configure environment variables in Vercel
-- 3. Test the system functionality

-- Schema initialization complete - ready for use!