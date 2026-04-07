-- Atomic add to cart function
-- Requirements: 1.1, 14.3, 14.5

-- Function to atomically add item to cart with price snapshot
-- Prevents race conditions by using INSERT ... ON CONFLICT DO UPDATE
CREATE OR REPLACE FUNCTION add_to_cart_atomic(
  p_user_id UUID,
  p_product_id UUID,
  p_quantity INTEGER,
  p_size TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_product RECORD;
  v_result RECORD;
BEGIN
  -- Validate quantity
  IF p_quantity < 1 OR p_quantity > 99 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Quantidade deve ser entre 1 e 99'
    );
  END IF;
  
  -- Validate size
  IF char_length(p_size) < 1 OR char_length(p_size) > 10 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Tamanho deve ter entre 1 e 10 caracteres'
    );
  END IF;
  
  -- Fetch product details
  SELECT price, name, stock INTO v_product
  FROM products
  WHERE id = p_product_id AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Produto não encontrado'
    );
  END IF;
  
  -- Atomic upsert: insert or update if exists
  INSERT INTO cart_items (
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
    quantity = LEAST(cart_items.quantity + EXCLUDED.quantity, 99),
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION add_to_cart_atomic(UUID, UUID, INTEGER, TEXT) IS 'Atomically adds item to cart with price snapshot, preventing race conditions';
