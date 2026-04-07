# Step-by-Step Verification Guide for Task 3.6

## Overview
This guide walks you through verifying checkout prerequisites for the core-flow-stabilization bugfix.

---

## STEP 1: Access Supabase Dashboard

1. Open your browser
2. Go to: https://yyhpqecnxkvtnjdqhwhk.supabase.co
3. Log in to your Supabase account
4. Navigate to: **SQL Editor** (left sidebar)

---

## STEP 2: Run Checkout Tables Verification

**Copy and paste this query into SQL Editor:**

```sql
-- Check if orders and order_items tables exist
SELECT 
  'CHECKOUT TABLES' as check_type,
  table_name,
  CASE 
    WHEN table_name IN ('orders', 'order_items') THEN '✓ EXISTS'
    ELSE '? UNKNOWN'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('orders', 'order_items')
ORDER BY table_name;
```

**Click "Run" and record the results:**

Expected output:
```
check_type       | table_name   | status
-----------------|--------------|----------
CHECKOUT TABLES  | orders       | ✓ EXISTS
CHECKOUT TABLES  | order_items  | ✓ EXISTS
```

**Your Results:**
- orders table: ___________
- order_items table: ___________

---

## STEP 3: Run RPC Function Verification

**Copy and paste this query:**

```sql
-- Check if create_order_atomic RPC exists
SELECT 
  'CHECKOUT RPC' as check_type,
  routine_name,
  '✓ EXISTS' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'create_order_atomic';
```

**Click "Run" and record the results:**

Expected output:
```
check_type    | routine_name         | status
--------------|---------------------|----------
CHECKOUT RPC  | create_order_atomic | ✓ EXISTS
```

**Your Results:**
- create_order_atomic: ___________

---

## STEP 4: Run Prerequisite Tables Verification

**Copy and paste this query:**

```sql
-- Check if prerequisite tables exist (cart, addresses, products)
SELECT 
  'PREREQUISITE TABLES' as check_type,
  table_name,
  CASE 
    WHEN table_name IN ('cart_items', 'addresses', 'products') THEN '✓ EXISTS'
    ELSE '? UNKNOWN'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('cart_items', 'addresses', 'products')
ORDER BY table_name;
```

**Click "Run" and record the results:**

Expected output:
```
check_type           | table_name  | status
---------------------|-------------|----------
PREREQUISITE TABLES  | addresses   | ✓ EXISTS
PREREQUISITE TABLES  | cart_items  | ✓ EXISTS
PREREQUISITE TABLES  | products    | ✓ EXISTS
```

**Your Results:**
- addresses table: ___________
- cart_items table: ___________
- products table: ___________

---

## STEP 5: Run RLS Verification

**Copy and paste this query:**

```sql
-- Check RLS on orders tables
SELECT 
  'CHECKOUT RLS STATUS' as check_type,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✓ ENABLED'
    ELSE '✗ DISABLED'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('orders', 'order_items')
ORDER BY tablename;
```

**Click "Run" and record the results:**

Expected output:
```
check_type           | tablename    | status
---------------------|--------------|----------
CHECKOUT RLS STATUS  | orders       | ✓ ENABLED
CHECKOUT RLS STATUS  | order_items  | ✓ ENABLED
```

**Your Results:**
- orders RLS: ___________
- order_items RLS: ___________

---

## STEP 6: Run RLS Policies Verification

**Copy and paste this query:**

```sql
-- Check RLS policies on orders tables
SELECT 
  'CHECKOUT RLS POLICIES' as check_type,
  tablename,
  policyname,
  cmd as operation,
  '✓ EXISTS' as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;
```

**Click "Run" and record the results:**

Expected policies:
- orders: 4 policies (select_own, insert_own, update_own_or_admin, delete_admin)
- order_items: 4 policies (select_own, insert_own, update_admin, delete_admin)

**Your Results:**
- Number of orders policies: ___________
- Number of order_items policies: ___________

---

## STEP 7: Run Summary Query

**Copy and paste this query:**

