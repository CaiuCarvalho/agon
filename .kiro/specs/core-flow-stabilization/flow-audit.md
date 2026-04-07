# Core Flow Stabilization - Audit Report

## Executive Summary

This audit analyzes the Cart, Wishlist, and Address flows to identify root causes of insert failures. The investigation reveals that **database schema exists but migrations may not be applied**, and **RPC functions are properly defined but may not exist in the live database**.

## Audit Findings

### 1. Cart Flow Analysis

#### Schema Status
✅ **Table Definition Exists**: `supabase/migrations/20260404000001_create_cart_items_table.sql`

**Schema Structure**:
```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity >= 1 AND quantity <= 99),
  size TEXT NOT NULL CHECK (char_length(size) > 0 AND char_length(size) <= 10),
  price_snapshot DECIMAL(10, 2) NOT NULL,
  product_name_snapshot TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_cart_item UNIQUE (user_id, product_id, size)
);
```

#### RLS Policies Status
✅ **Policies Defined**:
- `cart_items_select_own`: Users can read their own cart items
- `cart_items_insert_own`: Users can insert their own cart items
- `cart_items_update_own`: Users can update their own cart items
- `cart_items_delete_own`: Users can delete their own cart items

**Policy Implementation**:
```sql
CREATE POLICY "cart_items_insert_own"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

#### RPC Functions Status
✅ **RPC Function Defined**: `add_to_cart_atomic` in `supabase/migrations/20260404000006_create_add_to_cart_atomic_rpc.sql`

**Function Signature**:
```sql
CREATE OR REPLACE FUNCTION add_to_cart_atomic(
  p_user_id UUID,
  p_product_id UUID,
  p_quantity INTEGER,
  p_size TEXT
)
RETURNS JSONB
```

**Function Features**:
- Validates quantity (1-99)
- Validates size (1-10 chars)
- Fetches product details for snapshot
- Atomic upsert using `INSERT ... ON CONFLICT DO UPDATE`
- Returns success/error in JSONB format

#### Service Layer Status
✅ **Service Implementation**: `apps/web/src/modules/cart/services/cartService.ts`

**Service Features**:
- Uses `add_to_cart_atomic` RPC function
- Implements retry logic for network errors (2 retries, 500ms delay)
- Fallback to direct INSERT if RPC doesn't exist
- Proper error handling with `getErrorMessage()`

**Critical Code Path**:
```typescript
const { data, error } = await supabase.rpc('add_to_cart_atomic', {
  p_user_id: userId,
  p_product_id: validated.productId,
  p_quantity: validated.quantity,
  p_size: validated.size,
});

if (error) {
  if (error.code === '42883') {
    // RPC function doesn't exist - use fallback
    throw new Error('RPC_NOT_FOUND');
  }
  throw new Error(getErrorMessage(error));
}
```

#### Potential Issues
🔴 **CRITICAL**: RPC function may not exist in live database (error code `42883`)
🟡 **MEDIUM**: Fallback INSERT doesn't include `price_snapshot` and `product_name_snapshot` (schema violation)
🟡 **MEDIUM**: No validation that `products` table exists or product is not soft-deleted

---

### 2. Wishlist Flow Analysis

#### Schema Status
✅ **Table Definition Exists**: `supabase/migrations/20260404000002_create_wishlist_items_table.sql`

**Schema Structure**:
```sql
CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_wishlist_item UNIQUE (user_id, product_id)
);
```

#### RLS Policies Status
✅ **Policies Defined**:
- `wishlist_items_select_own`: Users can read their own wishlist items
- `wishlist_items_insert_own`: Users can insert their own wishlist items
- `wishlist_items_delete_own`: Users can delete their own wishlist items

**Policy Implementation**:
```sql
CREATE POLICY "wishlist_items_insert_own"
  ON wishlist_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

#### Trigger Status
✅ **20-Item Limit Trigger Defined**: `supabase/migrations/20260404000003_create_wishlist_limit_trigger.sql`

