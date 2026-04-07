# Bugfix Requirements Document: Core Flow Stabilization

## Introduction

This document specifies the bugfix requirements for critical structural issues affecting Cart, Wishlist, and Address flows in the Agon e-commerce MVP. Users are unable to add items to cart, add items to wishlist, or save addresses due to database schema mismatches, missing RPC functions, and architectural violations. The bugfix ensures these core flows are operational before implementing the Checkout feature.

The bug condition methodology is used to systematically validate fixes and prevent regressions.

## Bug Analysis

### Current Behavior (Defect)

#### 1. Cart Add Item Failures

1.1 WHEN an authenticated user clicks "Add to Cart" on a product card THEN the system shows an error toast and the item is not added to the database

1.2 WHEN an authenticated user clicks "Add to Cart" on a product detail page THEN the system shows an error toast and the item is not added to the database

1.3 WHEN the `add_to_cart_atomic` RPC function does not exist in the database THEN the fallback INSERT fails with NOT NULL constraint violation on `price_snapshot` and `product_name_snapshot` fields

1.4 WHEN the `cart_items` table does not exist in the database THEN all cart operations fail with "relation does not exist" error

#### 2. Wishlist Add Item Failures

2.1 WHEN an authenticated user clicks the wishlist heart icon on a product card THEN the system shows an error toast and the item is not added to the database

2.2 WHEN an authenticated user clicks the wishlist heart icon on the wishlist page THEN the system shows an error toast and the item is not removed from the database

2.3 WHEN the `wishlist_items` table does not exist in the database THEN all wishlist operations fail with "relation does not exist" error

2.4 WHEN the `check_wishlist_limit` trigger function does not exist THEN the 20-item limit is not enforced

#### 3. Address Insert Failures

3.1 WHEN an authenticated user submits the address form in the profile page (`/perfil`) THEN the system shows an error toast and the address is not saved to the database

3.2 WHEN the `addresses` table does not exist in the database THEN all address operations fail with "relation does not exist" error

3.3 WHEN an authenticated user tries to set a default address THEN the operation fails silently or shows an error toast

#### 4. RLS Policy Blocking

4.1 WHEN RLS policies are not properly configured THEN authenticated users cannot INSERT their own cart items even though they own the data

4.2 WHEN RLS policies are not properly configured THEN authenticated users cannot INSERT their own wishlist items even though they own the data

4.3 WHEN RLS policies are not properly configured THEN authenticated users cannot INSERT their own addresses even though they own the data

#### 5. Service Layer Inconsistencies

5.1 WHEN address operations are performed THEN business logic executes in the UI component instead of a service layer (violates SDD architecture)

5.2 WHEN wishlist operations fail due to network errors THEN no retry logic is executed (unlike cart service which has retry logic)

5.3 WHEN cart fallback INSERT is triggered THEN the operation fails because required snapshot fields are missing

### Expected Behavior (Correct)

#### 1. Cart Operations Should Succeed

1.1 WHEN an authenticated user clicks "Add to Cart" on a product card THEN the system SHALL add the item to the `cart_items` table with price snapshot and show success feedback

1.2 WHEN an authenticated user clicks "Add to Cart" on a product detail page THEN the system SHALL add the item to the `cart_items` table with price snapshot and show success feedback

1.3 WHEN the `add_to_cart_atomic` RPC function does not exist THEN the fallback INSERT SHALL fetch product details and include `price_snapshot` and `product_name_snapshot` fields

1.4 WHEN the `cart_items` table exists with proper schema THEN all cart operations SHALL succeed for authenticated users

1.5 WHEN a cart item already exists (same product_id and size) THEN the system SHALL increment the quantity atomically without race conditions

#### 2. Wishlist Operations Should Succeed

2.1 WHEN an authenticated user clicks the wishlist heart icon on a product card THEN the system SHALL add the item to the `wishlist_items` table and show success feedback

2.2 WHEN an authenticated user clicks the wishlist heart icon on an already-favorited product THEN the system SHALL remove the item from the `wishlist_items` table and show success feedback

2.3 WHEN the `wishlist_items` table exists with proper schema THEN all wishlist operations SHALL succeed for authenticated users

