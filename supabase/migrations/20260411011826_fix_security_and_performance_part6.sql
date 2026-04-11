-- Migration: Fix Security and Performance Issues - Part 6
-- Date: 2026-04-11
-- Description: Fixes update_payment_from_webhook function

CREATE OR REPLACE FUNCTION public.update_payment_from_webhook(
  p_mercadopago_payment_id TEXT,
  p_status TEXT,
  p_payment_method TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payment RECORD;
  v_order_id UUID;
  v_shipping_status TEXT;
  v_new_order_status TEXT;
  v_user_id UUID;
  v_old_payment_status TEXT;
BEGIN
  SELECT * INTO v_payment
  FROM public.payments
  WHERE mercadopago_payment_id = p_mercadopago_payment_id
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Payment not found'
    );
  END IF;
  
  v_order_id := v_payment.order_id;
  v_old_payment_status := v_payment.status;
  
  PERFORM public.assert_single_payment_per_order(v_order_id);
  
  SELECT user_id, shipping_status INTO v_user_id, v_shipping_status
  FROM public.orders
  WHERE id = v_order_id;
  
  v_new_order_status := public.derive_order_status(p_status, v_shipping_status);
  
  UPDATE public.payments
  SET 
    mercadopago_payment_id = p_mercadopago_payment_id,
    status = p_status,
    payment_method = p_payment_method,
    updated_at = NOW()
  WHERE id = v_payment.id;
  
  UPDATE public.orders
  SET 
    status = v_new_order_status,
    updated_at = NOW()
  WHERE id = v_order_id;
  
  IF p_status = 'approved' THEN
    DELETE FROM public.cart_items
    WHERE user_id = v_user_id;
  END IF;
  
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
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_detail', SQLSTATE
    );
END;
$$;;
