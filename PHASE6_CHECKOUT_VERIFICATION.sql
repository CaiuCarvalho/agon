-- ============================================================================
-- PHASE 6: Checkout Implementation Preparation - Verification Queries
-- ============================================================================
-- Execute these queries in Supabase SQL Editor to verify checkout prerequisites
-- ============================================================================

-- ============================================================================
-- 1. VERIFY CHECKOUT TABLES EXIST
-- ============================================================================

SELECT 
  'Checkout Tables' AS verification_category,
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ PASS: Both orders and order_items tables exist'
    ELSE '❌ FAIL: Missing checkout tables'
  END AS result,
  string_agg(tablename, ', ') AS tables_found
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'order_items');

-- Detailed table check
SELECT 
  tablename,
  tableowner,
  CASE WHEN tablename IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status
FROM (VALUES ('orders'), ('order_items')) AS expected(tablename)
LEFT JOIN pg_tables ON pg_tables.tablename = expected.tablename 
  AND pg_tables.schemaname = 'public';

-- ============================================================================
-- 2. VERIFY RLS IS ENABLED ON CHECKOUT TABLES
-- ============================================================================

SELECT 
  'RLS Configuration' AS verification_category,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'order_items')
ORDER BY tablename;

-- ============================================================================
-- 3. VERIFY RLS POLICIES EXIST FOR CHECKOUT TABLES
-- ============================================================================

SELECT 
  'RLS Policies' AS verification_category,
  tablename,
  policyname,
  cmd AS operation,
  '✅ EXISTS' AS status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'order_items')
ORDER BY tablename, cmd, policyname;

-- Count policies per table
SELECT 
  tablename,
  COUNT(*) AS policy_count,
  CASE 
    WHEN tablename = 'orders' AND COUNT(*) >= 4 THEN '✅ PASS: Expected policies exist'
    WHEN tablename = 'order_items' AND COUNT(*) >= 4 THEN '✅ PASS: Expected policies exist'
    ELSE '⚠️ WARNING: May be missing policies'
  END AS result
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'order_items')
GROUP BY tablename;

-- ============================================================================
-- 4. VERIFY create_order_atomic RPC FUNCTION EXISTS
-- ============================================================================

SELECT 
  'RPC Functions' AS verification_category,
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type,
  '✅ EXISTS' AS status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'create_order_atomic';

-- Check if function exists (boolean result)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'create_order_atomic'
    ) THEN '✅ PASS: create_order_atomic function exists'
    ELSE '❌ FAIL: create_order_atomic function missing'
  END AS result;

-- ============================================================================
-- 5. VERIFY PREREQUISITE: cart_items TABLE AND OPERATIONS
-- ============================================================================

-- Check cart_items table exists
SELECT 
  'Cart Prerequisites' AS verification_category,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'cart_items'
    ) THEN '✅ PASS: cart_items table exists'
    ELSE '❌ FAIL: cart_items table missing'
  END AS result;

-- Check cart RLS policies
SELECT 
  'Cart RLS Policies' AS verification_category,
  COUNT(*) AS policy_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ PASS: Cart RLS policies configured'
    ELSE '⚠️ WARNING: May be missing cart policies'
  END AS result
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'cart_items';

-- Check add_to_cart_atomic function
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'add_to_cart_atomic'
    ) THEN '✅ PASS: add_to_cart_atomic function exists'
    ELSE '⚠️ INFO: add_to_cart_atomic function missing (fallback will be used)'
  END AS result;

-- ============================================================================
-- 6. VERIFY PREREQUISITE: addresses TABLE AND OPERATIONS
-- ============================================================================

-- Check addresses table exists
SELECT 
  'Address Prerequisites' AS verification_category,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'addresses'
    ) THEN '✅ PASS: addresses table exists'
    ELSE '❌ FAIL: addresses table missing'
  END AS result;

-- Check addresses RLS policies
SELECT 
  'Address RLS Policies' AS verification_category,
  COUNT(*) AS policy_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ PASS: Address RLS policies configured'
    ELSE '⚠️ WARNING: May be missing address policies'
  END AS result
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'addresses';

-- ============================================================================
-- 7. VERIFY PREREQUISITE: products TABLE
-- ============================================================================

-- Check products table exists (required for order_items foreign key)
SELECT 
  'Product Prerequisites' AS verification_category,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'products'
    ) THEN '✅ PASS: products table exists'
    ELSE '❌ FAIL: products table missing'
  END AS result;

-- ============================================================================
-- 8. COMPREHENSIVE SUMMARY
-- ============================================================================

SELECT 
  '=== CHECKOUT READINESS SUMMARY ===' AS summary;

-- Core checkout schema
SELECT 
  'Checkout Schema' AS component,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM pg_tables 
      WHERE schemaname = 'public' AND tablename IN ('orders', 'order_items')
    ) = 2 THEN '✅ READY'
    ELSE '❌ NOT READY'
  END AS status;

-- RPC function
SELECT 
  'create_order_atomic RPC' AS component,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'create_order_atomic'
    ) THEN '✅ READY'
    ELSE '❌ NOT READY'
  END AS status;

-- Cart prerequisite
SELECT 
  'Cart Operations' AS component,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'cart_items'
    ) THEN '✅ READY'
    ELSE '❌ NOT READY'
  END AS status;

-- Address prerequisite
SELECT 
  'Address Operations' AS component,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'addresses'
    ) THEN '✅ READY'
    ELSE '❌ NOT READY'
  END AS status;

-- Products prerequisite
SELECT 
  'Products Table' AS component,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'products'
    ) THEN '✅ READY'
    ELSE '❌ NOT READY'
  END AS status;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- This verification script checks:
-- 1. Checkout tables (orders, order_items) exist
-- 2. RLS is enabled on checkout tables
-- 3. RLS policies are configured for checkout tables
-- 4. create_order_atomic RPC function exists
-- 5. Cart operations are functional (prerequisite)
-- 6. Address operations are functional (prerequisite)
-- 7. Products table exists (prerequisite)
--
-- If any checks fail, the checkout implementation cannot proceed.
-- All prerequisites must be met before implementing checkout functionality.
--
-- ============================================================================
