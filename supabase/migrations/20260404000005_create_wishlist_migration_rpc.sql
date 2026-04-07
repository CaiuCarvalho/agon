-- Atomic wishlist migration function
-- Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6

-- Function to migrate wishlist items from localStorage to database
-- Ensures all wishlist items are migrated in a single transaction
CREATE OR REPLACE FUNCTION migrate_wishlist_items(
  p_user_id UUID,
  p_items JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_item JSONB;
  v_migrated_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
  v_current_count INTEGER;
  v_inserted BOOLEAN;
BEGIN
  -- Check current wishlist count
  SELECT COUNT(*) INTO v_current_count
  FROM wishlist_items
  WHERE user_id = p_user_id;
  
  -- Iterate through items up to the 20-item limit
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Stop if we've reached the limit
    IF v_current_count >= 20 THEN
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;
    
    -- Insert if not exists (idempotent)
    INSERT INTO wishlist_items (user_id, product_id)
    VALUES (p_user_id, (v_item->>'productId')::UUID)
    ON CONFLICT (user_id, product_id) DO NOTHING
    RETURNING true INTO v_inserted;
    
    -- Check if insert was successful
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION migrate_wishlist_items(UUID, JSONB) IS 'Atomically migrates wishlist items from localStorage to database with 20-item limit enforcement';
