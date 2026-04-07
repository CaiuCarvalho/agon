# Core Flow Stabilization Bugfix Design

## Overview

This design addresses critical structural issues preventing Cart, Wishlist, and Address flows from functioning. The root cause is **missing database migrations** combined with **architectural violations** in the address flow and **incomplete fallback logic** in the cart flow.

The fix follows a phased approach:
1. **Database Validation & Migration** - Verify and apply missing schema
2. **Cart Flow Fixes** - Fix RPC fallback to include snapshot fields
3. **Wishlist Flow Fixes** - Add retry logic for network resilience
4. **Address Flow Refactor** - Extract service layer from UI component
5. **Service Standardization** - Consistent error handling and retry patterns
6. **Checkout Preparation** - Ensure prerequisites are met

This design maintains SDD architecture principles: service layer for business logic, consistent error handling, retry logic for network failures, and proper validation with Zod.

## Glossary

- **Bug_Condition (C)**: The condition that triggers insert failures - when database tables/RPC functions don't exist OR when fallback logic is incomplete
- **Property (P)**: The desired behavior - authenticated users can successfully add items to cart/wishlist and save addresses
- **Preservation**: Existing functionality (update, delete, guest localStorage, migration) that must remain unchanged
- **RPC Function**: PostgreSQL stored procedure (`add_to_cart_atomic`) that performs atomic upsert operations
- **RLS (Row Level Security)**: Supabase security policies that enforce user ownership of data
- **Service Layer**: Pure functions in `services/` that handle business logic and database operations
- **Optimistic UI**: UI pattern that immediately shows changes before server confirmation, with rollback on failure
- **Snapshot Fields**: `price_snapshot` and `product_name_snapshot` in cart_items table that preserve historical pricing
- **SDD Architecture**: Spec-Driven Development pattern requiring service layer separation from UI components

## Bug Details

### Bug Condition

The bug manifests when authenticated users attempt to add items to cart, add items to wishlist, or save addresses. The operations fail with error toasts and no database insertion occurs.

**Formal Specification:**
```
FUNCTION isCoreFlowBugCondition(input)
  INPUT: input of type { operation: string, user: User, data: any }
  OUTPUT: boolean
  
  RETURN input.user.authenticated = true AND (
    // Cart bug conditions
    (input.operation = 'addToCart' AND (
      NOT EXISTS table cart_items OR
      NOT EXISTS function add_to_cart_atomic OR
      NOT EXISTS policy cart_items_insert_own OR
      (fallback_triggered AND missing_snapshot_fields)
    )) OR
    
    // Wishlist bug conditions
    (input.operation = 'addToWishlist' AND (
      NOT EXISTS table wishlist_items OR
      NOT EXISTS trigger enforce_wishlist_limit OR
      NOT EXISTS policy wishlist_items_insert_own OR
      no_retry_on_network_error
    )) OR
    
    // Address bug conditions
    (input.operation = 'createAddress' AND (
      NOT EXISTS table addresses OR
      NOT EXISTS policy "Users can create own addresses" OR
      business_logic_in_ui_component
    ))
  )
END FUNCTION
```

### Examples

**Cart Add Item Failure:**
- User clicks "Add to Cart" on product card
- Expected: Item added to database, success toast shown
- Actual: Error toast "Erro ao adicionar ao carrinho", console shows "relation cart_items does not exist" OR "null value in column price_snapshot"

**Wishlist Add Item Failure:**
- User clicks heart icon on product card
- Expected: Item added to wishlist, heart icon fills
- Actual: Error toast "Erro ao adicionar aos favoritos", console shows "relation wishlist_items does not exist"

**Address Insert Failure:**
- User submits address form in profile page
- Expected: Address saved to database, appears in list
- Actual: Error toast "Erro ao adicionar endereço", console shows "relation addresses does not exist"

