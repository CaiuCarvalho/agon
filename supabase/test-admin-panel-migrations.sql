-- Admin Panel Migrations - Automated Test Suite
-- Copy and paste this entire file into Supabase SQL Editor and run

-- Test 1: Verify shipping fields exist
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM information_schema.columns
  WHERE table_name = 'orders'
    AND column_name IN ('shipping_status', 'tracking_code', 'carrier', 'shipped_at');
  
  IF v_count = 4 THEN
    RAISE NOTICE 'PASS Test 1: All 4 shipping fields exist';
  ELSE
    RAISE EXCEPTION 'FAIL Test 1: Expected 4 fields, found %', v_count;
  END IF;
END $$;

-- Test 2: Verify index created
DO $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'orders'
      AND indexname = 'idx_orders_shipping_status'
  ) INTO v_exists;
  
  IF v_exists THEN
    RAISE NOTICE 'PASS Test 2: Index idx_orders_shipping_status exists';
  ELSE
    RAISE EXCEPTION 'FAIL Test 2: Index not found';
  END IF;
END $$;

-- Test 3: Verify derive_order_status function
DO $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name = 'derive_order_status'
  ) INTO v_exists;
  
  IF v_exists THEN
    RAISE NOTICE 'PASS Test 3: Function derive_order_status exists';
  ELSE
    RAISE EXCEPTION 'FAIL Test 3: Function not found';
  END IF;
END $$;

-- Test 4: Test derive_order_status logic
DO $$
DECLARE
  v_result TEXT;
  v_failed BOOLEAN := FALSE;
BEGIN
  -- Test 1: approved + pending = processing
  v_result := derive_order_status('approved', 'pending');
  IF v_result != 'processing' THEN
    RAISE NOTICE 'FAIL Test 4.1: approved + pending returned %, expected processing', v_result;
    v_failed := TRUE;
  END IF;
  
  -- Test 2: approved + shipped = shipped
  v_result := derive_order_status('approved', 'shipped');
  IF v_result != 'shipped' THEN
    RAISE NOTICE 'FAIL Test 4.2: approved + shipped returned %, expected shipped', v_result;
    v_failed := TRUE;
  END IF;
  
  -- Test 3: approved + delivered = delivered
  v_result := derive_order_status('approved', 'delivered');
  IF v_result != 'delivered' THEN
    RAISE NOTICE 'FAIL Test 4.3: approved + delivered returned %, expected delivered', v_result;
    v_failed := TRUE;
  END IF;
  
  -- Test 4: pending + pending = pending
  v_result := derive_order_status('pending', 'pending');
  IF v_result != 'pending' THEN
    RAISE NOTICE 'FAIL Test 4.4: pending + pending returned %, expected pending', v_result;
    v_failed := TRUE;
  END IF;
  
  -- Test 5: rejected + pending = cancelled
  v_result := derive_order_status('rejected', 'pending');
  IF v_result != 'cancelled' THEN
    RAISE NOTICE 'FAIL Test 4.5: rejected + pending returned %, expected cancelled', v_result;
    v_failed := TRUE;
  END IF;
  
  -- Test 6: cancelled + shipped = cancelled
  v_result := derive_order_status('cancelled', 'shipped');
  IF v_result != 'cancelled' THEN
    RAISE NOTICE 'FAIL Test 4.6: cancelled + shipped returned %, expected cancelled', v_result;
    v_failed := TRUE;
  END IF;
  
  -- Test 7: refunded + delivered = cancelled
  v_result := derive_order_status('refunded', 'delivered');
  IF v_result != 'cancelled' THEN
    RAISE NOTICE 'FAIL Test 4.7: refunded + delivered returned %, expected cancelled', v_result;
    v_failed := TRUE;
  END IF;
  
  IF NOT v_failed THEN
    RAISE NOTICE 'PASS Test 4: All derive_order_status logic tests passed (7/7)';
  ELSE
    RAISE EXCEPTION 'FAIL Test 4: Some derive_order_status tests failed';
  END IF;
END $$;

