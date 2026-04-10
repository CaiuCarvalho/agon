# Admin Panel Migrations - Application Guide

This guide explains how to apply the Admin Panel MVP migrations to your Supabase database.

## Prerequisites

- Supabase CLI installed (`npm install -g supabase`)
- Local Supabase instance running (`supabase start`) OR access to remote Supabase project
- Database connection configured

## Migrations to Apply

The Admin Panel MVP requires 2 new migrations:

1. **20250409_admin_panel_shipping_fields.sql** - Adds shipping fields and status derivation logic
2. **20250409_update_webhook_rpc_atomic.sql** - Updates webhook RPC with atomic operations

## Application Steps

### Option 1: Local Development (Recommended for Testing)

```bash
# 1. Ensure local Supabase is running
supabase start

# 2. Apply migrations
supabase db reset  # This will apply all migrations including new ones

# 3. Verify migrations were applied
supabase db diff
```

### Option 2: Remote Database (Production/Staging)

```bash
# 1. Link to your remote project
supabase link --project-ref your-project-ref

# 2. Push migrations to remote
supabase db push

# 3. Verify in Supabase Dashboard
# Go to Database > Migrations and check that both migrations are listed
```

### Option 3: Manual Application (SQL Editor)

If you prefer to apply manually via Supabase Dashboard:

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy content from `supabase/migrations/20250409_admin_panel_shipping_fields.sql`
3. Paste and run
4. Copy content from `supabase/migrations/20250409_update_webhook_rpc_atomic.sql`
5. Paste and run

## Verification Checklist

After applying migrations, verify the following:

### 1. Verify Shipping Fields Exist

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('shipping_status', 'tracking_code', 'carrier', 'shipped_at');
```

**Expected Result**: 4 rows showing the new columns

### 2. Verify derive_order_status Function

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'derive_order_status';
```

**Expected Result**: 1 row with routine_type = 'FUNCTION'

### 3. Test derive_order_status Function

```sql
-- Test various status combinations
SELECT 
  derive_order_status('approved', 'pending') as test1,  -- Should return 'processing'
  derive_order_status('approved', 'shipped') as test2,  -- Should return 'shipped'
  derive_order_status('pending', 'pending') as test3,   -- Should return 'pending'
  derive_order_status('rejected', 'pending') as test4;  -- Should return 'cancelled'
```

**Expected Result**:
- test1: 'processing'
- test2: 'shipped'
- test3: 'pending'
- test4: 'cancelled'

### 4. Verify Trigger Exists

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_order_status_on_shipping';
```

**Expected Result**: 1 row showing trigger on 'orders' table for UPDATE event

### 5. Verify assert_single_payment_per_order Function

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'assert_single_payment_per_order';
```

**Expected Result**: 1 row with routine_type = 'FUNCTION'

### 6. Verify Updated RPC Function

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'update_payment_from_webhook';
```

**Expected Result**: 1 row with routine_type = 'FUNCTION'

### 7. Test Trigger Behavior (Optional)

```sql
-- Create a test order with payment (if you have test data)
-- Update shipping_status and verify orders.status is auto-updated

-- Example:
-- UPDATE orders SET shipping_status = 'shipped' WHERE id = 'test-order-id';
-- SELECT status, shipping_status FROM orders WHERE id = 'test-order-id';
-- Expected: status should be 'shipped' (auto-updated by trigger)
```

## Environment Variables

Add the following to your `.env.local` file:

```env
# Admin Panel - Email Whitelist
ADMIN_EMAIL_PRIMARY=your-admin-email@example.com
ADMIN_EMAIL_BACKUP=backup-admin-email@example.com
```

Also add to `.env.example` for documentation:

```env
# Admin Panel - Email Whitelist (required for admin access)
ADMIN_EMAIL_PRIMARY=
ADMIN_EMAIL_BACKUP=
```

## Troubleshooting

### Migration Fails: "column already exists"

If you see errors about columns already existing, it means migrations were partially applied. You can:

1. Check which columns exist: `\d orders` (in psql) or use SQL Editor
2. Manually drop the columns and reapply: `ALTER TABLE orders DROP COLUMN IF EXISTS shipping_status;`
3. Or skip to the next migration

### Trigger Not Firing

If the trigger doesn't update orders.status:

1. Verify trigger exists (query above)
2. Check trigger is enabled: `SELECT tgenabled FROM pg_trigger WHERE tgname = 'trigger_update_order_status_on_shipping';`
3. Test manually: `UPDATE orders SET shipping_status = 'shipped' WHERE id = 'some-id';`

### RPC Function Not Found

If webhook calls fail with "function not found":

1. Verify function exists (query above)
2. Check function signature matches: `\df update_payment_from_webhook` (in psql)
3. Reapply migration: `supabase db reset` (local) or rerun SQL manually

## Next Steps

After successful migration verification:

1. ✅ Migrations applied
2. ✅ Functions and triggers verified
3. ✅ Environment variables configured
4. ➡️ Continue with Task 6: Implement dashboard service and API endpoint

## Rollback (If Needed)

If you need to rollback these migrations:

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS trigger_update_order_status_on_shipping ON orders;

-- Drop functions
DROP FUNCTION IF EXISTS update_order_status_on_shipping_change();
DROP FUNCTION IF EXISTS derive_order_status(TEXT, TEXT);
DROP FUNCTION IF EXISTS assert_single_payment_per_order(UUID);

-- Drop constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_shipping_fields_check;

-- Drop index
DROP INDEX IF EXISTS idx_orders_shipping_status;

-- Drop columns
ALTER TABLE orders 
  DROP COLUMN IF EXISTS shipping_status,
  DROP COLUMN IF EXISTS tracking_code,
  DROP COLUMN IF EXISTS carrier,
  DROP COLUMN IF EXISTS shipped_at;

-- Restore old RPC function (reapply 20250406_mercadopago_payments.sql)
```

---

**Status**: Ready for verification
**Last Updated**: 2025-04-09
