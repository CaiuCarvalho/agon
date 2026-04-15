-- Create atomic order creation RPC function
-- Requirements: 8.1-8.7, 9.1-9.7, 10.1-10.7, 11.1-11.5

CREATE OR REPLACE FUNCTION create_order_atomic(
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
RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_cart_item RECORD;
  v_product RECORD;
  v_total_amount DECIMAL(10, 2) := 0;
  v_item_count INTEGER := 0;
  v_subtotal DECIMAL(10, 2);
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
  
  -- Create order record with initial total of 0
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
    -- Fetch current product data (excluding soft-deleted products)
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
  
  -- Clear cart
  DELETE FROM cart_items WHERE user_id = p_user_id;
  
  -- Return success with order data
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
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

-- Add comment for documentation
