# Admin Panel Migrations - Testing Guide

This guide provides step-by-step instructions for testing the Admin Panel migrations.

## Prerequisites

- Supabase local instance running (`supabase start`)
- OR access to a test/staging Supabase project
- psql or Supabase SQL Editor access

---

## Part 1: Apply Migrations (You Do This)

### Step 1: Apply Migrations

```bash
# Option A: Local (Recommended for testing)
supabase db reset

# Option B: Remote staging
supabase link --project-ref your-staging-ref
supabase db push
```

### Step 2: Verify Migration Files Applied

```bash
# Check migration status
supabase migration list
```

You should see:
- ✅ `20250409_admin_panel_shipping_fields.sql`
- ✅ `20250409_update_webhook_rpc_atomic.sql`

---

## Part 2: Database Tests (You Run These)

Copy and paste each SQL block into Supabase SQL Editor or psql.

### Test 1: Verify Shipping Fields Exist

```sql
-- Expected: 4 rows showing new columns
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('shipping_status', 'tracking_code', 'carrier', 'shipped_at')
ORDER BY column_name;
```

**✅ Pass Criteria**: 
- `shipping_status`: text, NOT NULL, default 'pending'
- `tracking_code`: text, NULL
- `carrier`: text, NULL
- `shipped_at`: timestamp with time zone, NULL

---

### Test 2: Verify Index Created

```sql
-- Expected: 1 row
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename = 'orders'
  AND indexname = 'idx_orders_shipping_status';
```

**✅ Pass Criteria**: Index exists on `orders(shipping_status)`

---

### Test 3: Verify derive_order_status Function

```sql
-- Expected: 1 row
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'derive_order_status';
```

**✅ Pass Criteria**: Function exists, returns TEXT

---

### Test 4: Test derive_order_status Logic

```sql
-- Test all status combinations
SELECT 
  'approved + pending' as scenario,
  derive_order_status('approved', 'pending') as result,
  'processing' as expected
UNION ALL
SELECT 
  'approved + processing',
  derive_order_status('approved', 'processing'),
  'processing'
UNION ALL
SELECT 
  'approved + shipped',
  derive_order_status('approved', 'shipped'),
  'shipped'
UNION ALL
SELECT 
  'approved + delivered',
  derive_order_status('approved', 'delivered'),
  'delivered'
UNION ALL
SELECT 
  'pending + pending',
  derive_order_status('pending', 'pending'),
  'pending'
UNION ALL
SELECT 
  'rejected + pending',
  derive_order_status('rejected', 'pending'),
  'cancelled'
UNION ALL
SELECT 
  'cancelled + shipped',
  derive_order_status('cancelled', 'shipped'),
  'cancelled'
UNION ALL
SELECT 
  'refunded + delivered',
  derive_order_status('refunded', 'delivered'),
  'cancelled';
```

**✅ Pass Criteria**: All `result` columns match `expected` columns

---

### Test 5: Verify Trigger Exists

```sql
-- Expected: 1 row
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_order_status_on_shipping';
```

**✅ Pass Criteria**: 
- Trigger exists on `orders` table
- Event: UPDATE
- Fires BEFORE UPDATE OF shipping_status

---

### Test 6: Verify assert_single_payment_per_order Function

```sql
-- Expected: 1 row
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'assert_single_payment_per_order';
```

**✅ Pass Criteria**: Function exists

---

### Test 7: Verify Updated RPC Function

```sql
-- Expected: 1 row with updated comment
SELECT 
  routine_name,
  routine_type,
  obj_description(p.oid, 'pg_proc') as comment
FROM information_schema.routines r
JOIN pg_proc p ON p.proname = r.routine_name
WHERE routine_schema = 'public'
  AND routine_name = 'update_payment_from_webhook';
```

**✅ Pass Criteria**: 
- Function exists
- Comment mentions "atomic" and "assert_single_payment_per_order"

---

### Test 8: Test Trigger Behavior (With Real Data)

**⚠️ Only run if you have test orders with payments**

```sql
-- Step 1: Find a test order with payment
SELECT 
  o.id as order_id,
  o.status as current_order_status,
  o.shipping_status,
  p.status as payment_status
FROM orders o
JOIN payments p ON p.order_id = o.id
WHERE p.status = 'approved'
LIMIT 1;
```

```sql
-- Step 2: Update shipping_status (replace 'order-id-here' with actual ID)
UPDATE orders 
SET shipping_status = 'shipped' 
WHERE id = 'order-id-here'
RETURNING id, status, shipping_status;
```

**✅ Pass Criteria**: 
- `status` should be 'shipped' (auto-updated by trigger)
- `shipping_status` should be 'shipped' (what you set)

