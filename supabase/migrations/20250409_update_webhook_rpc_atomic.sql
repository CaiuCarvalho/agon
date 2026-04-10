-- Migration: Update webhook RPC with atomic operations and defensive checks
-- Description: Updates update_payment_from_webhook to use derive_order_status,
--              add defensive checks, and ensure atomic execution
-- Date: 2025-04-09
-- Dependencies: 20250409_admin_panel_shipping_fields.sql (derive_order_status, assert_single_payment_per_order)

CREATE OR REPLACE FUNCTION update_payment_from_webhook(
  p_mercadopago_payment_id TEXT,
  p_status TEXT,
  p_payment_method TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_payment RECORD;
  v_order_id UUID;
  v_shipping_status TEXT;
  v_new_order_status TEXT;
  v_user_id UUID;
  v_old_payment_status TEXT;
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
  v_old_payment_status := v_payment.status;
  
  -- CRITICAL: Defensive check - validate 1:1 order-payment relationship
  -- This prevents data corruption if multiple payments exist for same order
  PERFORM assert_single_payment_per_order(v_order_id);
  
  -- Get user_id and shipping_status from order
  SELECT user_id, shipping_status INTO v_user_id, v_shipping_status
  FROM orders
  WHERE id = v_order_id;
  
  -- CRITICAL: Derive order status using centralized function
  -- This ensures consistent status derivation across all code paths
  v_new_order_status := derive_order_status(p_status, v_shipping_status);
  
  -- ATOMIC OPERATIONS (all succeed or all fail together):
  
  -- 1. Update payment record
  UPDATE payments
  SET 
    mercadopago_payment_id = p_mercadopago_payment_id,
    status = p_status,
    payment_method = p_payment_method,
    updated_at = NOW()
  WHERE id = v_payment.id;
  
  -- 2. Update order status (CRITICAL: must happen in same transaction)
  UPDATE orders
  SET 
    status = v_new_order_status,
    updated_at = NOW()
  WHERE id = v_order_id;
  
  -- 3. Clear cart if payment approved
  IF p_status = 'approved' THEN
    DELETE FROM cart_items
    WHERE user_id = v_user_id;
  END IF;
  
  -- Return success with detailed information
  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment.id,
    'order_id', v_order_id,
    'old_payment_status', v_old_payment_status,
    'new_payment_status', p_status,
    'order_status', v_new_order_status,
    'shipping_status', v_shipping_status
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Automatic rollback on any error
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_payment_from_webhook IS 'Updates payment and order status from Mercado Pago webhook (idempotent, atomic). Calls assert_single_payment_per_order for defensive check and derive_order_status for consistent status derivation.';