**Trigger Implementation**:
```sql
CREATE OR REPLACE FUNCTION check_wishlist_limit()
RETURNS TRIGGER AS $
BEGIN
  IF (SELECT COUNT(*) FROM wishlist_items WHERE user_id = NEW.user_id) >= 20 THEN
    RAISE EXCEPTION 'Limite de 20 itens na wishlist atingido';
  END IF;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_wishlist_limit
  BEFORE INSERT ON wishlist_items
  FOR EACH ROW
  EXECUTE FUNCTION check_wishlist_limit();
```

#### Service Layer Status
✅ **Service Implementation**: `apps/web/src/modules/wishlist/services/wishlistService.ts`

**Service Features**:
- Direct INSERT (no RPC function)
- Handles unique constraint violation gracefully (error code `23505`)
- Handles 20-item limit error
- Proper error handling

**Critical Code Path**:
```typescript
const { data, error } = await supabase
  .from('wishlist_items')
  .insert({
    user_id: userId,
    product_id: validated.productId,
  })
  .select('*, product:products(*)')
  .single();

if (error) {
  if (error.code === '23505') {
    // Unique constraint violation - return existing item
    const { data: existing } = await supabase
      .from('wishlist_items')
      .select('*, product:products(*)')
      .eq('user_id', userId)
      .eq('product_id', validated.productId)
      .single();
    
    if (existing) {
      return transformWishlistItemRow(existing);
    }
  }
  
  if (error.message.includes('Limite') || error.message.includes('20 itens')) {
    throw new Error('Limite de 20 itens na wishlist atingido');
  }
  
  throw error;
}
```

#### Potential Issues
🔴 **CRITICAL**: Table or trigger may not exist in live database
🟡 **MEDIUM**: No retry logic (unlike cart service)
🟡 **MEDIUM**: JOIN with `products` table may fail if product doesn't exist

---

### 3. Address Flow Analysis

#### Schema Status
✅ **Table Definition Exists**: `supabase-user-profile-schema.sql`

**Schema Structure**:
```sql
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zip_code TEXT NOT NULL,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### RLS Policies Status
✅ **Policies Defined**:
- `Users can read own addresses`: SELECT policy
- `Users can create own addresses`: INSERT policy
- `Users can update own addresses`: UPDATE policy
- `Users can delete own addresses`: DELETE policy

**Policy Implementation**:
```sql
CREATE POLICY "Users can create own addresses"
  ON addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

#### Unique Constraint Status
✅ **Unique Default Address Constraint**:
```sql
CREATE UNIQUE INDEX unique_default_address_per_user
  ON addresses (user_id)
  WHERE is_default = TRUE;
```

#### Service Layer Status
❌ **NO SERVICE LAYER**: Address operations are handled directly in `AddressManager.tsx` component

**Critical Code Path**:
```typescript
const { data: newAddress, error } = await supabase
  .from("addresses")
  .insert({
    user_id: userId,
    zip_code: data.zipCode,
    street: data.street,
    number: data.number,
    complement: data.complement,
    neighborhood: data.neighborhood,
    city: data.city,
    state: data.state,
    is_default: data.isDefault,
  })
  .select()
  .single();

if (error) throw error;
```

#### Potential Issues
🔴 **CRITICAL**: Table may not exist in live database
🔴 **CRITICAL**: No service layer (violates SDD architecture)
🔴 **CRITICAL**: Direct Supabase calls in UI component (business logic in view)
🟡 **MEDIUM**: No validation layer (Zod schema exists but not used in service)
🟡 **MEDIUM**: No retry logic
🟡 **MEDIUM**: Optimistic updates but no proper rollback on constraint violations

---

## Root Cause Analysis

### Primary Root Cause: Migrations Not Applied

**Evidence**:
1. Cart service has fallback logic for missing RPC function (error code `42883`)
2. All schema definitions exist in migration files
3. User reports consistent failures across all three flows
4. Error toasts appear (indicating service layer is reached but database operation fails)

**Hypothesis**: The migration files exist but have not been executed against the live Supabase database.

