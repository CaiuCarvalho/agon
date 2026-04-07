-- ============================================================================
-- PHASE 1: DATABASE VALIDATION AND MIGRATION APPLICATION
-- Core Flow Stabilization - Task 3.1
-- ============================================================================
-- 
-- PURPOSE: Verify database state and identify missing tables, RPC functions,
--          and RLS policies required for Cart, Wishlist, and Address flows.
--
-- INSTRUCTIONS:
-- 1. Run this entire script in Supabase Dashboard SQL Editor
-- 2. Review the output to see what's missing
-- 3. If anything is missing, apply migrations using PHASE1_APPLY_MIGRATIONS.sql
-- 4. Re-run this script to confirm everything exists
--
-- ============================================================================

-- ============================================================================
-- SECTION 1: TABLE EXISTENCE CHECK
-- ============================================================================
SELECT 
  'TABLE EXISTENCE CHECK' as check_type,
  CASE 
    WHEN COUNT(*) = 4 THEN '✓ ALL TABLES EXIST'
    ELSE '✗ MISSING TABLES: ' || (4 - COUNT(*))::text
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('cart_items', 'wishlist_items', 'addresses', 'products');

-- Detailed table list
SELECT 
  'TABLE DETAILS' as check_type,
  table_name,
  CASE 
    WHEN table_name = 'cart_items' THEN '✓ EXISTS'
    WHEN table_name = 'wishlist_items' THEN '✓ EXISTS'
    WHEN table_name = 'addresses' THEN '✓ EXISTS'
    WHEN table_name = 'products' THEN '✓ EXISTS'
    ELSE '? UNKNOWN'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('cart_items', 'wishlist_items', 'addresses', 'products')
ORDER BY table_name;

-- Check for missing tables
SELECT 
  'MISSING TABLES' as check_type,
  unnest(ARRAY['cart_items', 'wishlist_items', 'addresses', 'products']) as table_name,
  '✗ DOES NOT EXIST' as status
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name = unnest(ARRAY['cart_items', 'wishlist_items', 'addresses', 'products'])
);

-- ============================================================================
-- SECTION 2: RPC FUNCTION EXISTENCE CHECK
-- ============================================================================
SELECT 
  'RPC FUNCTION CHECK' as check_type,
  CASE 
    WHEN COUNT(*) = 3 THEN '✓ ALL RPC FUNCTIONS EXIST'
    ELSE '✗ MISSING RPC FUNCTIONS: ' || (3 - COUNT(*))::text
  END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('add_to_cart_atomic', 'migrate_cart_items', 'migrate_wishlist_items');

-- Detailed RPC function list
SELECT 
  'RPC FUNCTION DETAILS' as check_type,
  routine_name,
  '✓ EXISTS' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('add_to_cart_atomic', 'migrate_cart_items', 'migrate_wishlist_items')
ORDER BY routine_name;

-- Check for missing RPC functions
SELECT 
  'MISSING RPC FUNCTIONS' as check_type,
  unnest(ARRAY['add_to_cart_atomic', 'migrate_cart_items', 'migrate_wishlist_items']) as function_name,
  '✗ DOES NOT EXIST' as status
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.routines 
  WHERE routine_schema = 'public' 
    AND routine_name = unnest(ARRAY['add_to_cart_atomic', 'migrate_cart_items', 'migrate_wishlist_items'])
);

-- ============================================================================
-- SECTION 3: RLS ENABLED CHECK
-- ============================================================================
SELECT 
  'RLS ENABLED CHECK' as check_type,
  CASE 
    WHEN COUNT(*) = 3 AND COUNT(*) FILTER (WHERE rowsecurity = true) = 3 
    THEN '✓ RLS ENABLED ON ALL TABLES'
    ELSE '✗ RLS NOT ENABLED ON SOME TABLES'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('cart_items', 'wishlist_items', 'addresses');

-- Detailed RLS status
SELECT 
  'RLS STATUS DETAILS' as check_type,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✓ ENABLED'
    ELSE '✗ DISABLED'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('cart_items', 'wishlist_items', 'addresses')
ORDER BY tablename;