**Cart Fallback Failure (Edge Case):**
- RPC function `add_to_cart_atomic` doesn't exist in database
- Fallback INSERT triggered but missing `price_snapshot` and `product_name_snapshot`
- Expected: Fallback fetches product details and includes snapshot fields
- Actual: NOT NULL constraint violation on snapshot fields

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Cart update/delete operations must continue to work
- Wishlist remove operations must continue to work
- Address edit/delete operations must continue to work
- Guest user localStorage functionality must remain unchanged
- Guest-to-authenticated migration must continue to work
- Optimistic UI updates with rollback must remain unchanged
- Product JOIN queries must continue to fetch current product details
- RLS policies must continue to enforce user ownership

**Scope:**
All inputs that do NOT involve initial INSERT operations (cart add, wishlist add, address create) should be completely unaffected by this fix. This includes:
- Update operations (cart quantity, address fields)
- Delete operations (remove from cart/wishlist, delete address)
- Read operations (fetch cart items, wishlist items, addresses)
- Guest user operations (localStorage-based cart/wishlist)
- Authentication flows (login, logout, session management)

## Hypothesized Root Cause

Based on the audit findings, the root causes are:

1. **Missing Database Migrations**: The migration files exist in `supabase/migrations/` but have not been executed against the live Supabase database
   - Cart migrations: `20260404000001` through `20260404000007`
   - Wishlist migrations: `20260404000002`, `20260404000003`, `20260404000005`
   - Address migration: `supabase-user-profile-schema.sql` (in root, not in migrations folder)

2. **Incomplete Cart Fallback Logic**: The fallback INSERT in `cartService.ts` doesn't fetch product details to populate `price_snapshot` and `product_name_snapshot` fields (lines 157-171)

3. **Address Architecture Violation**: Business logic exists in `AddressManager.tsx` component instead of a dedicated service layer (violates SDD architecture)

4. **Missing Wishlist Retry Logic**: Unlike cart service, wishlist service doesn't implement retry logic for network errors

5. **Inconsistent Error Handling**: Different error handling patterns across cart, wishlist, and address flows

## Correctness Properties

Property 1: Bug Condition - Core Flows Insert Successfully

_For any_ authenticated user operation where the bug condition holds (isCoreFlowBugCondition returns true), the fixed system SHALL successfully insert data into the appropriate table (cart_items, wishlist_items, or addresses) and return success feedback to the user.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3**

Property 2: Preservation - Non-Insert Operations Unchanged

_For any_ operation that is NOT an initial INSERT (update, delete, read, guest operations), the fixed system SHALL produce exactly the same behavior as the original system, preserving all existing functionality including optimistic UI, rollback on failure, and RLS enforcement.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3**

## Fix Implementation

### Changes Required

The fix is organized into 6 execution phases:

---

#### PHASE 1: Database Validation and Migration Application

**Objective**: Verify database state and apply missing migrations

**File**: Manual SQL execution in Supabase Dashboard

**Verification Queries** (run first):
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('cart_items', 'wishlist_items', 'addresses', 'products');

-- Check if RPC functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('add_to_cart_atomic', 'migrate_cart_items', 'migrate_wishlist_items');

-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('cart_items', 'wishlist_items', 'addresses');

-- Check RLS policies
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('cart_items', 'wishlist_items', 'addresses');
```

**Migration Application** (if tables don't exist):

1. **Cart Migrations**: Execute files in order
   - `supabase/migrations/20260404000001_create_cart_items_table.sql`
   - `supabase/migrations/20260404000004_create_cart_items_rls_policies.sql`
   - `supabase/migrations/20260404000006_create_add_to_cart_atomic_rpc.sql`
   - `supabase/migrations/20260404000007_create_cart_migration_rpc.sql`

2. **Wishlist Migrations**: Execute files in order
   - `supabase/migrations/20260404000002_create_wishlist_items_table.sql`
   - `supabase/migrations/20260404000003_create_wishlist_limit_trigger.sql`
   - `supabase/migrations/20260404000005_create_wishlist_migration_rpc.sql`

3. **Address Migration**: Execute addresses section from
   - `supabase-user-profile-schema.sql` (addresses table, RLS policies, unique constraint)

4. **Checkout Migrations** (prerequisite for future work): Execute
   - `supabase/migrations/APPLY_CHECKOUT_MIGRATIONS.sql`

**Validation** (run after migrations):
- Re-run verification queries
- Verify all tables exist
- Verify all RPC functions exist
- Verify RLS is enabled on all tables
- Verify policies exist for SELECT, INSERT, UPDATE, DELETE

---

#### PHASE 2: Cart Flow Fixes

**Objective**: Fix fallback INSERT to include snapshot fields

**File**: `apps/web/src/modules/cart/services/cartService.ts`

**Current Code** (lines 157-171):
```typescript
const { data, error: insertError } = await supabase
  .from('cart_items')
  .insert({
    user_id: userId,
    product_id: validated.productId,
    quantity: validated.quantity,
    size: validated.size,
    // MISSING: price_snapshot, product_name_snapshot
  })
  .select('*, product:products(*)')
  .single();
