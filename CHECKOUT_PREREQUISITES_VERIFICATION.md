# Checkout Implementation Prerequisites - Verification Report

**Task**: 3.6 PHASE 6: Checkout Implementation Preparation  
**Spec**: core-flow-stabilization  
**Date**: Generated during bugfix implementation  
**Status**: VERIFICATION ONLY (No code changes)

## Purpose

This document verifies that all prerequisites for implementing the Checkout feature are met. The actual checkout implementation is out of scope for the core-flow-stabilization bugfix, but we need to ensure the foundation is ready.

## Prerequisites Checklist

### 1. Database Tables

#### Required Tables for Checkout
- [ ] `orders` - Stores customer orders with shipping information
- [ ] `order_items` - Stores individual items within each order with price snapshots

#### Required Tables for Checkout Dependencies
- [ ] `cart_items` - Cart must work before checkout (prerequisite)
- [ ] `addresses` - Addresses must be saveable before checkout (prerequisite)
- [ ] `products` - Products must exist to create orders

### 2. RPC Functions

#### Required for Checkout
- [ ] `create_order_atomic` - Atomically creates order with items and clears cart

#### Required for Cart/Wishlist (Dependencies)
- [ ] `add_to_cart_atomic` - Atomic cart item upsert
- [ ] `migrate_cart_items` - Guest-to-authenticated cart migration
- [ ] `migrate_wishlist_items` - Guest-to-authenticated wishlist migration

### 3. Functional Prerequisites

#### Cart Flow (CRITICAL - Must work before checkout)
- [ ] Authenticated users can add items to cart
- [ ] Cart items persist in database
- [ ] Cart displays items with current product details
- [ ] Cart calculates totals correctly

#### Address Flow (CRITICAL - Must work before checkout)
- [ ] Authenticated users can save addresses
- [ ] Addresses persist in database
- [ ] Users can set default address
- [ ] Address form validation works

### 4. RLS Policies

#### Orders Table Policies
- [ ] `orders_select_own` - Users can read their own orders
- [ ] `orders_insert_own` - Users can create their own orders
- [ ] `orders_update_own_or_admin` - Users can update own orders, admins can update any
- [ ] `orders_delete_admin` - Only admins can delete orders

#### Order Items Table Policies
- [ ] `order_items_select_own` - Users can read items from their own orders
- [ ] `order_items_insert_own` - Users can insert items for their own orders
- [ ] `order_items_update_admin` - Only admins can update order items
- [ ] `order_items_delete_admin` - Only admins can delete order items

## Verification Instructions

### Step 1: Run Database Verification Query

Execute the following SQL in Supabase Dashboard SQL Editor:

```sql
-- ============================================================================
-- CHECKOUT PREREQUISITES VERIFICATION
-- ============================================================================

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

-- Check if create_order_atomic RPC exists
SELECT 
  'CHECKOUT RPC' as check_type,
  routine_name,
  '✓ EXISTS' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'create_order_atomic';

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

-- Summary
SELECT 
  'SUMMARY' as section,
  'Checkout Tables' as category,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('orders', 'order_items'))::text || '/2' as result;

SELECT 
  'SUMMARY' as section,
  'Checkout RPC Functions' as category,
  (SELECT COUNT(*) FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name = 'create_order_atomic')::text || '/1' as result;

SELECT 
  'SUMMARY' as section,
  'Prerequisite Tables' as category,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('cart_items', 'addresses', 'products'))::text || '/3' as result;
```

### Step 2: Test Cart Functionality

Before checkout can work, cart operations must succeed:

```sql
-- Test cart item insert (should succeed after Phase 2 fixes)
-- Replace <your-user-id> and <product-id> with actual UUIDs
INSERT INTO cart_items (user_id, product_id, quantity, size, price_snapshot, product_name_snapshot)
VALUES (
  '<your-user-id>',
  '<product-id>',
  1,
  'M',
  99.90,
  'Test Product'
)
RETURNING *;

-- Verify cart item was inserted
SELECT * FROM cart_items WHERE user_id = '<your-user-id>';

-- Clean up test data
DELETE FROM cart_items WHERE user_id = '<your-user-id>' AND product_name_snapshot = 'Test Product';
```

### Step 3: Test Address Functionality

Before checkout can work, address operations must succeed:

