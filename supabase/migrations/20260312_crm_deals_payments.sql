-- ═══════════════════════════════════════════════
-- CRM Deals + Payments (Control de Ventas)
-- ═══════════════════════════════════════════════

-- crm_deals: Cada fila = 1 venta cerrada o en proceso
CREATE TABLE IF NOT EXISTS crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,

  -- Client snapshot (denormalized — lead puede no existir)
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  client_whatsapp TEXT,
  referred_by TEXT,

  -- Vehicle snapshot (denormalized — vehículo puede venderse/eliminarse)
  vehicle_id UUID,
  vehicle_brand TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_year INTEGER NOT NULL,
  vehicle_color TEXT,
  vehicle_vin TEXT,
  vehicle_mileage INTEGER,
  vehicle_trim TEXT,

  -- Sale
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sale_price NUMERIC(12,2) NOT NULL CHECK (sale_price > 0),
  down_payment NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (down_payment >= 0),
  financed_amount NUMERIC(12,2) GENERATED ALWAYS AS (sale_price - down_payment) STORED,

  -- Financing
  financing_type TEXT NOT NULL DEFAULT 'cash'
    CHECK (financing_type IN ('cash', 'in_house', 'external')),
  finance_company TEXT,
  num_installments INTEGER NOT NULL DEFAULT 0 CHECK (num_installments >= 0),
  first_payment_date DATE,
  payment_day INTEGER CHECK (payment_day IS NULL OR (payment_day >= 1 AND payment_day <= 31)),
  payment_frequency TEXT DEFAULT 'weekly'
    CHECK (payment_frequency IN ('weekly', 'biweekly', 'monthly')),
  installment_amount NUMERIC(12,2) CHECK (installment_amount IS NULL OR installment_amount > 0),

  -- Financial tracking (updated via trigger on payments)
  total_collected NUMERIC(12,2) NOT NULL DEFAULT 0,
  outstanding_balance NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Deal management
  deal_status TEXT NOT NULL DEFAULT 'active'
    CHECK (deal_status IN ('active', 'completed', 'default', 'cancelled')),
  gps_installed BOOLEAN DEFAULT false,
  commission NUMERIC(12,2) DEFAULT 0,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_deals_seller ON crm_deals(seller_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_lead ON crm_deals(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_status ON crm_deals(deal_status);
CREATE INDEX IF NOT EXISTS idx_crm_deals_sale_date ON crm_deals(sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_crm_deals_created ON crm_deals(created_at DESC);

-- RLS
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'crm_deals_service_all') THEN
    EXECUTE 'CREATE POLICY crm_deals_service_all ON crm_deals FOR ALL USING (auth.role() = ''service_role'')';
  END IF;
END $$;

-- crm_payments: Cada fila = 1 pago individual
CREATE TABLE IF NOT EXISTS crm_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  payment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  paid_amount NUMERIC(12,2) DEFAULT 0 CHECK (paid_amount >= 0),
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('paid', 'pending', 'overdue', 'partial', 'cancelled')),
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_payments_deal ON crm_payments(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_payments_seller ON crm_payments(seller_id);
CREATE INDEX IF NOT EXISTS idx_crm_payments_status ON crm_payments(status);
CREATE INDEX IF NOT EXISTS idx_crm_payments_due ON crm_payments(due_date);

ALTER TABLE crm_payments ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'crm_payments_service_all') THEN
    EXECUTE 'CREATE POLICY crm_payments_service_all ON crm_payments FOR ALL USING (auth.role() = ''service_role'')';
  END IF;
END $$;

-- Ensure update_updated_at_column() exists (used by crm_leads too)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

-- Triggers: auto-update updated_at
DROP TRIGGER IF EXISTS trg_crm_deals_updated_at ON crm_deals;
CREATE TRIGGER trg_crm_deals_updated_at
  BEFORE UPDATE ON crm_deals FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_crm_payments_updated_at ON crm_payments;
CREATE TRIGGER trg_crm_payments_updated_at
  BEFORE UPDATE ON crm_payments FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: auto-recalculate deal totals when payment changes
CREATE OR REPLACE FUNCTION recalc_deal_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_collected NUMERIC(12,2);
  v_financed NUMERIC(12,2);
BEGIN
  SELECT COALESCE(SUM(paid_amount), 0) INTO v_collected
  FROM crm_payments
  WHERE deal_id = COALESCE(NEW.deal_id, OLD.deal_id)
    AND status IN ('paid', 'partial');

  SELECT (sale_price - down_payment) INTO v_financed
  FROM crm_deals WHERE id = COALESCE(NEW.deal_id, OLD.deal_id);

  UPDATE crm_deals
  SET total_collected = v_collected,
      outstanding_balance = GREATEST(v_financed - v_collected, 0)
  WHERE id = COALESCE(NEW.deal_id, OLD.deal_id);

  RETURN COALESCE(NEW, OLD);
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalc_deal_totals ON crm_payments;
CREATE TRIGGER trg_recalc_deal_totals
  AFTER INSERT OR UPDATE OR DELETE ON crm_payments
  FOR EACH ROW EXECUTE FUNCTION recalc_deal_totals();
