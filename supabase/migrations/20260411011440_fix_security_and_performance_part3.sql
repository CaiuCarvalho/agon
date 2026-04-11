-- Migration: Fix Security and Performance Issues - Part 3
-- Date: 2026-04-11
-- Description: Fixes migrate functions

-- Fix: migrate_cart_items
CREATE OR REPLACE FUNCTION public.migrate_cart_items(
  p_user_id UUID,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item JSONB;
  v_migrated_count INTEGER := 0;
  v_product RECORD;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT price, name INTO v_product
    FROM public.products
    WHERE id = (v_item->>'productId')::UUID
      AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
      CONTINUE;
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
      (v_item->>'productId')::UUID,
      (v_item->>'quantity')::INTEGER,
      v_item->>'size',
      v_product.price,
      v_product.name
    )
    ON CONFLICT (user_id, product_id, size)
    DO UPDATE SET
      quantity = LEAST(public.cart_items.quantity + EXCLUDED.quantity, 99),
      updated_at = NOW();
    
    v_migrated_count := v_migrated_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'migrated_count', v_migrated_count
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Fix: migrate_wishlist_items
CREATE OR REPLACE FUNCTION public.migrate_wishlist_items(
  p_user_id UUID,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item JSONB;
  v_migrated_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
  v_current_count INTEGER;
  v_inserted BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO v_current_count
  FROM public.wishlist_items
  WHERE user_id = p_user_id;
  
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF v_current_count >= 20 THEN
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;
    
    INSERT INTO public.wishlist_items (user_id, product_id)
    VALUES (p_user_id, (v_item->>'productId')::UUID)
    ON CONFLICT (user_id, product_id) DO NOTHING
    RETURNING true INTO v_inserted;
    
    IF v_inserted THEN
      v_migrated_count := v_migrated_count + 1;
      v_current_count := v_current_count + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'migrated_count', v_migrated_count,
    'skipped_count', v_skipped_count
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;;