```sql
-- Test address insert (should succeed after Phase 4 fixes)
-- Replace <your-user-id> with actual UUID
INSERT INTO addresses (user_id, zip_code, street, number, neighborhood, city, state, is_default)
VALUES (
  '<your-user-id>',
  '01310-100',
  'Avenida Paulista',
  '1578',
  'Bela Vista',
  'São Paulo',
  'SP',
  true
)
RETURNING *;

-- Verify address was inserted
SELECT * FROM addresses WHERE user_id = '<your-user-id>';

-- Clean up test data
DELETE FROM addresses WHERE user_id = '<your-user-id>' AND street = 'Avenida Paulista';
```

## Expected Results

### If All Prerequisites Are Met

You should see:
- ✓ 2/2 checkout tables exist (orders, order_items)
- ✓ 1/1 checkout RPC function exists (create_order_atomic)
- ✓ 3/3 prerequisite tables exist (cart_items, addresses, products)
- ✓ RLS enabled on orders and order_items
- ✓ All required RLS policies exist
- ✓ Cart item insert succeeds
- ✓ Address insert succeeds

**Status**: Ready for checkout implementation

### If Prerequisites Are Missing

You may see:
- ✗ Missing orders or order_items tables
- ✗ Missing create_order_atomic RPC function
- ✗ Missing cart_items or addresses tables
- ✗ RLS not enabled
- ✗ Missing RLS policies
- ✗ Cart item insert fails
- ✗ Address insert fails

**Action Required**: Apply checkout migrations using `supabase/migrations/APPLY_CHECKOUT_MIGRATIONS.sql`

## Migration Application (If Needed)

If the verification shows missing tables or functions, apply the checkout migrations:

### Option 1: Via Supabase Dashboard (Recommended)

1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `supabase/migrations/APPLY_CHECKOUT_MIGRATIONS.sql`
3. Paste and execute
4. Verify success messages appear
5. Re-run verification queries above

### Option 2: Via Script (Requires Service Role Key)

```bash
# Ensure SUPABASE_SERVICE_ROLE_KEY is set in .env.local
npx tsx scripts/apply-checkout-migrations.ts
```

## Notes

### Scope Clarification

**IN SCOPE for Task 3.6:**
- ✅ Verify database tables exist
- ✅ Verify RPC functions exist
- ✅ Verify cart functionality works (prerequisite)
- ✅ Verify address functionality works (prerequisite)
- ✅ Document verification results

**OUT OF SCOPE for Task 3.6:**
- ❌ Implement checkout UI components
- ❌ Implement checkout service layer
- ❌ Implement order confirmation page
- ❌ Implement payment integration
- ❌ Implement shipping calculation

### Dependencies

This verification depends on successful completion of:
- **Phase 1** (Task 3.1): Database migrations applied
- **Phase 2** (Task 3.2): Cart flow fixes implemented
- **Phase 4** (Task 3.4): Address flow refactor completed

### Future Work

When implementing the actual checkout feature (separate spec), the following will be needed:
- Checkout UI components (`apps/web/src/modules/checkout/components/`)
- Checkout service layer (`apps/web/src/modules/checkout/services/orderService.ts`)
- Checkout validation (`apps/web/src/modules/checkout/contracts.ts`)
- Order confirmation page (`apps/web/src/app/pedido/confirmado/page.tsx`)
- Integration with payment gateway (future enhancement)
- Shipping calculation (future enhancement)

## Verification Results

**To be filled after running verification queries:**

### Database Tables
- [ ] orders table: ___________
- [ ] order_items table: ___________
- [ ] cart_items table: ___________
- [ ] addresses table: ___________
- [ ] products table: ___________

### RPC Functions
- [ ] create_order_atomic: ___________
- [ ] add_to_cart_atomic: ___________
- [ ] migrate_cart_items: ___________
- [ ] migrate_wishlist_items: ___________

### Functional Tests
- [ ] Cart add item: ___________
- [ ] Address save: ___________

### Overall Status
- [ ] ✅ All prerequisites met - Ready for checkout implementation
- [ ] ⚠️ Some prerequisites missing - Apply migrations and re-verify
- [ ] ❌ Critical prerequisites missing - Review Phase 1-4 completion

## Conclusion

This verification ensures that when the checkout feature is implemented (in a future spec), all database prerequisites will be in place. The core-flow-stabilization bugfix focuses on making cart and address flows work correctly, which are essential prerequisites for any checkout implementation.

---

**Next Steps After Verification:**
1. If all checks pass → Mark Task 3.6 complete
2. If checks fail → Review Phase 1 migration application
3. Proceed to Task 3.7 (Verify bug condition exploration test passes)
