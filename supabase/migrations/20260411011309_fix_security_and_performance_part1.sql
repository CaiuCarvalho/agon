-- Migration: Fix Security and Performance Issues - Part 1
-- Date: 2026-04-11
-- Description: Fixes function search_path vulnerabilities (6 simple functions)

-- Fix: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix: derive_order_status
CREATE OR REPLACE FUNCTION public.derive_order_status(
  p_payment_status TEXT,
  p_shipping_status TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF p_payment_status = 'approved' AND p_shipping_status = 'delivered' THEN
    RETURN 'delivered';
  ELSIF p_payment_status = 'approved' AND p_shipping_status = 'shipped' THEN
    RETURN 'shipped';
  ELSIF p_payment_status = 'approved' AND p_shipping_status = 'processing' THEN
    RETURN 'processing';
  ELSIF p_payment_status = 'cancelled' OR p_payment_status = 'rejected' THEN
    RETURN 'cancelled';
  ELSE
    RETURN 'pending';
  END IF;
END;
$$;

-- Fix: update_order_status_on_shipping_change
CREATE OR REPLACE FUNCTION public.update_order_status_on_shipping_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_payment_status TEXT;
  v_new_status TEXT;
BEGIN
  SELECT p.status INTO v_payment_status
  FROM public.payments p
  WHERE p.order_id = NEW.id;

  v_new_status := public.derive_order_status(v_payment_status, NEW.shipping_status);
  
  IF v_new_status IS DISTINCT FROM NEW.status THEN
    NEW.status := v_new_status;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix: assert_single_payment_per_order
CREATE OR REPLACE FUNCTION public.assert_single_payment_per_order(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.payments
  WHERE order_id = p_order_id;

  IF v_count > 0 THEN
    RAISE EXCEPTION 'Order % already has a payment record', p_order_id;
  END IF;
END;
$$;

-- Fix: check_wishlist_limit
CREATE OR REPLACE FUNCTION public.check_wishlist_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.wishlist_items
  WHERE user_id = NEW.user_id;

  IF v_count >= 20 THEN
    RAISE EXCEPTION 'Wishlist limit of 20 items reached';
  END IF;

  RETURN NEW;
END;
$$;

-- Fix: update_orders_updated_at
CREATE OR REPLACE FUNCTION public.update_orders_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;;