2.4 WHEN a user tries to add more than 20 items to wishlist THEN the system SHALL reject the operation with a clear error message

2.5 WHEN a wishlist item already exists (same product_id) THEN the system SHALL handle the unique constraint violation gracefully by returning the existing item

#### 3. Address Operations Should Succeed

3.1 WHEN an authenticated user submits the address form in the profile page THEN the system SHALL save the address to the `addresses` table and show success feedback

3.2 WHEN the `addresses` table exists with proper schema THEN all address operations SHALL succeed for authenticated users

3.3 WHEN an authenticated user sets a default address THEN the system SHALL unset the previous default and set the new default atomically

3.4 WHEN an authenticated user tries to add more than 5 addresses THEN the system SHALL reject the operation with a clear error message

#### 4. RLS Policies Should Allow Authorized Operations

4.1 WHEN an authenticated user performs INSERT on `cart_items` with their own `user_id` THEN RLS policies SHALL allow the operation

4.2 WHEN an authenticated user performs INSERT on `wishlist_items` with their own `user_id` THEN RLS policies SHALL allow the operation

4.3 WHEN an authenticated user performs INSERT on `addresses` with their own `user_id` THEN RLS policies SHALL allow the operation

4.4 WHEN an authenticated user performs SELECT/UPDATE/DELETE on their own data THEN RLS policies SHALL allow the operations

#### 5. Service Layer Should Be Consistent

5.1 WHEN address operations are performed THEN business logic SHALL execute in a dedicated `addressService` (not in UI component)

5.2 WHEN wishlist operations fail due to network errors THEN the system SHALL retry up to 2 times with exponential backoff (consistent with cart service)

5.3 WHEN cart fallback INSERT is triggered THEN the system SHALL fetch product details and include all required fields

5.4 WHEN any database operation fails THEN the system SHALL use consistent error handling with specific error codes

### Unchanged Behavior (Regression Prevention)

#### 1. Cart Behavior Preservation

1.1 WHEN an authenticated user updates cart item quantity THEN the system SHALL CONTINUE TO update the quantity in the database

1.2 WHEN an authenticated user removes a cart item THEN the system SHALL CONTINUE TO delete the item from the database

1.3 WHEN a guest user adds items to cart THEN the system SHALL CONTINUE TO use localStorage (not database)

1.4 WHEN a guest user logs in with cart items in localStorage THEN the system SHALL CONTINUE TO migrate items to the database

1.5 WHEN cart operations use optimistic UI THEN the system SHALL CONTINUE TO show immediate feedback and rollback on failure

#### 2. Wishlist Behavior Preservation

2.1 WHEN an authenticated user views their wishlist page THEN the system SHALL CONTINUE TO display all wishlist items with product details

2.2 WHEN a guest user adds items to wishlist THEN the system SHALL CONTINUE TO use localStorage (not database)

2.3 WHEN a guest user logs in with wishlist items in localStorage THEN the system SHALL CONTINUE TO migrate items to the database

2.4 WHEN wishlist operations use optimistic UI THEN the system SHALL CONTINUE TO show immediate feedback and rollback on failure

#### 3. Address Behavior Preservation

3.1 WHEN an authenticated user views their addresses THEN the system SHALL CONTINUE TO display all saved addresses

3.2 WHEN an authenticated user edits an address THEN the system SHALL CONTINUE TO update the address in the database

3.3 WHEN an authenticated user deletes an address THEN the system SHALL CONTINUE TO remove the address from the database

3.4 WHEN address operations use optimistic UI THEN the system SHALL CONTINUE TO show immediate feedback and rollback on failure

#### 4. Authentication and Authorization Preservation

4.1 WHEN a non-authenticated user tries to access cart/wishlist/address data THEN the system SHALL CONTINUE TO redirect to login or use localStorage

4.2 WHEN an authenticated user tries to access another user's data THEN RLS policies SHALL CONTINUE TO block the operation

4.3 WHEN auth.uid() is null THEN RLS policies SHALL CONTINUE TO deny all operations on user-owned tables

#### 5. Product Integration Preservation

5.1 WHEN a product is soft-deleted THEN cart and wishlist items SHALL CONTINUE TO reference the product via foreign key

