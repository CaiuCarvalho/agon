-- Verification Script: Mercado Pago Setup
-- Run this in Supabase SQL Editor to verify the migration was applied correctly

-- 1. Check if payments table exists
SELECT 
  'payments table' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'payments'
    ) THEN '✅ EXISTS'
    ELSE '❌ NOT FOUND'
  END as status;

-- 2. Check payments table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'payments'
ORDER BY ordinal_position;

-- 3. Check if RPC functions exist
SELECT 
  routine_name as function_name,
  '✅ EXISTS' as status
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name IN ('create_order_with_payment_atomic', 'update_payment_from_webhook');

-- 4. Check RLS policies on payments table
SELECT 
  policyname as policy_name,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'payments';

-- 5. Check indexes on payments table
SELECT 
  indexname as index_name,
  indexdef as definition
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'payments';

-- 6. Check orders table payment_method constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.orders'::regclass
  AND conname LIKE '%payment_method%';

-- 7. Test RPC function (dry run - will rollback)
BEGIN;
  -- This should return an error about empty cart (expected)
  SELECT create_order_with_payment_atomic(
    '00000000-0000-0000-0000-000000000000'::uuid, -- fake user_id
    'Test User',
    'Test Address',
    'Test City',
    'SP',
    '12345-678',
    '(11) 99999-9999',
    'test@example.com',
    'mercadopago_credit_card',
    'test-preference-id'
  );
ROLLBACK;

-- Expected result: {"success": false, "error": "Cart is empty"}

SELECT '✅ All checks completed!' as final_status;
