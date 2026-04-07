-- Atomic cart migration function
-- Requirements: 3.1, 3.2, 3.3, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6

-- Function to migrate cart items from localStorage to database
-- Ensures all cart items are migrated in a single transaction
CREATE OR REPLACE FUNCTION migrate_cart_items(
  p_user_id UUID,
  p_items JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_item JSONB;
  v_migrated_count INTEGER := 0;
  v_product RECORD;
BEGIN
  -- Iterate through items and insert/update atomically
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Fetch product details for snapshot
    SELECT price, name INTO v_product
    FROM products
    WHERE id = (v_item->>'productId')::UUID
      AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
      -- Skip items with invalid product_id
      CONTINUE;
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
      (v_item->>'productId')::UUID,
      (v_item->>'quantity')::INTEGER,
      v_item->>'size',
      v_product.price,
      v_product.name
    )
    ON CONFLICT (user_id, product_id, size)
    DO UPDATE SET
      quantity = LEAST(cart_items.quantity + EXCLUDED.quantity, 99),
      updated_at = NOW();
    
    v_migrated_count := v_migrated_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'migrated_count', v_migrated_count
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

-- Add comment for documentation
COMMENT ON FUNCTION migrate_cart_items(UUID, JSONB) IS 'Atomically migrates cart items from localStorage to database with automatic rollback on failure';