---

### Test 9: Test assert_single_payment_per_order

```sql
-- Test with valid order (should succeed silently)
DO $$
DECLARE
  v_test_order_id UUID;
BEGIN
  -- Get any order with exactly 1 payment
  SELECT o.id INTO v_test_order_id
  FROM orders o
  JOIN payments p ON p.order_id = o.id
  GROUP BY o.id
  HAVING COUNT(p.id) = 1
  LIMIT 1;
  
  IF v_test_order_id IS NOT NULL THEN
    PERFORM assert_single_payment_per_order(v_test_order_id);
    RAISE NOTICE 'Test PASSED: assert_single_payment_per_order succeeded for order %', v_test_order_id;
  ELSE
    RAISE NOTICE 'Test SKIPPED: No orders with payments found';
  END IF;
END $$;
```

**✅ Pass Criteria**: 
- Should see "Test PASSED" message
- No exceptions raised

---

### Test 10: Test Constraint (tracking_code required when shipped)

```sql
-- This should FAIL (tracking_code required when shipped)
DO $$
BEGIN
  -- Try to create order with shipped status but no tracking_code
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
  
  RAISE EXCEPTION 'Test FAILED: Constraint did not prevent invalid data';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE 'Test PASSED: Constraint correctly prevented shipped order without tracking_code';
  WHEN OTHERS THEN
    RAISE NOTICE 'Test FAILED: Unexpected error: %', SQLERRM;
END $$;
```

**✅ Pass Criteria**: Should see "Test PASSED: Constraint correctly prevented..."

---

## Part 3: TypeScript Compilation Test (You Run This)

```bash
# From project root
cd apps/web

# Check TypeScript compilation
npm run build
# OR
npx tsc --noEmit
```

**✅ Pass Criteria**: 
- No TypeScript errors
- Files compile successfully:
  - `src/modules/admin/types.ts`
  - `src/modules/admin/schemas.ts`
  - `src/modules/admin/constants.ts`
  - `src/modules/admin/services/adminService.ts`

---

## Part 4: Environment Variables Test (You Do This)

### Step 1: Add to .env.local

```env
# Admin Panel - Email Whitelist
ADMIN_EMAIL_PRIMARY=your-email@example.com
ADMIN_EMAIL_BACKUP=backup@example.com
```

### Step 2: Verify Variables Load

```bash
# Start dev server
npm run dev

# In another terminal, check if variables are accessible
node -e "console.log(process.env.ADMIN_EMAIL_PRIMARY)"
```

**✅ Pass Criteria**: Your email should be printed

---

## Part 5: Integration Test Checklist

After all database tests pass, verify:

- [ ] Migrations applied without errors
- [ ] All 10 SQL tests passed
- [ ] TypeScript compiles without errors
- [ ] Environment variables configured
- [ ] Dev server starts without errors

---

## Troubleshooting

### Issue: "column already exists"

**Solution**: Migration was partially applied. Either:
1. Drop columns manually and reapply
2. Or skip to next migration

```sql
-- Drop and reapply
ALTER TABLE orders 
  DROP COLUMN IF EXISTS shipping_status,
  DROP COLUMN IF EXISTS tracking_code,
  DROP COLUMN IF EXISTS carrier,
  DROP COLUMN IF EXISTS shipped_at;

-- Then reapply migration
```

### Issue: "function already exists"

**Solution**: Use `CREATE OR REPLACE FUNCTION` (already in migration)

### Issue: Trigger not firing

**Check trigger is enabled**:
```sql
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'trigger_update_order_status_on_shipping';
```

If `tgenabled` is not 'O' (origin), enable it:
```sql
ALTER TABLE orders ENABLE TRIGGER trigger_update_order_status_on_shipping;
```

---

## Expected Results Summary

| Test | Expected Result |
|------|----------------|
| Test 1 | 4 columns exist with correct types |
| Test 2 | Index exists |
| Test 3 | Function exists |
| Test 4 | All 8 scenarios return expected values |
| Test 5 | Trigger exists and configured correctly |
| Test 6 | Assert function exists |
| Test 7 | RPC updated with new comment |
| Test 8 | Trigger auto-updates order status |
| Test 9 | Assert function succeeds for valid data |
| Test 10 | Constraint prevents invalid data |

---

## Next Steps After All Tests Pass

1. ✅ All database tests passed
2. ✅ TypeScript compiles
3. ✅ Environment configured
4. ➡️ Ready to continue with Task 6: Dashboard implementation

---

**Last Updated**: 2025-04-09
**Status**: Ready for testing