**Verification Steps**:
1. Check if `cart_items` table exists in Supabase dashboard
2. Check if `wishlist_items` table exists in Supabase dashboard
3. Check if `addresses` table exists in Supabase dashboard
4. Check if `add_to_cart_atomic` RPC function exists
5. Check if `check_wishlist_limit` trigger function exists

### Secondary Root Causes

#### 1. Cart Fallback INSERT is Broken
**Issue**: Fallback INSERT doesn't include required `price_snapshot` and `product_name_snapshot` fields

**Code Location**: `apps/web/src/modules/cart/services/cartService.ts:157-171`

**Current Code**:
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

**Impact**: If RPC function doesn't exist, fallback will fail with NOT NULL constraint violation

#### 2. Address Operations Violate SDD Architecture
**Issue**: Business logic in UI component instead of service layer

**Code Location**: `apps/web/src/components/profile/AddressManager.tsx`

**Violations**:
- Direct Supabase client calls in component
- No validation service
- No retry logic
- No centralized error handling
- Optimistic updates without proper rollback

**Impact**: Inconsistent error handling, no retry on network failures, difficult to test

#### 3. Missing Products Table Validation
**Issue**: Cart and wishlist operations don't validate that products table exists or product is active

**Impact**: Foreign key constraint violations if products table doesn't exist or product is soft-deleted

---

## Inconsistencies Found

### 1. Service Layer Inconsistency

| Feature | Service Layer | Retry Logic | RPC Function | Validation |
|---------|---------------|-------------|--------------|------------|
| Cart | ✅ Yes | ✅ Yes (2 retries) | ✅ Yes (`add_to_cart_atomic`) | ✅ Zod |
| Wishlist | ✅ Yes | ❌ No | ❌ No | ✅ Zod |
| Address | ❌ No | ❌ No | ❌ No | ⚠️ Partial (Zod in form only) |

**Recommendation**: Standardize all three flows to use service layer with retry logic

### 2. Error Handling Inconsistency

| Feature | Error Codes Handled | Fallback Strategy | User Feedback |
|---------|---------------------|-------------------|---------------|
| Cart | `42883` (RPC missing), `23505` (unique), network errors | Fallback to direct INSERT | Toast + console.error |
| Wishlist | `23505` (unique), limit errors | Return existing item | Toast + console.error |
| Address | Generic errors only | Rollback optimistic update | Toast + console.error |

**Recommendation**: Implement consistent error handling with specific error codes

### 3. Migration File Organization

| Feature | Migration Files | Location | Applied? |
|---------|----------------|----------|----------|
| Cart | 7 files | `supabase/migrations/202604040000*` | ❓ Unknown |
| Wishlist | 3 files | `supabase/migrations/202604040000*` | ❓ Unknown |
| Address | 1 file | `supabase-user-profile-schema.sql` (root) | ❓ Unknown |
| Checkout | 1 consolidated file | `supabase/migrations/APPLY_CHECKOUT_MIGRATIONS.sql` | ❓ Unknown |

**Issue**: Address schema is in root directory, not in `supabase/migrations/` folder

**Recommendation**: Move `supabase-user-profile-schema.sql` to migrations folder with timestamp

---

## Database Schema Verification Checklist

### Tables to Verify
- [ ] `cart_items` table exists
- [ ] `wishlist_items` table exists
- [ ] `addresses` table exists
- [ ] `products` table exists (prerequisite)
- [ ] `auth.users` table exists (Supabase default)

### RLS Policies to Verify
- [ ] `cart_items` has 4 policies (SELECT, INSERT, UPDATE, DELETE)
- [ ] `wishlist_items` has 3 policies (SELECT, INSERT, DELETE)
- [ ] `addresses` has 4 policies (SELECT, INSERT, UPDATE, DELETE)

### RPC Functions to Verify
- [ ] `add_to_cart_atomic(UUID, UUID, INTEGER, TEXT)` exists
- [ ] `migrate_cart_items(UUID, JSONB)` exists
- [ ] `migrate_wishlist_items(UUID, JSONB)` exists
- [ ] `create_order_atomic(...)` exists (for checkout)

