-- ============================================================================
-- 🔄 TASK COMPLETION AUTO-SYNC TRIGGER - CryptoGift DAO
-- ============================================================================
-- Version: 1.0.0
-- Description: Automatically syncs task completion data to collaborators and user_profiles
-- Author: CryptoGift DAO Team
-- Date: 2025-12-20
-- ============================================================================
-- When a task is completed (status changes to 'completed'), this trigger:
-- 1. Updates the collaborators table (total_cgc_earned, tasks_completed, last_activity)
-- 2. Updates the user_profiles table (total_cgc_earned, total_tasks_completed)
-- 3. Logs the activity in task_history if the table exists
-- ============================================================================

-- ============================================================================
-- 📦 FUNCTION: sync_task_completion
-- ============================================================================
-- This function handles the automatic synchronization when a task is completed
CREATE OR REPLACE FUNCTION sync_task_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_wallet TEXT;
    v_reward DECIMAL(20, 2);
    v_task_title TEXT;
BEGIN
    -- Only process when status changes to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
        -- Get the assignee address and reward
        v_wallet := LOWER(NEW.assignee_address);
        v_reward := COALESCE(NEW.reward_cgc, 0);
        v_task_title := NEW.title;

        -- Skip if no wallet address
        IF v_wallet IS NULL OR v_wallet = '' THEN
            RETURN NEW;
        END IF;

        -- ----------------------------------------------------------------
        -- 1. UPSERT INTO COLLABORATORS TABLE
        -- ----------------------------------------------------------------
        INSERT INTO public.collaborators (
            wallet_address,
            total_cgc_earned,
            tasks_completed,
            last_activity,
            updated_at
        )
        VALUES (
            v_wallet,
            v_reward,
            1,
            NOW(),
            NOW()
        )
        ON CONFLICT (wallet_address) DO UPDATE SET
            total_cgc_earned = collaborators.total_cgc_earned + EXCLUDED.total_cgc_earned,
            tasks_completed = collaborators.tasks_completed + 1,
            last_activity = NOW(),
            updated_at = NOW();

        -- ----------------------------------------------------------------
        -- 2. UPSERT INTO USER_PROFILES TABLE
        -- ----------------------------------------------------------------
        INSERT INTO public.user_profiles (
            wallet_address,
            total_cgc_earned,
            total_tasks_completed,
            updated_at
        )
        VALUES (
            v_wallet,
            v_reward,
            1,
            NOW()
        )
        ON CONFLICT (wallet_address) DO UPDATE SET
            total_cgc_earned = user_profiles.total_cgc_earned + EXCLUDED.total_cgc_earned,
            total_tasks_completed = user_profiles.total_tasks_completed + 1,
            updated_at = NOW();

        -- ----------------------------------------------------------------
        -- 3. OPTIONAL: LOG TO TASK_HISTORY (if table exists)
        -- ----------------------------------------------------------------
        BEGIN
            INSERT INTO public.task_history (
                task_id,
                action,
                wallet_address,
                details,
                created_at
            )
            VALUES (
                NEW.task_id,
                'completed',
                v_wallet,
                jsonb_build_object(
                    'title', v_task_title,
                    'reward_cgc', v_reward,
                    'completed_at', NEW.completed_at
                ),
                NOW()
            );
        EXCEPTION
            WHEN undefined_table THEN
                -- task_history table doesn't exist, skip logging
                NULL;
            WHEN OTHERS THEN
                -- Log error but don't fail the trigger
                RAISE NOTICE 'Failed to log to task_history: %', SQLERRM;
        END;

        -- Log success for debugging
        RAISE NOTICE 'Task completion synced: wallet=%, reward=%, title=%', v_wallet, v_reward, v_task_title;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 🔧 TRIGGER: task_completion_sync_trigger
-- ============================================================================
-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS task_completion_sync_trigger ON public.tasks;

-- Create the trigger
CREATE TRIGGER task_completion_sync_trigger
    AFTER UPDATE ON public.tasks
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed'))
    EXECUTE FUNCTION sync_task_completion();

-- ============================================================================
-- 📋 COMMENTS
-- ============================================================================
COMMENT ON FUNCTION sync_task_completion() IS
    'Automatically syncs task completion data to collaborators and user_profiles tables. Triggered when task status changes to completed.';

COMMENT ON TRIGGER task_completion_sync_trigger ON public.tasks IS
    'Fires when a task status is updated to completed, calling sync_task_completion() to update aggregated stats.';

-- ============================================================================
-- ✅ VERIFICATION QUERY (run after migration)
-- ============================================================================
-- SELECT
--     tgname AS trigger_name,
--     tgenabled AS enabled,
--     tgtype AS type,
--     proname AS function_name
-- FROM pg_trigger t
-- JOIN pg_proc p ON t.tgfoid = p.oid
-- WHERE tgrelid = 'public.tasks'::regclass
-- AND tgname = 'task_completion_sync_trigger';
