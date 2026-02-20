-- ============================================
-- 📋 GRANT APPLICATIONS TRACKER SYSTEM
-- Created: 7 January 2026
-- Purpose: Track all grant applications with status, notes, and metadata
-- Access: Restricted to deployer wallet and authorized admins
-- ============================================

-- Create enum for application status
DO $$ BEGIN
    CREATE TYPE grant_application_status AS ENUM (
        'draft',
        'submitted',
        'under_review',
        'approved',
        'rejected',
        'funded',
        'completed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for priority level
DO $$ BEGIN
    CREATE TYPE grant_priority AS ENUM (
        'low',
        'medium',
        'high',
        'critical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- MAIN TABLE: grant_applications
-- ============================================
CREATE TABLE IF NOT EXISTS grant_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Info
    platform_name VARCHAR(255) NOT NULL,
    program_name VARCHAR(255),
    application_url TEXT NOT NULL,
    project_url TEXT,

    -- Status & Priority
    status grant_application_status DEFAULT 'draft',
    priority grant_priority DEFAULT 'medium',

    -- Dates
    submitted_at TIMESTAMPTZ,
    deadline_at TIMESTAMPTZ,
    response_expected_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    funded_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Financial
    requested_amount DECIMAL(18, 2),
    requested_currency VARCHAR(10) DEFAULT 'USD',
    approved_amount DECIMAL(18, 2),
    approved_currency VARCHAR(10),
    tx_hash VARCHAR(66),

    -- Contact & Communication
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    communication_channel VARCHAR(100),
    last_contact_at TIMESTAMPTZ,

    -- Documentation
    description TEXT,
    requirements_met JSONB DEFAULT '[]'::jsonb,
    documents_submitted JSONB DEFAULT '[]'::jsonb,
    milestones JSONB DEFAULT '[]'::jsonb,

    -- Notes (rich JSON for structured content)
    notes JSONB DEFAULT '{}'::jsonb,
    internal_notes TEXT,

    -- Tags & Categories
    tags TEXT[] DEFAULT '{}',
    category VARCHAR(100),

    -- Tracking
    created_by VARCHAR(42) NOT NULL,
    updated_by VARCHAR(42),

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HISTORY TABLE: grant_application_history
-- ============================================
CREATE TABLE IF NOT EXISTS grant_application_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES grant_applications(id) ON DELETE CASCADE,

    action VARCHAR(50) NOT NULL,
    old_status grant_application_status,
    new_status grant_application_status,

    changed_by VARCHAR(42) NOT NULL,
    change_notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_grant_applications_status ON grant_applications(status);
CREATE INDEX IF NOT EXISTS idx_grant_applications_platform ON grant_applications(platform_name);
CREATE INDEX IF NOT EXISTS idx_grant_applications_created_by ON grant_applications(created_by);
CREATE INDEX IF NOT EXISTS idx_grant_applications_submitted_at ON grant_applications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_grant_applications_deadline ON grant_applications(deadline_at);
CREATE INDEX IF NOT EXISTS idx_grant_application_history_app_id ON grant_application_history(application_id);

-- ============================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_grant_application_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_grant_application_updated_at ON grant_applications;
CREATE TRIGGER trigger_grant_application_updated_at
    BEFORE UPDATE ON grant_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_grant_application_updated_at();

-- ============================================
-- HISTORY LOGGING TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION log_grant_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO grant_application_history (
            application_id,
            action,
            old_status,
            new_status,
            changed_by,
            metadata
        ) VALUES (
            NEW.id,
            'status_change',
            OLD.status,
            NEW.status,
            COALESCE(NEW.updated_by, NEW.created_by),
            jsonb_build_object(
                'timestamp', NOW(),
                'old_status', OLD.status,
                'new_status', NEW.status
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_grant_application_history ON grant_applications;
CREATE TRIGGER trigger_grant_application_history
    AFTER UPDATE ON grant_applications
    FOR EACH ROW
    EXECUTE FUNCTION log_grant_application_status_change();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE grant_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_application_history ENABLE ROW LEVEL SECURITY;

-- Policy: Only authorized admins can read/write
-- Deployer: 0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6
-- Safe Owner signers can also access

CREATE POLICY "grant_applications_admin_access" ON grant_applications
    FOR ALL
    USING (
        created_by IN (
            '0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6',
            '0xB5a639149dF81c673131F9082b9429ad00842420',
            '0x57D32c363555f2ae35045Dc3797cA68c4096C9FE',
            '0x3514433534c281D546B3c3b913c908Bd90689D29',
            '0x11323672b5f9bB899Fa332D5d464CC4e66637b42'
        )
    );

CREATE POLICY "grant_application_history_admin_access" ON grant_application_history
    FOR ALL
    USING (
        changed_by IN (
            '0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6',
            '0xB5a639149dF81c673131F9082b9429ad00842420',
            '0x57D32c363555f2ae35045Dc3797cA68c4096C9FE',
            '0x3514433534c281D546B3c3b913c908Bd90689D29',
            '0x11323672b5f9bB899Fa332D5d464CC4e66637b42'
        )
    );

-- ============================================
-- INITIAL DATA: Giveth Application
-- ============================================
INSERT INTO grant_applications (
    platform_name,
    program_name,
    application_url,
    project_url,
    status,
    priority,
    submitted_at,
    description,
    tags,
    category,
    created_by,
    notes,
    metadata
) VALUES (
    'Giveth',
    'Giveth Grants',
    'https://giveth.io/project/cryptogift-wallets-dao',
    'https://giveth.io/project/cryptogift-wallets-dao',
    'submitted',
    'high',
    '2026-01-06T00:00:00Z',
    'CryptoGift Wallets DAO - Primera infraestructura Web3 que transforma NFTs en wallets funcionales mediante ERC-6551. Proyecto registrado en Giveth para recibir donaciones y participar en el ecosistema de funding público.',
    ARRAY['web3', 'dao', 'erc-6551', 'base', 'funding', 'donation'],
    'crowdfunding',
    '0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6',
    '{
        "summary": "Proyecto publicado en Giveth para recibir donaciones de la comunidad",
        "actions_taken": [
            "Creación del perfil del proyecto",
            "Descripción completa en inglés",
            "Conexión de wallet para recibir donaciones",
            "Verificación del proyecto"
        ],
        "next_steps": [
            "Promover en redes sociales",
            "Compartir link en Discord",
            "Aplicar para rounds de Gitcoin"
        ]
    }'::jsonb,
    '{
        "chain": "Base Mainnet",
        "donation_address": "0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6",
        "project_verified": true
    }'::jsonb
) ON CONFLICT DO NOTHING;

-- ============================================
-- HELPFUL VIEW: Active Applications Summary
-- ============================================
CREATE OR REPLACE VIEW active_grant_applications AS
SELECT
    id,
    platform_name,
    program_name,
    status,
    priority,
    submitted_at,
    deadline_at,
    requested_amount,
    requested_currency,
    approved_amount,
    tags,
    created_at,
    updated_at
FROM grant_applications
WHERE status NOT IN ('completed', 'cancelled', 'rejected')
ORDER BY
    CASE priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END,
    deadline_at ASC NULLS LAST;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE grant_applications IS 'Tracks all grant applications with status, notes, and metadata. Access restricted to deployer and authorized admins.';
COMMENT ON TABLE grant_application_history IS 'Audit log of all status changes for grant applications.';
COMMENT ON COLUMN grant_applications.notes IS 'Structured JSON for notes with actions taken, next steps, and custom fields.';
COMMENT ON COLUMN grant_applications.requirements_met IS 'Array of requirements that have been fulfilled.';
COMMENT ON COLUMN grant_applications.documents_submitted IS 'Array of documents submitted with the application.';
COMMENT ON COLUMN grant_applications.milestones IS 'Array of milestones if the grant requires deliverables.';
