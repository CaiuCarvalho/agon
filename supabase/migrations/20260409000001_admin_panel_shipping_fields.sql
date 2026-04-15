-- Migration: Admin Panel Shipping Fields and Order Status Derivation
-- Description: Adds shipping management fields to orders table and creates
--              centralized order status derivation logic with defensive checks
-- Date: 2025-04-09

-- Add shipping fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (shipping_status IN ('pending', 'processing', 'shipped', 'delivered')),
ADD COLUMN IF NOT EXISTS tracking_code TEXT,
ADD COLUMN IF NOT EXISTS carrier TEXT,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;

-- Create index for shipping status queries
CREATE INDEX IF NOT EXISTS idx_orders_shipping_status ON orders(shipping_status);

-- Add constraint: tracking_code and carrier required when shipped
ALTER TABLE orders 
ADD CONSTRAINT orders_shipping_fields_check 
CHECK (
  (shipping_status IN ('shipped', 'delivered') AND tracking_code IS NOT NULL AND carrier IS NOT NULL)
  OR (shipping_status IN ('pending', 'processing'))
);

-- Create function to derive orders.status from payment + shipping
-- STABLE: depends on database state (payments table)
CREATE OR REPLACE FUNCTION derive_order_status(
  p_payment_status TEXT,
  p_shipping_status TEXT
) RETURNS TEXT AS $$
BEGIN
  -- If payment rejected/cancelled/refunded → cancelled
  IF p_payment_status IN ('rejected', 'cancelled', 'refunded') THEN
    RETURN 'cancelled';
  END IF;
  
  -- If payment pending → pending
  IF p_payment_status = 'pending' THEN
    RETURN 'pending';
  END IF;
  
  -- If payment approved, derive from shipping
  IF p_payment_status = 'approved' THEN
    CASE p_shipping_status
      WHEN 'pending' THEN RETURN 'processing';
      WHEN 'processing' THEN RETURN 'processing';
      WHEN 'shipped' THEN RETURN 'shipped';
      WHEN 'delivered' THEN RETURN 'delivered';
      ELSE RETURN 'processing';
    END CASE;
  END IF;
  
  -- Default
  RETURN 'pending';
END;
$$ LANGUAGE plpgsql STABLE;

-- Create trigger to auto-update orders.status when shipping_status changes
CREATE OR REPLACE FUNCTION update_order_status_on_shipping_change()
RETURNS TRIGGER AS $$
DECLARE
  v_payment_status TEXT;
BEGIN
  -- Get payment status (1:1 relationship enforced by UNIQUE constraint)
  SELECT status INTO v_payment_status
  FROM payments
  WHERE order_id = NEW.id
  LIMIT 1; -- Safety: ensure single result even if constraint not yet applied
  
  -- If no payment found, keep current status
  IF v_payment_status IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Update orders.status based on payment + shipping
  NEW.status := derive_order_status(v_payment_status, NEW.shipping_status);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_order_status_on_shipping
  BEFORE UPDATE OF shipping_status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_order_status_on_shipping_change();

-- Ensure 1:1 relationship between orders and payments (prevents multiple payments per order)
-- Note: This constraint already exists in payments table (order_id UNIQUE)
-- Verify with: SELECT constraint_name FROM information_schema.table_constraints 
--              WHERE table_name = 'payments' AND constraint_type = 'UNIQUE';

-- Defensive check: Add assertion function to validate 1:1 relationship (optional, for extra safety)
CREATE OR REPLACE FUNCTION assert_single_payment_per_order(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
  v_payment_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_payment_count
  FROM payments
  WHERE order_id = p_order_id;
  
  IF v_payment_count > 1 THEN
    RAISE EXCEPTION 'Data integrity violation: Order % has % payments (expected 1)', 
      p_order_id, v_payment_count;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comments
COMMENT ON COLUMN orders.shipping_status IS 'Fulfillment status managed by admin (independent of payment status)';
COMMENT ON COLUMN orders.tracking_code IS 'Tracking code from carrier (required when shipped)';
COMMENT ON COLUMN orders.carrier IS 'Carrier name (free text, e.g., Correios, Jadlog)';
COMMENT ON COLUMN orders.shipped_at IS 'Timestamp when order was marked as shipped';
COMMENT ON COLUMN orders.status IS 'Derived summary status (auto-updated by trigger from payment + shipping)';