```

**Fixed Code**:
```typescript
// Fetch product details for snapshot
const { data: product, error: productError } = await supabase
  .from('products')
  .select('price, name')
  .eq('id', validated.productId)
  .is('deleted_at', null) // Exclude soft-deleted products
  .single();

if (productError || !product) {
  throw new Error('Produto não encontrado ou indisponível');
}

const { data, error: insertError } = await supabase
  .from('cart_items')
  .insert({
    user_id: userId,
    product_id: validated.productId,
    quantity: validated.quantity,
    size: validated.size,
    price_snapshot: product.price,
    product_name_snapshot: product.name,
  })
  .select('*, product:products(*)')
  .single();
```

**Rationale**: The fallback INSERT is triggered when the RPC function doesn't exist. It must include all required fields to avoid NOT NULL constraint violations.

---

#### PHASE 3: Wishlist Flow Fixes

**Objective**: Add retry logic for network resilience

**File**: `apps/web/src/modules/wishlist/services/wishlistService.ts`

**Changes**:

1. Import retry utility from cart service:
```typescript
import { cartService } from '@/modules/cart/services/cartService';
const { withRetry } = cartService;
```

2. Wrap all Supabase calls with `withRetry`:
```typescript
// Before
const { data, error } = await supabase
  .from('wishlist_items')
  .insert({ ... });

// After
const { data, error } = await withRetry(async () => {
  return await supabase
    .from('wishlist_items')
    .insert({ ... });
});
```

3. Apply to all operations:
   - `getWishlistItems`
   - `addToWishlist`
   - `removeFromWishlist`
   - `removeFromWishlistByProductId`
   - `isInWishlist`
   - `clearWishlist`

**Rationale**: Consistency with cart service. Network errors should trigger automatic retry with exponential backoff.

---

#### PHASE 4: Address Flow Refactor

**Objective**: Extract service layer from UI component

**New File**: `apps/web/src/modules/address/services/addressService.ts`

**Service Structure**:
```typescript
import { createClient } from '@/lib/supabase/client';
import { addressSchema } from '../contracts';
import type { Address, AddressInput } from '../types';
import { cartService } from '@/modules/cart/services/cartService';

const { withRetry } = cartService;