5.2 WHEN a product price changes THEN cart items SHALL CONTINUE TO show the price snapshot from when the item was added

5.3 WHEN a product is displayed in cart/wishlist THEN the system SHALL CONTINUE TO JOIN with the products table to show current details

## Bug Condition Derivation

### Bug Condition Functions

#### Cart Add Item Bug Condition
```pascal
FUNCTION isCartAddItemBugCondition(X)
  INPUT: X of type CartAddItemInput
  OUTPUT: boolean
  
  // Returns true when cart add item bug is triggered
  RETURN (
    X.user IS authenticated AND
    (
      NOT EXISTS table cart_items OR
      NOT EXISTS function add_to_cart_atomic OR
      NOT EXISTS policy cart_items_insert_own OR
      (
        EXISTS function add_to_cart_atomic AND
        function_fails_with_error(add_to_cart_atomic, X) AND
        fallback_insert_missing_required_fields(X)
      )
    )
  )
END FUNCTION
```

#### Wishlist Add Item Bug Condition
```pascal
FUNCTION isWishlistAddItemBugCondition(X)
  INPUT: X of type WishlistAddItemInput
  OUTPUT: boolean
  
  // Returns true when wishlist add item bug is triggered
  RETURN (
    X.user IS authenticated AND
    (
      NOT EXISTS table wishlist_items OR
      NOT EXISTS trigger enforce_wishlist_limit OR
      NOT EXISTS policy wishlist_items_insert_own
    )
  )
END FUNCTION
```

#### Address Insert Bug Condition
```pascal
FUNCTION isAddressInsertBugCondition(X)
  INPUT: X of type AddressInsertInput
  OUTPUT: boolean
  
  // Returns true when address insert bug is triggered
  RETURN (
    X.user IS authenticated AND
    (
      NOT EXISTS table addresses OR
      NOT EXISTS policy "Users can create own addresses" OR
      business_logic_in_ui_component(X)
    )
  )
END FUNCTION
```

### Property Specifications

#### Property: Fix Checking - Cart Add Item
```pascal
// Property: Cart add item should succeed for authenticated users
FOR ALL X WHERE isCartAddItemBugCondition(X) DO
  result ← addToCart'(X)
  ASSERT (
    result.success = true AND
    EXISTS row IN cart_items WHERE (
      row.user_id = X.user.id AND
      row.product_id = X.productId AND
      row.size = X.size AND
      row.quantity = X.quantity AND
      row.price_snapshot IS NOT NULL AND
      row.product_name_snapshot IS NOT NULL
    )
  )
END FOR
```

#### Property: Fix Checking - Wishlist Add Item
```pascal
// Property: Wishlist add item should succeed for authenticated users
FOR ALL X WHERE isWishlistAddItemBugCondition(X) DO
  result ← addToWishlist'(X)
  ASSERT (
    result.success = true AND
    EXISTS row IN wishlist_items WHERE (
      row.user_id = X.user.id AND
      row.product_id = X.productId
    )
  )
END FOR
```

#### Property: Fix Checking - Address Insert
```pascal
// Property: Address insert should succeed for authenticated users
FOR ALL X WHERE isAddressInsertBugCondition(X) DO
  result ← createAddress'(X)
  ASSERT (
    result.success = true AND
    EXISTS row IN addresses WHERE (
      row.user_id = X.user.id AND
      row.zip_code = X.zipCode AND
      row.street = X.street AND
      row.number = X.number
    ) AND
    business_logic_in_service_layer(X)
  )
END FOR
```

#### Property: Preservation Checking
```pascal
// Property: Non-buggy operations should behave identically
FOR ALL X WHERE NOT (
  isCartAddItemBugCondition(X) OR
  isWishlistAddItemBugCondition(X) OR
  isAddressInsertBugCondition(X)
) DO
  ASSERT F(X) = F'(X)
END FOR

WHERE:
  F  = original (unfixed) function
  F' = fixed function
```

## Counterexamples

