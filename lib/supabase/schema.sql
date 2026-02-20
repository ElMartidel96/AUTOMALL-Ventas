-- CryptoGift DAO Database Schema
-- Run this in Supabase SQL editor to create the tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE task_status AS ENUM ('available', 'claimed', 'in_progress', 'submitted', 'completed', 'cancelled', 'expired');
CREATE TYPE task_platform AS ENUM ('github', 'discord', 'manual', 'custom');
CREATE TYPE task_category AS ENUM ('security', 'frontend', 'backend', 'mobile', 'ai', 'defi', 'governance', 'analytics', 'documentation', 'blockchain', 'nft', 'performance', 'testing', 'localization', 'social', 'notifications', 'treasury', 'integration', 'automation', 'algorithm', 'compliance', 'infrastructure', 'gamification', 'search');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE collaborator_level AS ENUM ('novice', 'contributor', 'expert', 'master', 'legend');
CREATE TYPE proposal_status AS ENUM ('pending', 'approved', 'rejected', 'reviewing');
CREATE TYPE task_action AS ENUM ('created', 'claimed', 'submitted', 'validated', 'completed', 'expired');

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id VARCHAR(66) UNIQUE NOT NULL, -- bytes32 from contract
  title TEXT NOT NULL,
  description TEXT,
  complexity INT CHECK (complexity BETWEEN 1 AND 10),
  reward_cgc DECIMAL(20,2) NOT NULL,
  estimated_days INT NOT NULL,
  platform task_platform DEFAULT 'manual',
  category task_category,
  priority task_priority DEFAULT 'medium',
  status task_status DEFAULT 'available',
  required_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  assignee_address VARCHAR(42),
  assignee_discord_id VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  claimed_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  evidence_url TEXT,
  pr_url TEXT,
  validation_hash VARCHAR(66),
  validators TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Collaborators table
CREATE TABLE IF NOT EXISTS collaborators (
  address VARCHAR(42) PRIMARY KEY,
  discord_id VARCHAR(50),
  github_username VARCHAR(100),
  total_cgc_earned DECIMAL(20,2) DEFAULT 0,
  tasks_completed INT DEFAULT 0,
  tasks_in_progress INT DEFAULT 0,
  rank INT,
  level collaborator_level DEFAULT 'novice',
  badges TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE
);

-- Task proposals table
CREATE TABLE IF NOT EXISTS task_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  proposed_by_address VARCHAR(42),
  proposed_by_discord VARCHAR(50),
  platform_origin VARCHAR(50) NOT NULL,
  estimated_complexity INT,
  estimated_days INT,
  status proposal_status DEFAULT 'pending',
  review_notes TEXT,
  approved_by VARCHAR(42),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task history table (audit trail)
CREATE TABLE IF NOT EXISTS task_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id VARCHAR(66) NOT NULL,
  action task_action NOT NULL,
  actor_address VARCHAR(42),
  actor_discord VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_address);
CREATE INDEX idx_tasks_platform ON tasks(platform);
CREATE INDEX idx_collaborators_rank ON collaborators(rank);
CREATE INDEX idx_collaborators_discord ON collaborators(discord_id);
CREATE INDEX idx_proposals_status ON task_proposals(status);
CREATE INDEX idx_history_task_id ON task_history(task_id);
CREATE INDEX idx_history_created ON task_history(created_at DESC);

-- Views
CREATE OR REPLACE VIEW leaderboard_view AS
SELECT 
  c.address,
  c.discord_id,
  c.github_username,
  c.total_cgc_earned,
  c.tasks_completed,
  c.level,
  RANK() OVER (ORDER BY c.total_cgc_earned DESC) as rank
FROM collaborators c
WHERE c.tasks_completed > 0
ORDER BY c.total_cgc_earned DESC;

CREATE OR REPLACE VIEW active_tasks_view AS
SELECT 
  t.task_id,
  t.title,
  t.assignee_address,
  t.assignee_discord_id,
  t.created_at + (t.estimated_days * INTERVAL '1 day') as estimated_completion,
  CASE 
    WHEN t.status = 'completed' THEN 100
    WHEN t.status = 'in_progress' THEN 
      LEAST(100, EXTRACT(EPOCH FROM (NOW() - t.created_at)) / (t.estimated_days * 86400) * 100)
    ELSE 0
  END as progress_percentage
FROM tasks t
WHERE t.status = 'in_progress';

-- Functions
CREATE OR REPLACE FUNCTION calculate_rank()
RETURNS void AS $$
BEGIN
  UPDATE collaborators c
  SET rank = sub.new_rank
  FROM (
    SELECT 
      address,
      RANK() OVER (ORDER BY total_cgc_earned DESC) as new_rank
    FROM collaborators
  ) sub
  WHERE c.address = sub.address;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_available_tasks(user_address VARCHAR DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  complexity INT,
  reward_cgc DECIMAL,
  estimated_days INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.complexity,
    t.reward_cgc,
    t.estimated_days
  FROM tasks t
  WHERE t.status = 'available'
    AND (user_address IS NULL OR t.assignee_address IS NULL OR t.assignee_address != user_address)
  ORDER BY t.reward_cgc DESC, t.created_at ASC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION claim_task(p_task_id VARCHAR, p_user_address VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_status task_status;
BEGIN
  -- Check if task is available
  SELECT status INTO v_status FROM tasks WHERE task_id = p_task_id;
  
  IF v_status != 'available' THEN
    RETURN FALSE;
  END IF;
  
  -- Claim the task
  UPDATE tasks
  SET 
    status = 'in_progress',
    assignee_address = p_user_address,
    updated_at = NOW()
  WHERE task_id = p_task_id AND status = 'available';
  
  -- Update collaborator stats
  UPDATE collaborators
  SET 
    tasks_in_progress = tasks_in_progress + 1,
    last_activity = NOW()
  WHERE address = p_user_address;
  
  -- Log the action
  INSERT INTO task_history (task_id, action, actor_address)
  VALUES (p_task_id, 'claimed', p_user_address);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION submit_task_evidence(
  p_task_id VARCHAR, 
  p_evidence_url TEXT,
  p_pr_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_assignee VARCHAR;
BEGIN
  -- Get assignee
  SELECT assignee_address INTO v_assignee 
  FROM tasks 
  WHERE task_id = p_task_id AND status = 'in_progress';
  
  IF v_assignee IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update task with evidence
  UPDATE tasks
  SET 
    evidence_url = p_evidence_url,
    pr_url = p_pr_url,
    updated_at = NOW()
  WHERE task_id = p_task_id;
  
  -- Log the action
  INSERT INTO task_history (task_id, action, actor_address, metadata)
  VALUES (p_task_id, 'submitted', v_assignee, 
    jsonb_build_object('evidence_url', p_evidence_url, 'pr_url', p_pr_url));
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER collaborators_updated_at
  BEFORE UPDATE ON collaborators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER proposals_updated_at
  BEFORE UPDATE ON task_proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;

-- Policies (adjust based on your auth strategy)
CREATE POLICY "Tasks are viewable by everyone" ON tasks
  FOR SELECT USING (true);

CREATE POLICY "Collaborators are viewable by everyone" ON collaborators
  FOR SELECT USING (true);

CREATE POLICY "Proposals are viewable by everyone" ON task_proposals
  FOR SELECT USING (true);

CREATE POLICY "History is viewable by everyone" ON task_history
  FOR SELECT USING (true);

-- Note: Add more restrictive policies for INSERT, UPDATE, DELETE based on your auth