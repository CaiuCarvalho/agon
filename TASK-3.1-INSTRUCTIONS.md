# Task 3.1: Database Validation and Migration Application

## Quick Start

This task validates your Supabase database state and applies missing migrations for Cart, Wishlist, and Address flows.

## Step 1: Run Verification Script

1. Open your **Supabase Dashboard** → **SQL Editor**
2. Open the file: `supabase/PHASE1_DATABASE_VERIFICATION.sql`
3. Copy the entire contents
4. Paste into SQL Editor
5. Click **"Run"**
6. Review the output

### What to Look For

The verification script checks:
- ✓ Tables exist: `cart_items`, `wishlist_items`, `addresses`, `products`
- ✓ RPC functions exist: `add_to_cart_atomic`, `migrate_cart_items`, `migrate_wishlist_items`
- ✓ RLS (Row Level Security) is enabled on all tables
- ✓ RLS policies exist for SELECT, INSERT, UPDATE, DELETE operations

### Possible Outcomes

**Outcome A: Everything Exists (All ✓)**
- Summary shows: Tables 4/4, RPC Functions 3/3, RLS Enabled 3/3
- **Action**: No migrations needed! Task 3.1 is complete.
- **Next**: Proceed to Task 3.2 (Cart Flow Fixes)

**Outcome B: Missing Items (Some ✗)**
- Summary shows missing tables, functions, or policies
- **Action**: Apply migrations (see Step 2 below)

## Step 2: Apply Migrations (if needed)

If Step 1 showed missing items, follow the detailed guide:

📄 **See**: `supabase/PHASE1_APPLY_MIGRATIONS.md`

### Quick Migration Checklist

Apply migrations in this order:

1. **Cart Migrations** (4 files):
   - `20260404000001_create_cart_items_table.sql`
   - `20260404000004_create_cart_migration_rpc.sql`
   - `20260404000006_create_add_to_cart_atomic_rpc.sql`
   - `20260404000007_add_cart_items_cross_field_constraints.sql`

2. **Wishlist Migrations** (3 files):
   - `20260404000002_create_wishlist_items_table.sql`
   - `20260404000003_create_wishlist_limit_trigger.sql`
   - `20260404000005_create_wishlist_migration_rpc.sql`

3. **Address Migration** (1 section):
   - `supabase-user-profile-schema.sql` (SECTION 2: ADDRESSES TABLE only)

4. **Checkout Migrations** (1 file, optional for now):
   - `APPLY_CHECKOUT_MIGRATIONS.sql`

### How to Apply Each Migration

For each file:
1. Open the file in your code editor
2. Copy the entire SQL content
3. Paste into Supabase Dashboard → SQL Editor
4. Click **"Run"**
5. Verify success (no error messages)
6. Move to next file

## Step 3: Re-run Verification

After applying migrations:

1. Run `PHASE1_DATABASE_VERIFICATION.sql` again (same as Step 1)
2. Verify all checks show ✓
3. Confirm summary shows:
   - Tables: 4/4
   - RPC Functions: 3/3
   - RLS Enabled: 3/3
   - RLS Policies: 12+ total

## Success Criteria

Task 3.1 is complete when:
- ✅ All verification checks pass (all ✓)
- ✅ No error messages in SQL Editor
- ✅ All required tables exist
- ✅ All required RPC functions exist
- ✅ RLS is enabled on all tables
- ✅ RLS policies exist for all operations

## Troubleshooting

### "relation already exists"
- **Safe to ignore** - migrations are idempotent
- Tables/functions already exist from previous run

### "permission denied"
- **Solution**: Ensure you're logged in as database owner
- Check Supabase project permissions

### "foreign key constraint violation"
- **Cause**: `products` table doesn't exist
- **Solution**: Apply product catalog migrations first
  - See: `supabase-product-catalog-schema.sql` or `supabase-product-catalog-SIMPLES.sql`

### "function does not exist"
- **Cause**: Migrations applied out of order
- **Solution**: Follow migration order exactly (see Step 2)

## Files Created

This task created the following helper files:

1. **`supabase/PHASE1_DATABASE_VERIFICATION.sql`**
   - Comprehensive verification queries
   - Checks tables, RPC functions, RLS, policies
   - Provides detailed status report

2. **`supabase/PHASE1_APPLY_MIGRATIONS.md`**
   - Detailed migration application guide
   - Step-by-step instructions for each migration
   - Troubleshooting and rollback procedures

3. **`TASK-3.1-INSTRUCTIONS.md`** (this file)
   - Quick start guide
   - High-level overview
   - Success criteria

## Next Steps

After completing Task 3.1:

1. ✅ Mark Task 3.1 as complete
2. ➡️ Proceed to Task 3.2: PHASE 2 - Cart Flow Fixes
3. 🧪 Test cart operations in the application
4. 🧪 Test wishlist operations in the application
5. 🧪 Test address operations in the application

## Notes

- **Preservation**: Existing data in database remains unchanged
- **Idempotent**: Migrations can be run multiple times safely
- **Atomic**: Each migration runs in a transaction (auto-rollback on error)
- **No Code Changes**: This task only modifies database schema

## Questions?

If you encounter issues:
1. Check the detailed guide: `supabase/PHASE1_APPLY_MIGRATIONS.md`
2. Review Supabase Dashboard → Logs for error details
3. Verify prerequisite tables exist (`products`, `auth.users`)
4. Ask for help with specific error messages