### Cart Add Item Counterexample
```typescript
// Concrete example demonstrating the cart bug
const buggyInput = {
  user: { id: '123e4567-e89b-12d3-a456-426614174000', authenticated: true },
  productId: '550e8400-e29b-41d4-a716-446655440000',
  quantity: 2,
  size: 'M'
};

// Current behavior (buggy)
const result = await addToCart(buggyInput);
// Result: Error toast "Erro ao adicionar ao carrinho"
// Database: No row inserted
// Console: "relation cart_items does not exist" OR "null value in column price_snapshot"

// Expected behavior (fixed)
const result = await addToCart'(buggyInput);
// Result: Success toast "Item adicionado ao carrinho"
// Database: Row inserted with price_snapshot and product_name_snapshot
// UI: Cart count incremented
```

### Wishlist Add Item Counterexample
```typescript
// Concrete example demonstrating the wishlist bug
const buggyInput = {
  user: { id: '123e4567-e89b-12d3-a456-426614174000', authenticated: true },
  productId: '550e8400-e29b-41d4-a716-446655440000'
};

// Current behavior (buggy)
const result = await addToWishlist(buggyInput);
// Result: Error toast "Erro ao adicionar aos favoritos"
// Database: No row inserted
// Console: "relation wishlist_items does not exist"

// Expected behavior (fixed)
const result = await addToWishlist'(buggyInput);
// Result: Success toast "Item adicionado aos favoritos"
// Database: Row inserted
// UI: Heart icon filled
```

### Address Insert Counterexample
```typescript
// Concrete example demonstrating the address bug
const buggyInput = {
  user: { id: '123e4567-e89b-12d3-a456-426614174000', authenticated: true },
  zipCode: '01310-100',
  street: 'Avenida Paulista',
  number: '1578',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  isDefault: true
};

// Current behavior (buggy)
const result = await createAddress(buggyInput);
// Result: Error toast "Erro ao adicionar endereço"
// Database: No row inserted
// Console: "relation addresses does not exist"
// Architecture: Business logic in AddressManager.tsx component

// Expected behavior (fixed)
const result = await createAddress'(buggyInput);
// Result: Success toast "Endereço adicionado com sucesso"
// Database: Row inserted
// UI: Address displayed in list
// Architecture: Business logic in addressService.ts
```

## Validation Strategy

### Manual Testing Checklist

#### Cart Flow Validation
- [ ] Add item to cart from product card → item appears in cart
- [ ] Add item to cart from product detail page → item appears in cart
- [ ] Add same item twice → quantity increments (no duplicate)
- [ ] Add item when RPC function missing → fallback INSERT succeeds
- [ ] Add item as guest → uses localStorage
- [ ] Login with cart in localStorage → items migrate to database

#### Wishlist Flow Validation
- [ ] Add item to wishlist from product card → heart icon fills
- [ ] Remove item from wishlist → heart icon empties
- [ ] Add 20 items to wishlist → 21st item rejected with error
- [ ] Add same item twice → gracefully handled (no duplicate)
- [ ] Add item as guest → uses localStorage
- [ ] Login with wishlist in localStorage → items migrate to database

#### Address Flow Validation
- [ ] Submit address form → address appears in list
- [ ] Set default address → previous default unset, new default set
- [ ] Add 5 addresses → 6th address rejected with error
- [ ] Edit address → changes saved to database
- [ ] Delete address → address removed from list
- [ ] All operations use addressService (not direct Supabase calls in component)

### Database Verification Queries

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

-- Verify triggers exist
SELECT trigger_name, event_object_table FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table IN ('cart_items', 'wishlist_items', 'addresses');

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

### Automated Testing Strategy

#### Unit Tests
- Test `cartService.addToCart` with mocked Supabase client
- Test `wishlistService.addToWishlist` with mocked Supabase client
- Test `addressService.createAddress` with mocked Supabase client
- Test retry logic with simulated network failures
- Test error handling with specific error codes

#### Integration Tests
- Test cart add item end-to-end with real Supabase instance
- Test wishlist add item end-to-end with real Supabase instance
- Test address insert end-to-end with real Supabase instance
- Test RLS policies with authenticated and unauthenticated users
- Test migration from localStorage to database on login

#### Property-Based Tests
- Generate random cart items and verify all succeed
- Generate random wishlist items and verify all succeed
- Generate random addresses and verify all succeed
- Verify preservation property: non-buggy operations unchanged