-- Test 5: Verify trigger exists
DO $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trigger_update_order_status_on_shipping'
  ) INTO v_exists;
  
  IF v_exists THEN
    RAISE NOTICE 'PASS Test 5: Trigger trigger_update_order_status_on_shipping exists';
  ELSE
    RAISE EXCEPTION 'FAIL Test 5: Trigger not found';
  END IF;
END $$;

-- Test 6: Verify assert_single_payment_per_order function
DO $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name = 'assert_single_payment_per_order'
  ) INTO v_exists;
  
  IF v_exists THEN
    RAISE NOTICE 'PASS Test 6: Function assert_single_payment_per_order exists';
  ELSE
    RAISE EXCEPTION 'FAIL Test 6: Function not found';
  END IF;
END $$;

-- Test 7: Verify updated RPC function
DO $$
DECLARE
  v_exists BOOLEAN;
  v_comment TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name = 'update_payment_from_webhook'
  ) INTO v_exists;
  
  IF NOT v_exists THEN
    RAISE EXCEPTION 'FAIL Test 7: Function update_payment_from_webhook not found';
  END IF;
  
  -- Check if comment mentions atomic (indicates updated version)
  SELECT obj_description(p.oid, 'pg_proc') INTO v_comment
  FROM pg_proc p
  WHERE p.proname = 'update_payment_from_webhook'
    AND p.pronamespace = 'public'::regnamespace;
  
  IF v_comment LIKE '%atomic%' THEN
    RAISE NOTICE 'PASS Test 7: RPC function updated (comment mentions atomic)';
  ELSE
    RAISE NOTICE 'WARNING Test 7: RPC function exists but may not be updated (comment does not mention atomic)';
  END IF;
END $$;

-- Test 8: Test constraint (tracking_code required when shipped)
DO $$
BEGIN
  -- Try to create order with shipped status but no tracking_code
  -- This should FAIL due to constraint
  INSERT INTO orders (
    id, user_id, status, total_amount, 
    shipping_name, shipping_address, shipping_city, 
    shipping_state, shipping_zip, shipping_phone, 
    shipping_email, payment_method, shipping_status
  ) VALUES (
    gen_random_uuid(), gen_random_uuid(), 'shipped', 100.00,
    'Test', 'Test Address', 'Test City',
    'TS', '12345', '1234567890',
    'test@test.com', 'credit_card', 'shipped'
  );
  
  -- If we get here, constraint didn't work
  RAISE EXCEPTION 'FAIL Test 8: Constraint did not prevent invalid data';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE 'PASS Test 8: Constraint correctly prevents shipped order without tracking_code';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'FAIL Test 8: Unexpected error: %', SQLERRM;
END $$;

-- Test 9: Test assert_single_payment_per_order with valid data
DO $$
DECLARE
  v_test_order_id UUID;
  v_payment_count INTEGER;
BEGIN
  -- Get any order with exactly 1 payment
  SELECT o.id, COUNT(p.id) INTO v_test_order_id, v_payment_count
  FROM orders o
  LEFT JOIN payments p ON p.order_id = o.id
  GROUP BY o.id
  HAVING COUNT(p.id) = 1
  LIMIT 1;
  
  IF v_test_order_id IS NULL THEN
    RAISE NOTICE 'SKIP Test 9: No orders with payments found (cannot test assert function)';
  ELSE
    -- This should succeed silently
    PERFORM assert_single_payment_per_order(v_test_order_id);
    RAISE NOTICE 'PASS Test 9: assert_single_payment_per_order succeeded for valid order';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'FAIL Test 9: assert_single_payment_per_order raised error: %', SQLERRM;
END $$;

-- Test 10: Verify shipping_status default value
DO $$
DECLARE
  v_default TEXT;
BEGIN
  SELECT column_default INTO v_default
  FROM information_schema.columns
  WHERE table_name = 'orders'
    AND column_name = 'shipping_status';
  
  IF v_default LIKE '%pending%' THEN
    RAISE NOTICE 'PASS Test 10: shipping_status has default value of pending';
  ELSE
    RAISE EXCEPTION 'FAIL Test 10: shipping_status default is %, expected pending', v_default;
  END IF;
END $$;

-- Summary
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Test Suite Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'If all tests passed, migrations are working correctly!';
END $$;