```sql
-- Summary of all checks
SELECT 'Checkout Tables' as category,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('orders', 'order_items'))::text || '/2' as result
UNION ALL
SELECT 'Checkout RPC Functions' as category,
  (SELECT COUNT(*) FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name = 'create_order_atomic')::text || '/1' as result
UNION ALL
SELECT 'Prerequisite Tables' as category,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('cart_items', 'addresses', 'products'))::text || '/3' as result
UNION ALL
SELECT 'Orders RLS Policies' as category,
  (SELECT COUNT(*) FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename = 'orders')::text || ' policies' as result
UNION ALL
SELECT 'Order Items RLS Policies' as category,
  (SELECT COUNT(*) FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename = 'order_items')::text || ' policies' as result;
```

**Click "Run" and record the results:**

Expected output:
```
category                    | result
----------------------------|----------
Checkout Tables             | 2/2
Checkout RPC Functions      | 1/1
Prerequisite Tables         | 3/3
Orders RLS Policies         | 4 policies
Order Items RLS Policies    | 4 policies
```

**Your Results:**
- Checkout Tables: ___________
- Checkout RPC Functions: ___________
- Prerequisite Tables: ___________
- Orders RLS Policies: ___________
- Order Items RLS Policies: ___________

---

## STEP 8: Interpret Results

### ✅ ALL CHECKS PASSED (Expected Result)

If you see:
- ✓ 2/2 checkout tables
- ✓ 1/1 RPC function
- ✓ 3/3 prerequisite tables
- ✓ RLS enabled on all tables
- ✓ All required policies exist

**Conclusion:** Checkout prerequisites are fully met. Database is ready for future checkout implementation.

### ⚠️ SOME CHECKS FAILED

If any checks show missing items:

**Action Required:**
1. Open SQL Editor
2. Copy entire contents of `supabase/migrations/APPLY_CHECKOUT_MIGRATIONS.sql`
3. Paste and execute
4. Return to STEP 2 and re-run all verification queries

---

## STEP 9: Test Cart Functionality (Optional but Recommended)

This verifies that cart operations work (prerequisite for checkout).

**First, get your user ID:**

```sql
-- Get your user ID (you need to be logged in to the app)
SELECT id, email FROM auth.users LIMIT 5;
```

**Then, get a product ID:**

```sql
-- Get a product ID
SELECT id, name, price FROM products LIMIT 5;
```

**Test cart insert (replace UUIDs with actual values):**

```sql
-- Test cart item insert
INSERT INTO cart_items (user_id, product_id, quantity, size, price_snapshot, product_name_snapshot)
VALUES (
  'YOUR-USER-ID-HERE',
  'YOUR-PRODUCT-ID-HERE',
  1,
  'M',
  99.90,
  'Test Product'
)
RETURNING *;
```

**Expected:** Row inserted successfully

**Clean up:**

```sql
-- Remove test data
DELETE FROM cart_items 
WHERE user_id = 'YOUR-USER-ID-HERE' 
AND product_name_snapshot = 'Test Product';
```

---

## STEP 10: Test Address Functionality (Optional but Recommended)

This verifies that address operations work (prerequisite for checkout).

**Test address insert (replace UUID with your user ID):**

```sql
-- Test address insert
INSERT INTO addresses (user_id, zip_code, street, number, neighborhood, city, state, is_default)
VALUES (
  'YOUR-USER-ID-HERE',
  '01310-100',
  'Avenida Paulista',
  '1578',
  'Bela Vista',
  'São Paulo',
  'SP',
  true
)
RETURNING *;
```

**Expected:** Row inserted successfully

**Clean up:**

```sql
-- Remove test data
DELETE FROM addresses 
WHERE user_id = 'YOUR-USER-ID-HERE' 
AND street = 'Avenida Paulista';
```

---

## STEP 11: Document Final Results

After completing all steps, update `CHECKOUT_PREREQUISITES_VERIFICATION.md` with your results.

Fill in the "Verification Results" section at the bottom of the document.

---

## What to Report Back

Please share:
1. Summary results from STEP 7
2. Any errors or unexpected results
3. Whether cart and address tests passed (STEP 9-10)

This will help me complete the task documentation.

---

## Need Help?

If you encounter any issues:
- **Missing tables**: Run `APPLY_CHECKOUT_MIGRATIONS.sql`
- **Permission errors**: Ensure you're logged in as admin
- **RLS policy errors**: Check if RLS is enabled
- **Other errors**: Share the exact error message

