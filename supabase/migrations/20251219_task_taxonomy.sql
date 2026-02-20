-- =====================================================
-- 🏷️ TASK TAXONOMY MIGRATION
-- =====================================================
-- Adds domain, task_type, and Discord integration fields
-- Part of Task System v2.0 upgrade
-- Created: 19 December 2025

-- =====================================================
-- STEP 1: ADD NEW COLUMNS
-- =====================================================

-- Domain field (top-level grouping)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS domain TEXT;

-- Task type field (action format)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_type TEXT;

-- Discord integration fields
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS discord_message_id TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS discord_thread_id TEXT;

-- Featured and urgent flags for highlighting
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;

-- Additional metadata fields for better task management
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS max_assignees INTEGER DEFAULT 1;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS acceptance_criteria JSONB DEFAULT '[]';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS deliverables JSONB DEFAULT '[]';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS skills_required JSONB DEFAULT '[]';

-- =====================================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Domain index for filtering by domain
CREATE INDEX IF NOT EXISTS idx_tasks_domain ON public.tasks(domain);

-- Task type index
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON public.tasks(task_type);

-- Featured tasks index (partial - only true values)
CREATE INDEX IF NOT EXISTS idx_tasks_is_featured ON public.tasks(is_featured) WHERE is_featured = true;

-- Urgent tasks index (partial - only true values)
CREATE INDEX IF NOT EXISTS idx_tasks_is_urgent ON public.tasks(is_urgent) WHERE is_urgent = true;

-- Discord message ID for sync lookups
CREATE INDEX IF NOT EXISTS idx_tasks_discord_message_id ON public.tasks(discord_message_id) WHERE discord_message_id IS NOT NULL;

-- Composite index for common filters
CREATE INDEX IF NOT EXISTS idx_tasks_domain_category ON public.tasks(domain, category);
CREATE INDEX IF NOT EXISTS idx_tasks_domain_status ON public.tasks(domain, status);

-- =====================================================
-- STEP 3: ADD CONSTRAINTS
-- =====================================================

-- Domain constraint (6 valid domains)
DO $$
BEGIN
    ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_domain_check;
    ALTER TABLE public.tasks ADD CONSTRAINT tasks_domain_check
        CHECK (domain IS NULL OR domain IN ('development', 'documentation', 'design', 'community', 'governance', 'operations'));
END $$;

-- Task type constraint (10 valid types)
DO $$
BEGIN
    ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_task_type_check;
    ALTER TABLE public.tasks ADD CONSTRAINT tasks_task_type_check
        CHECK (task_type IS NULL OR task_type IN ('feature', 'bugfix', 'refactor', 'research', 'design', 'content', 'review', 'setup', 'migration', 'integration'));
END $$;

-- =====================================================
-- STEP 4: MIGRATE EXISTING DATA - INFER DOMAIN FROM CATEGORY
-- =====================================================

-- Set domain based on existing category values
UPDATE public.tasks
SET domain = CASE
    -- Development domain (technical categories)
    WHEN category IN ('frontend', 'backend', 'mobile', 'blockchain', 'ai', 'defi', 'nft', 'performance', 'testing', 'infrastructure') THEN 'development'

    -- Documentation domain
    WHEN category IN ('documentation', 'localization') THEN 'documentation'

    -- Community domain
    WHEN category IN ('social', 'notifications', 'gamification') THEN 'community'

    -- Governance domain
    WHEN category IN ('governance', 'treasury', 'compliance', 'analytics') THEN 'governance'

    -- Operations domain
    WHEN category IN ('integration', 'automation', 'algorithm', 'search', 'security') THEN 'operations'

    -- Default to development for unknown
    ELSE 'development'
END
WHERE domain IS NULL;

-- Set default task_type based on complexity and category
UPDATE public.tasks
SET task_type = CASE
    -- Bug fixes are typically lower complexity
    WHEN complexity <= 3 AND description ILIKE '%bug%' THEN 'bugfix'
    WHEN complexity <= 3 AND description ILIKE '%fix%' THEN 'bugfix'

    -- Research tasks
    WHEN description ILIKE '%research%' THEN 'research'
    WHEN description ILIKE '%investigate%' THEN 'research'
    WHEN description ILIKE '%analyze%' THEN 'research'

    -- Documentation is content
    WHEN category IN ('documentation', 'localization') THEN 'content'

    -- Design tasks
    WHEN category = 'frontend' AND description ILIKE '%design%' THEN 'design'
    WHEN description ILIKE '%ui%' OR description ILIKE '%ux%' THEN 'design'

    -- Integration tasks
    WHEN category = 'integration' THEN 'integration'
    WHEN description ILIKE '%integrate%' THEN 'integration'

    -- Review tasks
    WHEN description ILIKE '%review%' THEN 'review'
    WHEN description ILIKE '%audit%' THEN 'review'

    -- Setup tasks
    WHEN description ILIKE '%setup%' THEN 'setup'
    WHEN description ILIKE '%configure%' THEN 'setup'
    WHEN description ILIKE '%install%' THEN 'setup'

    -- Migration tasks
    WHEN description ILIKE '%migrate%' THEN 'migration'
    WHEN description ILIKE '%upgrade%' THEN 'migration'

    -- Refactor tasks
    WHEN description ILIKE '%refactor%' THEN 'refactor'
    WHEN description ILIKE '%optimize%' THEN 'refactor'
    WHEN description ILIKE '%improve%' THEN 'refactor'

    -- Default to feature for new functionality
    ELSE 'feature'
END
WHERE task_type IS NULL;

-- =====================================================
-- STEP 5: MARK HIGH-VALUE TASKS AS FEATURED
-- =====================================================

-- Feature tasks with high rewards (>= 5000 CGC) or complexity >= 8
UPDATE public.tasks
SET is_featured = true
WHERE (reward_cgc >= 5000 OR complexity >= 8)
  AND status = 'available'
  AND is_featured IS NOT true;

-- =====================================================
-- STEP 6: VERIFICATION QUERIES (for manual checking)
-- =====================================================

-- Uncomment these to verify migration success:
-- SELECT domain, COUNT(*) FROM public.tasks GROUP BY domain ORDER BY domain;
-- SELECT task_type, COUNT(*) FROM public.tasks GROUP BY task_type ORDER BY task_type;
-- SELECT COUNT(*) FROM public.tasks WHERE is_featured = true;
-- SELECT COUNT(*) FROM public.tasks WHERE domain IS NULL;

-- =====================================================
-- 🎉 MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Verify data with the queries above
-- 3. Continue with FASE 2: Types & Constants
