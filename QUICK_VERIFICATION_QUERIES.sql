-- ============================================================================
-- QUICK VERIFICATION QUERIES FOR TASK 3.6
-- Core Flow Stabilization - Checkout Prerequisites Verification
-- ============================================================================
-- 
-- INSTRUCTIONS:
-- 1. Copy this entire file
-- 2. Paste into Supabase Dashboard SQL Editor
-- 3. Click "Run" to execute all queries at once
-- 4. Review results and document findings
--
-- ============================================================================

-- ============================================================================
-- QUERY 1: Checkout Tables Check
-- ============================================================================
SELECT 
  '1. CHECKOUT TABLES' as check_section,
  table_name,
  CASE 
    WHEN table_name IN ('orders', 'order_items') THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('orders', 'order_items')
ORDER BY table_name;

-- ============================================================================
-- QUERY 2: Checkout RPC Function Check
-- ============================================================================
SELECT 
  '2. CHECKOUT RPC' as check_section,
  routine_name,
  '✓ EXISTS' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'create_order_atomic';

-- If no results, the function doesn't exist
SELECT 
  '2. CHECKOUT RPC' as check_section,
  'create_order_atomic' as routine_name,
  '✗ MISSING' as status
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.routines 
  WHERE routine_schema = 'public' 
  AND routine_name = 'create_order_atomic'
);

-- ============================================================================
-- QUERY 3: Prerequisite Tables Check (Cart, Addresses, Products)
-- ============================================================================
SELECT 
  '3. PREREQUISITE TABLES' as check_section,
  table_name,
  CASE 
    WHEN table_name IN ('cart_items', 'addresses', 'products') THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('cart_items', 'addresses', 'products')
ORDER BY table_name;

-- ============================================================================
-- QUERY 4: RLS Status Check
-- ============================================================================
SELECT 
  '4. RLS STATUS' as check_section,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✓ ENABLED'
    ELSE '✗ DISABLED'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('orders', 'order_items')
ORDER BY tablename;

-- ============================================================================
-- QUERY 5: RLS Policies Check
-- ============================================================================
SELECT 
  '5. RLS POLICIES' as check_section,
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✓ HAS REQUIRED POLICIES'
    ELSE '✗ MISSING POLICIES (' || (4 - COUNT(*))::text || ' missing)'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('orders', 'order_items')
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- QUERY 6: Detailed Policy List
-- ============================================================================
SELECT 
  '6. POLICY DETAILS' as check_section,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('orders', 'order_items')
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- QUERY 7: SUMMARY - All Checks
-- ============================================================================
SELECT 
  '7. SUMMARY' as check_section,
  '=====================================' as separator;

SELECT 
  '7. SUMMARY' as check_section,
  'Checkout Tables' as category,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('orders', 'order_items'))::text || '/2' as result,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('orders', 'order_items')) = 2 
    THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status;

SELECT 
  '7. SUMMARY' as check_section,
  'Checkout RPC Functions' as category,
  (SELECT COUNT(*) FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name = 'create_order_atomic')::text || '/1' as result,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.routines 
          WHERE routine_schema = 'public' 
          AND routine_name = 'create_order_atomic') = 1 
    THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status;

SELECT 
  '7. SUMMARY' as check_section,
  'Prerequisite Tables' as category,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('cart_items', 'addresses', 'products'))::text || '/3' as result,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('cart_items', 'addresses', 'products')) = 3 
    THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status;

SELECT 
  '7. SUMMARY' as check_section,
  'RLS Enabled' as category,
  (SELECT COUNT(*) FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('orders', 'order_items')
   AND rowsecurity = true)::text || '/2' as result,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename IN ('orders', 'order_items')
          AND rowsecurity = true) = 2 
    THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status;

SELECT 
  '7. SUMMARY' as check_section,
  'Orders RLS Policies' as category,
  (SELECT COUNT(*) FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename = 'orders')::text || ' policies' as result,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies 
          WHERE schemaname = 'public' 
          AND tablename = 'orders') >= 4 
    THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status;

SELECT 
  '7. SUMMARY' as check_section,
  'Order Items RLS Policies' as category,
  (SELECT COUNT(*) FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename = 'order_items')::text || ' policies' as result,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies 
          WHERE schemaname = 'public' 
          AND tablename = 'order_items') >= 4 
    THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status;

-- ============================================================================
-- QUERY 8: FINAL VERDICT
-- ============================================================================
SELECT 
  '8. FINAL VERDICT' as check_section,
  CASE 
    WHEN (
      -- All tables exist
      (SELECT COUNT(*) FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name IN ('orders', 'order_items')) = 2
      AND
      -- RPC function exists
      (SELECT COUNT(*) FROM information_schema.routines 
       WHERE routine_schema = 'public' 
       AND routine_name = 'create_order_atomic') = 1
      AND
      -- Prerequisite tables exist
      (SELECT COUNT(*) FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name IN ('cart_items', 'addresses', 'products')) = 3
      AND
      -- RLS enabled
      (SELECT COUNT(*) FROM pg_tables 
       WHERE schemaname = 'public' 
       AND tablename IN ('orders', 'order_items')
       AND rowsecurity = true) = 2
      AND
      -- Policies exist
      (SELECT COUNT(*) FROM pg_policies 
       WHERE schemaname = 'public' 
       AND tablename IN ('orders', 'order_items')) >= 8
    )
    THEN '✅ ALL PREREQUISITES MET - Ready for checkout implementation'
    ELSE '⚠️ SOME PREREQUISITES MISSING - Apply migrations and re-verify'
  END as verdict;

-- ============================================================================
-- INTERPRETATION GUIDE
-- ============================================================================
-- 
-- ✅ ALL CHECKS PASS:
--    - Checkout tables exist (orders, order_items)
--    - RPC function exists (create_order_atomic)
--    - Prerequisite tables exist (cart_items, addresses, products)
--    - RLS is enabled on all tables
--    - All required policies exist
--    → CONCLUSION: Database is ready for checkout implementation
--
-- ⚠️ SOME CHECKS FAIL:
--    - Missing tables or functions
--    → ACTION: Apply migrations using APPLY_CHECKOUT_MIGRATIONS.sql
--    → Then re-run this verification script
--
-- ============================================================================
