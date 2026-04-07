-- Validation script for Task 2.1: Ativar RLS nas tabelas sensíveis
-- Requirements: 1
-- This script checks if RLS is enabled on cart_items and wishlist_items tables

-- Check RLS status on sensitive tables
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END AS status
FROM pg_tables
WHERE tablename IN ('cart_items', 'wishlist_items')
  AND schemaname = 'public'
ORDER BY tablename;

-- Expected output:
-- cart_items: rls_enabled = true
-- wishlist_items: rls_enabled = true
