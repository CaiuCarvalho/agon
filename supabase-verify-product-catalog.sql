-- Product Catalog Schema Verification Script
-- Run this after applying the migration to verify everything is set up correctly

-- ============================================================================
-- 1. VERIFY TABLES EXIST
-- ============================================================================

SELECT 
  '1. Tables Created' as check_name,
  COUNT(*) as result,
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected 2 tables (categories, products)'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('categories', 'products');

-- ============================================================================
-- 2. VERIFY COLUMNS
-- ============================================================================

-- Categories columns
SELECT 
  '2a. Categories Columns' as check_name,
  COUNT(*) as result,
  CASE 
    WHEN COUNT(*) = 6 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected 6 columns'
  END as status
FROM information_schema.columns 
WHERE table_name = 'categories'
  AND column_name IN ('id', 'name', 'slug', 'description', 'created_at', 'updated_at');

-- Products columns
SELECT 
  '2b. Products Columns' as check_name,
  COUNT(*) as result,
  CASE 
    WHEN COUNT(*) = 13 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected 13 columns'
  END as status
FROM information_schema.columns 
WHERE table_name = 'products'
  AND column_name IN ('id', 'name', 'description', 'price', 'category_id', 'image_url', 
                      'stock', 'features', 'rating', 'reviews', 'created_at', 'updated_at', 'deleted_at');

-- ============================================================================
-- 3. VERIFY RLS IS ENABLED
-- ============================================================================

SELECT 
  '3. RLS Enabled' as check_name,
  COUNT(*) as result,
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ PASS'
    ELSE '❌ FAIL - RLS should be enabled on both tables'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('categories', 'products')
  AND rowsecurity = true;

-- ============================================================================
-- 4. VERIFY RLS POLICIES
-- ============================================================================

-- Categories policies (should have 4: select, insert, update, delete)
SELECT 
  '4a. Categories Policies' as check_name,
  COUNT(*) as result,
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected 4 policies'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'categories';

-- Products policies (should have 4: select, insert, update, delete)
SELECT 
  '4b. Products Policies' as check_name,
  COUNT(*) as result,
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected 4 policies'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'products';

-- ============================================================================
-- 5. VERIFY INDEXES
-- ============================================================================

-- Categories indexes (should have at least 3: primary key, name unique, slug unique + idx_categories_slug)
SELECT 
  '5a. Categories Indexes' as check_name,
  COUNT(*) as result,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected at least 3 indexes'
  END as status
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'categories';

-- Products indexes (should have at least 7: primary key + 6 performance indexes)
SELECT 
  '5b. Products Indexes' as check_name,
  COUNT(*) as result,
  CASE 
    WHEN COUNT(*) >= 7 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected at least 7 indexes'
  END as status
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'products';

-- ============================================================================
-- 6. VERIFY FULL-TEXT SEARCH INDEXES
-- ============================================================================

SELECT 
  '6. Full-Text Search Indexes' as check_name,
  COUNT(*) as result,
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected 2 GIN indexes for full-text search'
  END as status
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'products'
  AND indexname IN ('idx_products_name_search', 'idx_products_description_search');

-- ============================================================================
-- 7. VERIFY TRIGGERS
-- ============================================================================

-- Categories trigger
SELECT 
  '7a. Categories Trigger' as check_name,
  COUNT(*) as result,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected update_categories_updated_at trigger'
  END as status
FROM information_schema.triggers 
WHERE event_object_table = 'categories'
  AND trigger_name = 'update_categories_updated_at';

-- Products trigger
SELECT 
  '7b. Products Trigger' as check_name,
  COUNT(*) as result,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected update_products_updated_at trigger'
  END as status
FROM information_schema.triggers 
WHERE event_object_table = 'products'
  AND trigger_name = 'update_products_updated_at';

-- ============================================================================
-- 8. VERIFY FOREIGN KEY CONSTRAINTS
-- ============================================================================

SELECT 
  '8. Foreign Key Constraint' as check_name,
  COUNT(*) as result,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected products.category_id -> categories.id'
  END as status
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY'
  AND table_name = 'products'
  AND constraint_name LIKE '%category_id%';

-- ============================================================================
-- 9. VERIFY CHECK CONSTRAINTS
-- ============================================================================

-- Products check constraints (price >= 0, stock >= 0, rating 0-5, etc.)
SELECT 
  '9. Check Constraints' as check_name,
  COUNT(*) as result,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected at least 5 check constraints'
  END as status
FROM information_schema.check_constraints 
WHERE constraint_schema = 'public'
  AND constraint_name LIKE 'products_%';

-- ============================================================================
-- 10. VERIFY SEED DATA
-- ============================================================================

SELECT 
  '10. Seed Categories' as check_name,
  COUNT(*) as result,
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected 4 seed categories'
  END as status
FROM categories 
WHERE slug IN ('manto-oficial', 'equipamentos', 'lifestyle', 'cuidados');

-- ============================================================================
-- 11. DETAILED SEED DATA VIEW
-- ============================================================================

SELECT 
  '11. Seed Data Details' as info,
  name,
  slug,
  created_at
FROM categories
ORDER BY name;

-- ============================================================================
-- 12. SUMMARY
-- ============================================================================

SELECT 
  '============================================' as summary,
  'VERIFICATION COMPLETE' as status,
  'Review results above for any ❌ FAIL items' as action;

-- ============================================================================
-- DETAILED INFORMATION (Optional - uncomment to see details)
-- ============================================================================

-- Uncomment to see all policies
-- SELECT tablename, policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('categories', 'products')
-- ORDER BY tablename, policyname;

-- Uncomment to see all indexes
-- SELECT tablename, indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename IN ('categories', 'products')
-- ORDER BY tablename, indexname;

-- Uncomment to see all columns with data types
-- SELECT table_name, column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name IN ('categories', 'products')
-- ORDER BY table_name, ordinal_position;
