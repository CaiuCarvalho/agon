-- Migration: Mercado Pago Payments Integration
-- Description: Creates payments table, RPC functions, and updates orders table for Mercado Pago integration
-- Date: 2025-04-06

-- ============================================
-- 1. Create payments table
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key to orders (1:1 relationship)
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  
  -- Mercado Pago identifiers
  mercadopago_payment_id TEXT NULL, -- Set when webhook received
  mercadopago_preference_id TEXT NOT NULL, -- Set when preference created
  
  -- Payment status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded', 'in_process')
  ),
  
  -- Payment details
  payment_method TEXT NULL, -- e.g., 'credit_card', 'pix', 'boleto'
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- 2. Create indexes for performance
-- ============================================

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_mercadopago_payment_id ON payments(mercadopago_payment_id) WHERE mercadopago_payment_id IS NOT NULL;
CREATE INDEX idx_payments_mercadopago_preference_id ON payments(mercadopago_preference_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================
-- 3. Create trigger for updated_at
-- ============================================

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Add comments
-- ============================================


-- ============================================
-- 5. Enable RLS
-- ============================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. Create RLS policies
-- ============================================

-- Policy: Users can only read payments for their own orders
CREATE POLICY "payments_select_own"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Policy: Users can only insert payments for their own orders
CREATE POLICY "payments_insert_own"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Policy: Only system (via RPC) or admin can update payments
CREATE POLICY "payments_update_system_or_admin"
  ON payments FOR UPDATE
  USING (
    -- Allow if user is admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    -- Or allow if user owns the order (for webhook processing)
    OR EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Policy: Only admins can delete payments
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
-- 7. Update orders table payment_method constraint
-- ============================================

-- Drop existing constraint if it exists
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

-- Add new constraint with Mercado Pago methods
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN (
    'cash_on_delivery',
    'mercadopago_credit_card',
    'mercadopago_debit_card',
    'mercadopago_pix',
    'mercadopago_boleto',
    'mercadopago_account_money'
  ));

-- Update default payment method
ALTER TABLE orders ALTER COLUMN payment_method SET DEFAULT 'mercadopago_credit_card';

-- ============================================
-- 8. Create RPC function: create_order_with_payment_atomic
-- ============================================

CREATE OR REPLACE FUNCTION create_order_with_payment_atomic(
  p_user_id UUID,
  p_shipping_name TEXT,
  p_shipping_address TEXT,
  p_shipping_city TEXT,
  p_shipping_state TEXT,
  p_shipping_zip TEXT,
  p_shipping_phone TEXT,
  p_shipping_email TEXT,
  p_payment_method TEXT,
  p_mercadopago_preference_id TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_cart_item RECORD;
  v_product RECORD;
  v_total_amount DECIMAL(10, 2) := 0;
  v_item_count INTEGER := 0;
  v_subtotal DECIMAL(10, 2);
  v_payment_id UUID;
BEGIN
  -- Validate cart is not empty
  SELECT COUNT(*) INTO v_item_count
  FROM cart_items
  WHERE user_id = p_user_id;
  
  IF v_item_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cart is empty'
    );
  END IF;
  
  -- Create order record
  INSERT INTO orders (
    user_id,
    status,
    total_amount,
    shipping_name,
    shipping_address,
    shipping_city,
    shipping_state,
    shipping_zip,
    shipping_phone,
    shipping_email,
    payment_method
  )
  VALUES (
    p_user_id,
    'pending',
    0, -- Will be updated after calculating items
    p_shipping_name,
    p_shipping_address,
    p_shipping_city,
    p_shipping_state,
    p_shipping_zip,
    p_shipping_phone,
    p_shipping_email,
    p_payment_method
  )
  RETURNING id INTO v_order_id;
  
  -- Process each cart item
  FOR v_cart_item IN
    SELECT * FROM cart_items WHERE user_id = p_user_id
  LOOP
    -- Fetch current product data
    SELECT id, name, price, stock INTO v_product
    FROM products
    WHERE id = v_cart_item.product_id
    AND deleted_at IS NULL;
    
    -- Validate product exists
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', v_cart_item.product_id;
    END IF;
    
    -- Validate stock availability
    IF v_product.stock < v_cart_item.quantity THEN
      RAISE EXCEPTION 'Product % has insufficient stock (available: %, requested: %)',
        v_product.name, v_product.stock, v_cart_item.quantity;
    END IF;
    
    -- Calculate subtotal
    v_subtotal := v_product.price * v_cart_item.quantity;
    v_total_amount := v_total_amount + v_subtotal;
    
    -- Insert order item with price snapshot
    INSERT INTO order_items (
      order_id,
      product_id,
      product_name,
      product_price,
      quantity,
      size,
      subtotal
    )
    VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.price,
      v_cart_item.quantity,
      v_cart_item.size,
      v_subtotal
    );
  END LOOP;
  
  -- Update order total
  UPDATE orders
  SET total_amount = v_total_amount
  WHERE id = v_order_id;
  
  -- Create payment record
  INSERT INTO payments (
    order_id,
    mercadopago_preference_id,
    status,
    amount
  )
  VALUES (
    v_order_id,
    p_mercadopago_preference_id,
    'pending',
    v_total_amount
  )
  RETURNING id INTO v_payment_id;
  
  -- NOTE: Cart is NOT cleared here - it will be cleared by webhook when payment is approved
  
  -- Return success with order and payment data
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'payment_id', v_payment_id,
    'total_amount', v_total_amount,
    'item_count', v_item_count
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 9. Create RPC function: update_payment_from_webhook
-- ============================================

CREATE OR REPLACE FUNCTION update_payment_from_webhook(
)
RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_new_order_status TEXT;
  v_user_id UUID;
BEGIN
  -- Find payment by mercadopago_payment_id
  SELECT * INTO v_payment
  FROM payments
  WHERE mercadopago_payment_id = p_mercadopago_payment_id
  LIMIT 1;
  
  -- If not found by payment_id, try to find by preference_id (first webhook call)
  IF NOT FOUND THEN
    -- This might be the first webhook, try to find by preference_id
    -- We'll need to get the external_reference from Mercado Pago API
    -- For now, return error - the API route will handle this
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Payment not found'
    );
  END IF;
  
  v_order_id := v_payment.order_id;
  
  -- Get user_id from order
  SELECT user_id INTO v_user_id
  FROM orders
  WHERE id = v_order_id;
  
  -- Determine new order status based on payment status
  CASE p_status
    WHEN 'approved' THEN
      v_new_order_status := 'processing';
    WHEN 'rejected', 'cancelled', 'refunded' THEN
      v_new_order_status := 'cancelled';
    ELSE
      v_new_order_status := 'pending';
  END CASE;
  
  -- Update payment record
  UPDATE payments
  SET 
    mercadopago_payment_id = p_mercadopago_payment_id,
    status = p_status,
    payment_method = p_payment_method,
    updated_at = NOW()
  WHERE id = v_payment.id;
  
  -- Update order status
  UPDATE orders
  SET 
    status = v_new_order_status,
    updated_at = NOW()
  WHERE id = v_order_id;
  
  -- Clear cart if payment approved
  IF p_status = 'approved' THEN
    DELETE FROM cart_items
    WHERE user_id = v_user_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment.id,
    'order_id', v_order_id,
    'old_status', v_payment.status,
    'new_status', p_status,
    'order_status', v_new_order_status
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