-- ============================================================================
-- SECTION 4: RLS POLICIES CHECK
-- ============================================================================
-- Expected policies per table:
-- cart_items: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- wishlist_items: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- addresses: 4 policies (SELECT, INSERT, UPDATE, DELETE)

SELECT 
  'RLS POLICIES CHECK' as check_type,
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✓ HAS REQUIRED POLICIES'
    ELSE '✗ MISSING POLICIES: ' || (4 - COUNT(*))::text
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('cart_items', 'wishlist_items', 'addresses')
GROUP BY tablename
ORDER BY tablename;

-- Detailed policy list
SELECT 
  'RLS POLICY DETAILS' as check_type,
  tablename,
  policyname,
  cmd as operation,
  '✓ EXISTS' as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('cart_items', 'wishlist_items', 'addresses')
ORDER BY tablename, cmd;

-- Check for tables with missing policies
SELECT 
  'TABLES WITH MISSING POLICIES' as check_type,
  unnest(ARRAY['cart_items', 'wishlist_items', 'addresses']) as table_name,
  '✗ MISSING POLICIES' as status
WHERE (
  SELECT COUNT(*) 
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename = unnest(ARRAY['cart_items', 'wishlist_items', 'addresses'])
) < 4;

-- ============================================================================
-- SECTION 5: TRIGGER EXISTENCE CHECK
-- ============================================================================
SELECT 
  'TRIGGER CHECK' as check_type,
  trigger_name,
  event_object_table,
  '✓ EXISTS' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND event_object_table IN ('cart_items', 'wishlist_items', 'addresses')
ORDER BY event_object_table, trigger_name;

-- Check for wishlist limit trigger specifically
SELECT 
  'WISHLIST LIMIT TRIGGER' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_schema = 'public' 
        AND event_object_table = 'wishlist_items'
        AND trigger_name LIKE '%wishlist_limit%'
    ) THEN '✓ EXISTS'
    ELSE '✗ DOES NOT EXIST'
  END as status;

-- ============================================================================
-- SECTION 6: CHECKOUT PREREQUISITES CHECK (for future work)
-- ============================================================================
SELECT 
  'CHECKOUT TABLES CHECK' as check_type,
  CASE 
    WHEN COUNT(*) = 2 THEN '✓ CHECKOUT TABLES EXIST'
    ELSE '✗ MISSING CHECKOUT TABLES: ' || (2 - COUNT(*))::text
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('orders', 'order_items');

-- Check for create_order_atomic RPC
SELECT 
  'CHECKOUT RPC CHECK' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_schema = 'public' 
        AND routine_name = 'create_order_atomic'
    ) THEN '✓ create_order_atomic EXISTS'
    ELSE '✗ create_order_atomic DOES NOT EXIST'
  END as status;

-- ============================================================================
-- SECTION 7: SUMMARY
-- ============================================================================
SELECT 
  'VERIFICATION SUMMARY' as check_type,
  '=====================================' as separator;

SELECT 
  'SUMMARY' as check_type,
  'Tables' as category,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('cart_items', 'wishlist_items', 'addresses', 'products'))::text || '/4' as result;

SELECT 
  'SUMMARY' as check_type,
  'RPC Functions' as category,
  (SELECT COUNT(*) FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name IN ('add_to_cart_atomic', 'migrate_cart_items', 'migrate_wishlist_items'))::text || '/3' as result;

SELECT 
  'SUMMARY' as check_type,
  'RLS Enabled' as category,
  (SELECT COUNT(*) FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('cart_items', 'wishlist_items', 'addresses')
   AND rowsecurity = true)::text || '/3' as result;

SELECT 
  'SUMMARY' as check_type,
  'RLS Policies' as category,
  (SELECT COUNT(*) FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename IN ('cart_items', 'wishlist_items', 'addresses'))::text || ' total' as result;

-- ============================================================================
-- NEXT STEPS
-- ============================================================================
-- If any checks show ✗ (missing items):
-- 1. Run PHASE1_APPLY_MIGRATIONS.sql to apply missing migrations
-- 2. Re-run this verification script to confirm all items exist
-- 3. Proceed to PHASE 2 (Cart Flow Fixes)
--
-- If all checks show ✓ (everything exists):
-- 1. Database is ready for PHASE 2
-- 2. No migrations needed
-- ============================================================================
