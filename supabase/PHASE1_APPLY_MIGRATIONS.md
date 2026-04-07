# PHASE 1: Database Migration Application Guide

## Overview

This guide provides step-by-step instructions for applying database migrations to fix Cart, Wishlist, and Address flows in the Agon e-commerce MVP.

**IMPORTANT**: Before applying migrations, run `PHASE1_DATABASE_VERIFICATION.sql` to check what's missing.

## Prerequisites

1. Access to Supabase Dashboard
2. Project URL: Your Supabase project
3. SQL Editor access
4. Backup of existing data (if any)

## Migration Order

Migrations must be applied in the following order to respect dependencies:

### 1. Cart Migrations (4 files)

Execute these files in order in the Supabase SQL Editor:

#### 1.1 Create cart_items table
**File**: `supabase/migrations/20260404000001_create_cart_items_table.sql`

**What it does**:
- Creates `cart_items` table with price snapshot fields
- Enables RLS (Row Level Security)
- Creates 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)
- Creates indexes for performance
- Creates `update_updated_at_column()` trigger function

**How to apply**:
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `20260404000001_create_cart_items_table.sql`
3. Paste into SQL Editor
4. Click "Run" button
5. Verify success message (no errors)

#### 1.2 Create cart migration RPC
**File**: `supabase/migrations/20260404000004_create_cart_migration_rpc.sql`

**What it does**:
- Creates `migrate_cart_items()` RPC function
- Enables atomic migration from localStorage to database
- Handles product validation and snapshot fields

**How to apply**:
1. Copy entire contents of `20260404000004_create_cart_migration_rpc.sql`
2. Paste into SQL Editor
3. Click "Run"
4. Verify success

#### 1.3 Create add_to_cart_atomic RPC
**File**: `supabase/migrations/20260404000006_create_add_to_cart_atomic_rpc.sql`

**What it does**:
- Creates `add_to_cart_atomic()` RPC function
- Prevents race conditions with atomic upsert
- Includes product validation and snapshot fields

**How to apply**:
1. Copy entire contents of `20260404000006_create_add_to_cart_atomic_rpc.sql`
2. Paste into SQL Editor
3. Click "Run"
4. Verify success

#### 1.4 Add cart cross-field constraints
**File**: `supabase/migrations/20260404000007_add_cart_items_cross_field_constraints.sql`

**What it does**:
- Adds CHECK constraints for data validation
- Ensures price_snapshot is positive
- Ensures product_name_snapshot is not empty
- Prevents arithmetic overflow

**How to apply**:
1. Copy entire contents of `20260404000007_add_cart_items_cross_field_constraints.sql`
2. Paste into SQL Editor
3. Click "Run"
4. Verify success

---

### 2. Wishlist Migrations (3 files)

Execute these files in order:

#### 2.1 Create wishlist_items table
**File**: `supabase/migrations/20260404000002_create_wishlist_items_table.sql`

**What it does**:
- Creates `wishlist_items` table
- Enables RLS
- Creates 3 RLS policies (SELECT, INSERT, DELETE)
- Creates indexes for performance

**How to apply**:
1. Copy entire contents of `20260404000002_create_wishlist_items_table.sql`
2. Paste into SQL Editor
3. Click "Run"
4. Verify success

#### 2.2 Create wishlist limit trigger
**File**: `supabase/migrations/20260404000003_create_wishlist_limit_trigger.sql`

**What it does**:
- Creates `check_wishlist_limit()` trigger function
- Enforces 20-item limit per user
- Creates trigger on INSERT operations

**How to apply**:
1. Copy entire contents of `20260404000003_create_wishlist_limit_trigger.sql`
2. Paste into SQL Editor
3. Click "Run"
4. Verify success

#### 2.3 Create wishlist migration RPC
**File**: `supabase/migrations/20260404000005_create_wishlist_migration_rpc.sql`

**What it does**:
- Creates `migrate_wishlist_items()` RPC function
- Enables atomic migration from localStorage to database
- Respects 20-item limit

**How to apply**:
1. Copy entire contents of `20260404000005_create_wishlist_migration_rpc.sql`
2. Paste into SQL Editor
3. Click "Run"
4. Verify success

