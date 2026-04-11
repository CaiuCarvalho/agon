-- Migration: Fix Security and Performance Issues - Part 2
-- Date: 2026-04-11
-- Description: Fixes function search_path vulnerabilities (7 complex functions)

-- Fix: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name'
  );
  RETURN NEW;
END;
$$;

-- Fix: add_to_cart_atomic
CREATE OR REPLACE FUNCTION public.add_to_cart_atomic(
  p_user_id UUID,
  p_product_id UUID,
  p_quantity INTEGER,
  p_size TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_product RECORD;
  v_result RECORD;
BEGIN
  IF p_quantity < 1 OR p_quantity > 99 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Quantidade deve ser entre 1 e 99'
    );
  END IF;
  
  IF char_length(p_size) < 1 OR char_length(p_size) > 10 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Tamanho deve ter entre 1 e 10 caracteres'
    );
  END IF;
  
  SELECT price, name, stock INTO v_product
  FROM public.products
  WHERE id = p_product_id AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Produto não encontrado'
    );
  END IF;
  
  INSERT INTO public.cart_items (
    user_id,
    product_id,
    quantity,
    size,
    price_snapshot,
    product_name_snapshot
  )
  VALUES (
    p_user_id,
    p_product_id,
    p_quantity,
    p_size,
    v_product.price,
    v_product.name
  )
  ON CONFLICT (user_id, product_id, size)
  DO UPDATE SET
    quantity = LEAST(public.cart_items.quantity + EXCLUDED.quantity, 99),
    updated_at = NOW()
  RETURNING * INTO v_result;
  
  RETURN jsonb_build_object(
    'success', true,
    'item', row_to_json(v_result)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;;
