# CRITICAL NEXT STEP: Apply Database Migrations

## Current Status

✅ **Code fixes completed** (Tasks 3.2-3.5):
- Cart fallback INSERT includes snapshot fields
- Wishlist service has retry logic
- Address service layer created and refactored
- Service standardization with consistent error handling

❌ **Database migrations NOT applied** (Task 3.1):
- cart_items table does NOT exist
- wishlist_items table does NOT exist
- addresses table does NOT exist
- orders/order_items tables do NOT exist
- RPC functions do NOT exist

## Why Tests Are Failing

The bug condition exploration test (Task 3.7) is failing because:
- Database tables don't exist in the live Supabase instance
- The migration files exist in the codebase but haven't been executed
- This is expected - Task 3.1 requires **manual SQL execution**

## Required Action (CRITICAL)

You MUST execute the database migrations manually:

### Step 1: Open Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)

### Step 2: Execute Migration Script

1. Open the file `supabase/APPLY_ALL_CORE_MIGRATIONS.sql` in your code editor
2. Copy the **entire contents** of the file
3. Paste into Supabase SQL Editor
4. Click **Run** button

### Step 3: Verify Success

Look for this output at the end:

```
====================================
✅ ALL MIGRATIONS APPLIED SUCCESSFULLY!
====================================
📋 Tables: cart_items, wishlist_items, addresses, orders, order_items
⚡ RPC Functions: add_to_cart_atomic, migrate_cart_items, migrate_wishlist_items, create_order_atomic
🔒 RLS: Enabled on all tables with proper policies
====================================
```

### Step 4: Re-run Tests

After migrations are applied, run:

```bash
npm test -- core-flow-stabilization.bugcondition.test.ts
```

The test should now **PASS**, confirming:
- ✅ cart_items table exists
- ✅ wishlist_items table exists
- ✅ addresses table exists
- ✅ All RPC functions exist
- ✅ RLS policies configured

## What Happens After Migrations

Once migrations are applied:
1. Task 3.7 will pass (bug condition test succeeds)
2. Task 3.8 will pass (preservation tests still work)
3. Task 4 can be completed (final checkpoint)
4. Core Flow Stabilization bugfix is complete

## Important Notes

- **SQL syntax is correct** - all migration files use `$$` (double dollar signs) for dollar-quoting
- **No code changes needed** - all service layer fixes are already implemented
- **This is a one-time operation** - migrations only need to be applied once
- **Safe to execute** - migrations use `IF NOT EXISTS` and `DROP IF EXISTS` to prevent conflicts

## Files Reference

- **Migration script**: `supabase/APPLY_ALL_CORE_MIGRATIONS.sql`
- **Verification queries**: `QUICK_VERIFICATION_QUERIES.sql`
- **Checkout verification**: `PHASE6_CHECKOUT_VERIFICATION.sql`
- **Test file**: `apps/web/src/__tests__/core-flow-stabilization.bugcondition.test.ts`

## Troubleshooting

### "relation products does not exist"

**Problem**: Products table missing (prerequisite)

**Solution**: Apply product catalog migrations first:
- Execute `supabase-product-catalog-schema.sql` in Supabase SQL Editor

### "syntax error near $"

**Problem**: This should NOT happen - SQL syntax is correct

**Solution**: Verify you copied the entire file contents, including all `$$` markers

### "permission denied"

**Problem**: Insufficient database permissions

**Solution**: Ensure you're logged in as the database owner or have SUPERUSER privileges

---

**NEXT ACTION**: Execute `supabase/APPLY_ALL_CORE_MIGRATIONS.sql` in Supabase Dashboard SQL Editor