---

### 3. Address Migration (1 section from file)

#### 3.1 Create addresses table
**File**: `supabase-user-profile-schema.sql` (SECTION 2 only)

**What it does**:
- Creates `addresses` table
- Enables RLS
- Creates 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)
- Creates unique constraint for default address
- Creates indexes for performance

**How to apply**:
1. Open `supabase-user-profile-schema.sql`
2. Copy ONLY the "ADDRESSES TABLE" section (lines starting with `-- 2. ADDRESSES TABLE` through the end of that section)
3. Paste into SQL Editor
4. Click "Run"
5. Verify success

**Note**: If you want to apply the entire user profile schema (profiles, addresses, orders, order_items), you can run the entire file. However, for this bugfix, only the addresses section is required.

---

### 4. Checkout Migrations (prerequisite for future work)

#### 4.1 Apply checkout migrations
**File**: `supabase/migrations/APPLY_CHECKOUT_MIGRATIONS.sql`

**What it does**:
- Creates `orders` and `order_items` tables (if not already created)
- Creates `create_order_atomic()` RPC function
- Enables RLS and creates policies
- Prepares database for checkout feature

**How to apply**:
1. Copy entire contents of `APPLY_CHECKOUT_MIGRATIONS.sql`
2. Paste into SQL Editor
3. Click "Run"
4. Verify success

**Note**: This is a prerequisite for the Basic Checkout feature but not strictly required for Cart/Wishlist/Address flows to work.

---

## Verification

After applying all migrations, run the verification script:

1. Open `supabase/PHASE1_DATABASE_VERIFICATION.sql`
2. Copy entire contents
3. Paste into SQL Editor
4. Click "Run"
5. Review output:
   - All checks should show ✓ (green checkmarks)
   - Summary should show:
     - Tables: 4/4
     - RPC Functions: 3/3
     - RLS Enabled: 3/3
     - RLS Policies: 12+ total

## Troubleshooting

### Error: "relation already exists"

**Cause**: Table or function already exists from a previous migration attempt.

**Solution**: This is safe to ignore. The migrations use `CREATE TABLE IF NOT EXISTS` and `CREATE OR REPLACE FUNCTION` to be idempotent.

### Error: "permission denied"

**Cause**: Insufficient database permissions.

**Solution**: Ensure you're logged in as the database owner or have SUPERUSER privileges. Contact your Supabase project admin.

### Error: "foreign key constraint violation"

**Cause**: Referenced table doesn't exist yet (e.g., `products` table).

**Solution**: 
1. Verify `products` table exists by running: `SELECT * FROM products LIMIT 1;`
2. If it doesn't exist, apply the product catalog migrations first
3. See `supabase-product-catalog-schema.sql` or `supabase-product-catalog-SIMPLES.sql`

### Error: "function does not exist"

**Cause**: Dependent function not created yet.

**Solution**: Ensure you're applying migrations in the correct order (see Migration Order section above).

## Rollback (if needed)

If you need to rollback migrations:

```sql
-- Drop tables (WARNING: This deletes all data!)
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS wishlist_items CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;

-- Drop RPC functions
DROP FUNCTION IF EXISTS add_to_cart_atomic(UUID, UUID, INTEGER, TEXT);
DROP FUNCTION IF EXISTS migrate_cart_items(UUID, JSONB);
DROP FUNCTION IF EXISTS migrate_wishlist_items(UUID, JSONB);
DROP FUNCTION IF EXISTS check_wishlist_limit();

-- Drop trigger function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

**WARNING**: Rollback will delete all data in these tables. Only use for development/testing environments.

## Next Steps

After successfully applying migrations and verifying:

1. Mark Task 3.1 as complete
2. Proceed to Task 3.2 (PHASE 2: Cart Flow Fixes)
3. Test cart, wishlist, and address operations in the application
4. Run automated tests to verify functionality

## Support

If you encounter issues not covered in this guide:

1. Check Supabase logs in Dashboard → Logs
2. Review error messages carefully
3. Verify migration order was followed correctly
4. Check that all prerequisite tables exist (especially `products` and `auth.users`)