function transformAddressRow(row: any): Address {
  return {
    id: row.id,
    userId: row.user_id,
    zipCode: row.zip_code,
    street: row.street,
    number: row.number,
    complement: row.complement,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const addressService = {
  async getAddresses(userId: string): Promise<Address[]> { ... },
  async createAddress(userId: string, input: AddressInput): Promise<Address> { ... },
  async updateAddress(userId: string, addressId: string, input: Partial<AddressInput>): Promise<Address> { ... },
  async deleteAddress(userId: string, addressId: string): Promise<void> { ... },
  async setDefaultAddress(userId: string, addressId: string): Promise<void> { ... },
};
```

**Key Features**:
- Zod validation using `addressSchema.parse(input)`
- Retry logic using `withRetry` for all operations
- Snake_case to camelCase transformation
- Atomic default address updates (unset previous, set new)
- 5-address limit enforcement
- User ownership validation

**File**: `apps/web/src/components/profile/AddressManager.tsx`

**Refactor**:
- Remove all direct Supabase calls
- Replace with `addressService` calls
- Keep optimistic UI logic in component
- Keep toast notifications in component
- Keep state management in component

**Example**:
```typescript
// Before
const { data, error } = await supabase
  .from('addresses')
  .insert({ ... });

// After
const newAddress = await addressService.createAddress(userId, data);
```

---

#### PHASE 5: Service Standardization

**Objective**: Consistent error handling across all services

**New File**: `apps/web/src/lib/utils/databaseErrors.ts`

**Error Code Mapping**:
```typescript
export const DATABASE_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
  NOT_NULL_VIOLATION: '23502',
  FOREIGN_KEY_VIOLATION: '23503',
  RPC_NOT_FOUND: '42883',
  CONNECTION_ERROR: 'PGRST301',
  TIMEOUT: 'PGRST504',
} as const;

export function isRetryableError(error: any): boolean {
  const retryableCodes = [
    DATABASE_ERROR_CODES.CONNECTION_ERROR,
    DATABASE_ERROR_CODES.TIMEOUT,
    '08000', '08003', '08006', '57P03',
  ];
  
  return (
    retryableCodes.includes(error.code) ||
    error.message?.includes('fetch failed') ||
    error.message?.includes('network') ||
    error.message?.includes('timeout')
  );
}

export function getUserFriendlyMessage(error: any): string {
  switch (error.code) {
    case DATABASE_ERROR_CODES.UNIQUE_VIOLATION:
      return 'Este item já existe';
    case DATABASE_ERROR_CODES.NOT_NULL_VIOLATION:
      return 'Dados obrigatórios ausentes';
    case DATABASE_ERROR_CODES.FOREIGN_KEY_VIOLATION:
      return 'Produto não encontrado';
    case DATABASE_ERROR_CODES.RPC_NOT_FOUND:
      return 'Função do banco de dados não encontrada';
    default:
      return 'Erro ao processar operação';
  }
}
```

**Apply to All Services**:
- Update `cartService.ts` to use `isRetryableError`
- Update `wishlistService.ts` to use `isRetryableError`
- Update `addressService.ts` to use `isRetryableError`
- Use `getUserFriendlyMessage` for error toasts

---

#### PHASE 6: Checkout Implementation Preparation

**Objective**: Ensure checkout prerequisites are met

**Verification**:
1. Verify `orders` and `order_items` tables exist
2. Verify `create_order_atomic` RPC function exists
3. Verify cart items can be successfully added (prerequisite for checkout)
4. Verify addresses can be successfully saved (prerequisite for checkout)

**Note**: Actual checkout implementation is out of scope for this bugfix. This phase only ensures the database schema is ready.

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fixes work correctly and preserve existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis.

**Test Plan**: Write tests that attempt to insert data into cart_items, wishlist_items, and addresses tables. Run these tests on the UNFIXED code (before applying migrations) to observe failures and understand the root cause.

**Test Cases**:
1. **Cart Insert Test**: Attempt to add item to cart when table doesn't exist (will fail with "relation does not exist")
2. **Wishlist Insert Test**: Attempt to add item to wishlist when table doesn't exist (will fail with "relation does not exist")
3. **Address Insert Test**: Attempt to save address when table doesn't exist (will fail with "relation does not exist")
4. **Cart Fallback Test**: Simulate RPC function missing, trigger fallback INSERT (will fail with NOT NULL constraint violation on snapshot fields)

**Expected Counterexamples**:
- "relation cart_items does not exist"
- "relation wishlist_items does not exist"
- "relation addresses does not exist"
- "null value in column price_snapshot violates not-null constraint"

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed system produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isCoreFlowBugCondition(input) DO
  result := fixedOperation(input)
  ASSERT (
    result.success = true AND
    EXISTS row IN appropriate_table WHERE (
      row.user_id = input.user.id AND
      row matches input.data
    )
  )
END FOR
```

**Manual Testing Checklist**:

Cart Flow:
- [ ] Add item to cart from product card → item appears in cart with price snapshot
- [ ] Add item to cart from product detail page → item appears in cart with price snapshot
- [ ] Add same item twice → quantity increments (no duplicate)
- [ ] Simulate RPC missing → fallback INSERT succeeds with snapshot fields
- [ ] Network error during add → automatic retry succeeds

Wishlist Flow:
- [ ] Add item to wishlist → heart icon fills, item appears in wishlist
- [ ] Remove item from wishlist → heart icon empties, item removed
- [ ] Add 20 items → 21st item rejected with clear error
- [ ] Add duplicate item → gracefully handled (returns existing)
- [ ] Network error during add → automatic retry succeeds

Address Flow:
- [ ] Submit address form → address appears in list
- [ ] Set default address → previous default unset, new default set
- [ ] Add 5 addresses → 6th address rejected with clear error
- [ ] Edit address → changes saved
- [ ] Delete address → address removed
- [ ] All operations use addressService (verify in code)

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed system produces the same result as the original system.

**Pseudocode:**
```
FOR ALL input WHERE NOT isCoreFlowBugCondition(input) DO
  ASSERT originalOperation(input) = fixedOperation(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for non-insert operations, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Cart Update Preservation**: Verify updating cart item quantity continues to work
2. **Cart Delete Preservation**: Verify removing cart item continues to work
3. **Wishlist Remove Preservation**: Verify removing wishlist item continues to work
4. **Address Edit Preservation**: Verify editing address continues to work
5. **Address Delete Preservation**: Verify deleting address continues to work
6. **Guest Operations Preservation**: Verify localStorage cart/wishlist continues to work
7. **Migration Preservation**: Verify guest-to-authenticated migration continues to work
8. **Optimistic UI Preservation**: Verify optimistic updates with rollback continue to work

### Unit Tests

- Test `cartService.addToCart` with mocked Supabase client
- Test `wishlistService.addToWishlist` with mocked Supabase client
- Test `addressService.createAddress` with mocked Supabase client
- Test retry logic with simulated network failures
- Test error handling with specific error codes (23505, 23502, 42883)
- Test fallback INSERT with product fetch
- Test transformation functions (snake_case to camelCase)

### Property-Based Tests

- Generate random cart items and verify all succeed after fix
- Generate random wishlist items and verify all succeed after fix
- Generate random addresses and verify all succeed after fix
- Verify preservation property: non-insert operations produce identical results

### Integration Tests

- Test cart add item end-to-end with real Supabase instance
- Test wishlist add item end-to-end with real Supabase instance
- Test address insert end-to-end with real Supabase instance
- Test RLS policies with authenticated and unauthenticated users
- Test migration from localStorage to database on login
- Test optimistic UI with rollback on failure

### Database Verification Queries

Run after applying migrations:

```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('cart_items', 'wishlist_items', 'addresses');

-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('cart_items', 'wishlist_items', 'addresses');

-- Verify RLS policies exist
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('cart_items', 'wishlist_items', 'addresses');

-- Verify RPC functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('add_to_cart_atomic', 'check_wishlist_limit');

-- Test cart insert (should succeed)
INSERT INTO cart_items (user_id, product_id, quantity, size, price_snapshot, product_name_snapshot)
VALUES (
  auth.uid(),
  '550e8400-e29b-41d4-a716-446655440000',
  1,
  'M',
  99.90,
  'Test Product'
);

-- Test wishlist insert (should succeed)
INSERT INTO wishlist_items (user_id, product_id)
VALUES (
  auth.uid(),
  '550e8400-e29b-41d4-a716-446655440000'
);

-- Test address insert (should succeed)
INSERT INTO addresses (user_id, zip_code, street, number, neighborhood, city, state, is_default)
VALUES (
  auth.uid(),
  '01310-100',
  'Avenida Paulista',
  '1578',
  'Bela Vista',
  'São Paulo',
  'SP',
  true
);
```

### Success Criteria

The bugfix is considered successful when:
1. All database verification queries return expected results
2. All manual testing checklist items pass
3. All unit tests pass
4. All integration tests pass
5. No regressions detected in preservation tests
6. Code follows SDD architecture (service layer separation)
7. Error handling is consistent across all services
8. Retry logic is implemented for all network operations
