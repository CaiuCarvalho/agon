-- Migration: Fix checkout product lookup to use cart snapshots
-- Date: 2026-04-15
-- Description:
--   1. Both RPCs previously queried products with `AND deleted_at IS NULL`,
--      causing "Product not found" errors for any soft-deleted product still in cart.
--      Fix: use price_snapshot and product_name_snapshot from cart_items (already
--      captured at add-to-cart time) and only query products for stock validation.
--   2. create_order_with_payment_atomic was missing the cart cleanup step.
--      Fix: add DELETE FROM cart_items after processing order items.

-- ─── Fix: create_order_with_payment_atomic ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_order_with_payment_atomic(
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
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order_id UUID;
  v_cart_item RECORD;
  v_product_stock INTEGER;
  v_total_amount DECIMAL(10, 2) := 0;
  v_item_count INTEGER := 0;
  v_subtotal DECIMAL(10, 2);
  v_payment_id UUID;
BEGIN
  SELECT COUNT(*) INTO v_item_count
  FROM public.cart_items
  WHERE user_id = p_user_id;

  IF v_item_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cart is empty'
    );
  END IF;

  INSERT INTO public.orders (
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
    0,
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

  FOR v_cart_item IN
    SELECT * FROM public.cart_items WHERE user_id = p_user_id
  LOOP
    -- Query product only for stock validation (no deleted_at filter).
    -- Price and name come from the snapshot stored at add-to-cart time.
    SELECT stock INTO v_product_stock
    FROM public.products
    WHERE id = v_cart_item.product_id;

    IF FOUND THEN
      -- Product still exists: validate stock availability
      IF v_product_stock < v_cart_item.quantity THEN
        RAISE EXCEPTION 'Produto "%" sem estoque suficiente (disponível: %, solicitado: %)',
          v_cart_item.product_name_snapshot, v_product_stock, v_cart_item.quantity;
      END IF;
    END IF;
    -- If NOT FOUND the product was soft-deleted after being added to cart;
    -- allow checkout using snapshot data (no stock check needed).

    v_subtotal := v_cart_item.price_snapshot * v_cart_item.quantity;
    v_total_amount := v_total_amount + v_subtotal;

    INSERT INTO public.order_items (
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
      v_cart_item.product_id,
      v_cart_item.product_name_snapshot,
      v_cart_item.price_snapshot,
      v_cart_item.quantity,
      v_cart_item.size,
      v_subtotal
    );
  END LOOP;

  UPDATE public.orders
  SET total_amount = v_total_amount
  WHERE id = v_order_id;

  -- Clear cart (was missing in the previous version of this RPC)
  DELETE FROM public.cart_items WHERE user_id = p_user_id;

  INSERT INTO public.payments (
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

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'payment_id', v_payment_id,
    'total_amount', v_total_amount,
    'item_count', v_item_count
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- ─── Fix: create_order_atomic (fallback RPC) ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_user_id UUID,
  p_shipping_name TEXT,
  p_shipping_address TEXT,
  p_shipping_city TEXT,
  p_shipping_state TEXT,
  p_shipping_zip TEXT,
  p_shipping_phone TEXT,
  p_shipping_email TEXT,
  p_payment_method TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order_id UUID;
  v_cart_item RECORD;
  v_product_stock INTEGER;
  v_total_amount DECIMAL(10, 2) := 0;
  v_item_count INTEGER := 0;
  v_subtotal DECIMAL(10, 2);
BEGIN
  SELECT COUNT(*) INTO v_item_count
  FROM public.cart_items
  WHERE user_id = p_user_id;

  IF v_item_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cart is empty'
    );
  END IF;

  INSERT INTO public.orders (
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
    0,
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

  FOR v_cart_item IN
    SELECT * FROM public.cart_items WHERE user_id = p_user_id
  LOOP
    -- Query product only for stock validation (no deleted_at filter).
    -- Price and name come from the snapshot stored at add-to-cart time.
    SELECT stock INTO v_product_stock
    FROM public.products
    WHERE id = v_cart_item.product_id;

    IF FOUND THEN
      -- Product still exists: validate stock availability
      IF v_product_stock < v_cart_item.quantity THEN
        RAISE EXCEPTION 'Produto "%" sem estoque suficiente (disponível: %, solicitado: %)',
          v_cart_item.product_name_snapshot, v_product_stock, v_cart_item.quantity;
      END IF;
    END IF;
    -- If NOT FOUND the product was soft-deleted after being added to cart;
    -- allow checkout using snapshot data (no stock check needed).

    v_subtotal := v_cart_item.price_snapshot * v_cart_item.quantity;
    v_total_amount := v_total_amount + v_subtotal;

    INSERT INTO public.order_items (
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
      v_cart_item.product_id,
      v_cart_item.product_name_snapshot,
      v_cart_item.price_snapshot,
      v_cart_item.quantity,
      v_cart_item.size,
      v_subtotal
    );
  END LOOP;

  UPDATE public.orders
  SET total_amount = v_total_amount
  WHERE id = v_order_id;

  DELETE FROM public.cart_items WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'total_amount', v_total_amount,
    'item_count', v_item_count
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION public.create_order_with_payment_atomic IS
  'Atomically creates an order with items, clears the cart, and creates a pending payment record. Uses price_snapshot/product_name_snapshot from cart_items; only queries products table for stock validation.';

COMMENT ON FUNCTION public.create_order_atomic IS
  'Fallback: atomically creates an order with items and clears the cart (payment record created separately). Uses price_snapshot/product_name_snapshot from cart_items; only queries products table for stock validation.';