### Triggers to Verify
- [ ] `update_cart_items_updated_at` trigger exists
- [ ] `enforce_wishlist_limit` trigger exists
- [ ] `update_addresses_updated_at` trigger exists

### Constraints to Verify
- [ ] `cart_items.unique_cart_item` (user_id, product_id, size)
- [ ] `wishlist_items.unique_wishlist_item` (user_id, product_id)
- [ ] `addresses.unique_default_address_per_user` (user_id WHERE is_default)

---

## Recommended Actions

### PHASE 1: Verify Database State (IMMEDIATE)
1. Open Supabase Dashboard → SQL Editor
2. Run verification queries:
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

### PHASE 2: Apply Missing Migrations (CRITICAL)
If tables don't exist:
1. Apply cart migrations: Execute files `20260404000001` through `20260404000007`
2. Apply wishlist migrations: Execute files `20260404000002`, `20260404000003`, `20260404000005`
3. Apply address migration: Execute `supabase-user-profile-schema.sql` (addresses section only)
4. Verify with PHASE 1 queries

### PHASE 3: Fix Cart Fallback INSERT (HIGH PRIORITY)
Update `apps/web/src/modules/cart/services/cartService.ts`:
```typescript
// Fetch product details for snapshot
const { data: product, error: productError } = await supabase
  .from('products')
  .select('price, name')
  .eq('id', validated.productId)
  .single();

if (productError || !product) {
  throw new Error('Produto não encontrado');
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

### PHASE 4: Create Address Service (HIGH PRIORITY)
Create `apps/web/src/modules/address/services/addressService.ts`:
- Move all Supabase calls from `AddressManager.tsx` to service
- Implement retry logic (same as cart service)
- Implement Zod validation
- Implement proper error handling

### PHASE 5: Add Retry Logic to Wishlist (MEDIUM PRIORITY)
Update `apps/web/src/modules/wishlist/services/wishlistService.ts`:
- Import `withRetry` from cart service or create shared utility
- Wrap all Supabase calls with retry logic

### PHASE 6: Standardize Error Handling (MEDIUM PRIORITY)
Create `apps/web/src/lib/utils/databaseErrors.ts`:
- Centralize error code mapping
- Consistent error messages
- Retry decision logic

---

## Open Questions

1. **Migration Status**: Have any migrations been applied to the live database?
2. **Products Table**: Does the `products` table exist and have data?
3. **Auth Setup**: Is Supabase Auth properly configured with test users?
4. **RLS Testing**: Have RLS policies been tested with authenticated users?
5. **Network Issues**: Are there any CORS or network connectivity issues?

---

## Risk Assessment

| Risk | Severity | Likelihood | Impact | Mitigation |
|------|----------|------------|--------|------------|
| Migrations not applied | 🔴 Critical | High | Complete feature failure | Apply migrations immediately |
| Cart fallback broken | 🔴 Critical | Medium | Cart unusable if RPC missing | Fix fallback INSERT |
| Address architecture violation | 🟡 High | High | Difficult to maintain/test | Refactor to service layer |
| No retry logic in wishlist | 🟡 Medium | Medium | Poor UX on network issues | Add retry logic |
| Products table missing | 🔴 Critical | Low | Foreign key violations | Verify products table exists |

---

## Conclusion

The root cause of insert failures is **likely that database migrations have not been applied to the live Supabase instance**. All schema definitions, RLS policies, and RPC functions are properly defined in migration files, but the database may not reflect these definitions.

**Immediate Action Required**:
1. Verify database state using SQL queries
2. Apply missing migrations
3. Fix cart fallback INSERT
4. Refactor address operations to service layer

**Success Criteria**:
- All three flows (Cart, Wishlist, Address) successfully insert data
- No error toasts on valid operations
- Consistent error handling across all flows
- Service layer architecture followed for all features
