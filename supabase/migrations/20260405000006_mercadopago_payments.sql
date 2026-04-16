-- Migration: Mercado Pago Payments Integration
-- Description: Creates payments table, indexes, RLS policies, and updates orders table
-- Date: 2025-04-06
-- Note: RPC functions moved to separate files (one function per file, Supabase CLI requirement)
--   → 20260406000001_create_order_with_payment_atomic.sql
--   → 20260409000002_update_webhook_rpc_atomic.sql (replaces the initial webhook RPC)

-- ============================================
-- 1. Create payments table
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to orders (1:1 relationship)
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,

  -- Mercado Pago identifiers
  mercadopago_payment_id TEXT NULL,
  mercadopago_preference_id TEXT NOT NULL,

  -- Payment status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded', 'in_process')
  ),

  -- Payment details
  payment_method TEXT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- 2. Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_mercadopago_payment_id ON payments(mercadopago_payment_id) WHERE mercadopago_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_mercadopago_preference_id ON payments(mercadopago_preference_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ============================================
-- 3. Create trigger for updated_at
-- ============================================

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Enable RLS
-- ============================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. Create RLS policies
-- ============================================

CREATE POLICY "payments_select_own"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "payments_insert_own"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "payments_update_system_or_admin"
  ON payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "payments_delete_admin"
  ON payments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 6. Update orders table payment_method constraint
-- ============================================

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN (
    'cash_on_delivery',
    'mercadopago_credit_card',
    'mercadopago_debit_card',
    'mercadopago_pix',
    'mercadopago_boleto',
    'mercadopago_account_money'
  ));

ALTER TABLE orders ALTER COLUMN payment_method SET DEFAULT 'mercadopago_credit_card';
