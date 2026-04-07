# Realtime Subscription Fix Bugfix Design

## Overview

This bugfix addresses the Supabase Realtime subscription error in the cart and wishlist hooks. The bug prevents cross-device synchronization due to incorrect channel lifecycle management and missing client initialization. The fix ensures proper method chaining (`.channel()` → `.on()` → `.subscribe()`) and creates the Supabase client instance before attempting subscriptions.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when Realtime subscriptions are set up with incorrect method chaining or missing client initialization
- **Property (P)**: The desired behavior when subscriptions are set up - channels should be created, callbacks registered, and subscriptions established without errors
- **Preservation**: Existing localStorage fallback, migration gates, event filtering, and cleanup logic that must remain unchanged
- **useCart**: The hook in `apps/web/src/modules/cart/hooks/useCart.ts` that manages cart data and Realtime sync
- **useWishlist**: The hook in `apps/web/src/modules/wishlist/hooks/useWishlist.ts` that manages wishlist data and Realtime sync
- **Channel Lifecycle**: The required sequence of Supabase Realtime operations: create channel → register callbacks → subscribe
- **CLIENT_ID**: A unique session identifier used to filter out self-generated events and prevent update loops

## Bug Details

### Bug Condition

The bug manifests when either the useCart or useWishlist hook attempts to set up a Supabase Realtime subscription. The hooks either fail to properly chain the subscription methods or reference an undefined client variable, preventing real-time synchronization from working.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { hook: 'useCart' | 'useWishlist', user: User | null, migrationStatus?: string }
  OUTPUT: boolean
  
  RETURN (input.hook == 'useCart' AND input.user != null AND input.migrationStatus == 'complete' AND supabaseClientUndefined)
         OR (input.hook == 'useWishlist' AND input.user != null AND supabaseClientUndefined)
         OR (callbacksAddedAfterSubscribe)
END FUNCTION
```

### Examples

- **useCart with authenticated user**: Hook attempts to create channel using undefined `supabase` variable, causing runtime error "Cannot read property 'channel' of undefined"
- **useWishlist with authenticated user**: Hook calls `.subscribe()` before properly chaining `.on()`, resulting in error "cannot add `postgres_changes` callbacks after `subscribe()`"
- **Cross-device sync attempt**: User adds item to cart on Device A, but Device B does not receive the update because the subscription was never established
- **Edge case - guest user**: No subscription is attempted (correct behavior, not affected by bug)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Guest users (not authenticated) must continue to use localStorage without attempting Realtime subscriptions
- Cart hook must continue to respect the migration gate (only query when migrationStatus === 'complete')
- Event filtering by CLIENT_ID must continue to prevent self-generated event loops
- useEffect cleanup must continue to properly unsubscribe and remove channels
- Cart calculations (totalItems, subtotal) must continue to work correctly
- Wishlist isInWishlist helper must continue to provide O(n) lookups

**Scope:**
All inputs that do NOT involve authenticated users setting up Realtime subscriptions should be completely unaffected by this fix. This includes:
- Guest user cart/wishlist operations using localStorage
- Cart queries blocked by migration gate
- Event filtering logic
- Cleanup and unsubscribe operations
- Data transformation and calculation logic

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Missing Client Initialization in useCart**: The hook references `supabase` variable without calling `createClient()` first
   - Line references `supabase.channel()` but `supabase` is never defined
   - Should call `const supabase = createClient()` before creating channel

2. **Incorrect Method Chaining in useWishlist**: The hook may be calling `.subscribe()` before completing the `.on()` chain
   - Supabase Realtime requires: `.channel()` → `.on()` → `.subscribe()`
   - Calling `.subscribe()` finalizes the channel and prevents adding more callbacks

3. **Channel Lifecycle Misunderstanding**: Both hooks may not properly understand the required sequence of operations
   - Must create channel first
   - Must register all callbacks via `.on()` before subscribing
   - Cannot add callbacks after `.subscribe()` is called

4. **Async Timing Issues**: The subscription setup may be racing with component lifecycle
   - useEffect may be running at the wrong time
   - Dependencies may be causing re-subscriptions

## Correctness Properties

Property 1: Bug Condition - Realtime Subscriptions Establish Successfully

_For any_ authenticated user where the bug condition holds (attempting to set up a Realtime subscription in useCart or useWishlist), the fixed hooks SHALL create a Supabase client instance, properly chain `.channel()` → `.on()` → `.subscribe()` methods, and establish an active subscription without errors, enabling cross-device synchronization.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Non-Subscription Behavior

_For any_ input where the bug condition does NOT hold (guest users, blocked migrations, event filtering, cleanup operations), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality for localStorage fallback, migration gates, event filtering, cleanup, and data calculations.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `apps/web/src/modules/cart/hooks/useCart.ts`

**Function**: `useCart` (useEffect for Realtime subscription)

**Specific Changes**:
1. **Add Client Initialization**: Create Supabase client instance at the start of the useEffect
   - Add `const supabase = createClient();` before attempting to create channel
   - Import `createClient` from `@/lib/supabase/client`

2. **Verify Method Chaining**: Ensure `.channel()` → `.on()` → `.subscribe()` sequence is correct
   - Confirm `.on()` is called before `.subscribe()`
   - Confirm all callbacks are registered before subscription

3. **Add Import Statement**: Import createClient at the top of the file
   - Add to existing imports: `import { createClient } from '@/lib/supabase/client';`

**File**: `apps/web/src/modules/wishlist/hooks/useWishlist.ts`

**Function**: `useWishlist` (useEffect for Realtime subscription)

**Specific Changes**:
1. **Fix Method Chaining**: Ensure proper sequence of Realtime operations
   - Verify `.channel()` is called first
   - Verify `.on()` is called to register callbacks
   - Verify `.subscribe()` is called last to finalize subscription

2. **Verify Client Creation**: Confirm `createClient()` is called correctly
   - Already has `const supabase = createClient();` - verify it's in the right place
   - Ensure it's called before channel creation

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate authenticated users triggering the Realtime subscription setup in both hooks. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **useCart Subscription Test**: Simulate authenticated user with complete migration status (will fail on unfixed code with "Cannot read property 'channel' of undefined")
2. **useWishlist Subscription Test**: Simulate authenticated user triggering wishlist subscription (will fail on unfixed code with "cannot add `postgres_changes` callbacks after `subscribe()`")
3. **Cross-Device Sync Test**: Simulate cart/wishlist update on one device and check if other device receives update (will fail on unfixed code - no sync occurs)
4. **Guest User Test**: Simulate guest user accessing cart/wishlist (should pass on unfixed code - uses localStorage)

**Expected Counterexamples**:
- Runtime error in useCart: "Cannot read property 'channel' of undefined"
- Runtime error in useWishlist: "cannot add `postgres_changes` callbacks after `subscribe()`"
- No Realtime events received when data changes on another device
- Possible causes: missing client initialization, incorrect method chaining, lifecycle mismanagement

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := setupRealtimeSubscription_fixed(input)
  ASSERT subscriptionEstablished(result)
  ASSERT noErrors(result)
  ASSERT crossDeviceSyncWorks(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT setupRealtimeSubscription_original(input) = setupRealtimeSubscription_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for guest users, migration gates, event filtering, and cleanup, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Guest User Preservation**: Observe that guest users use localStorage on unfixed code, then write test to verify this continues after fix
2. **Migration Gate Preservation**: Observe that cart queries are blocked until migration completes on unfixed code, then write test to verify this continues after fix
3. **Event Filtering Preservation**: Observe that CLIENT_ID filtering prevents loops on unfixed code, then write test to verify this continues after fix
4. **Cleanup Preservation**: Observe that channels are properly unsubscribed and removed on unfixed code, then write test to verify this continues after fix

### Unit Tests

- Test that useCart creates Supabase client before attempting subscription
- Test that useWishlist properly chains `.channel()` → `.on()` → `.subscribe()`
- Test that guest users do not attempt Realtime subscriptions
- Test that migration gate blocks cart queries until complete
- Test that CLIENT_ID filtering prevents event loops
- Test that cleanup properly unsubscribes and removes channels

### Property-Based Tests

- Generate random user authentication states and verify subscriptions only occur for authenticated users
- Generate random migration statuses and verify cart respects the migration gate
- Generate random Realtime events and verify CLIENT_ID filtering works correctly
- Test that all non-subscription code paths produce identical results before and after fix

### Integration Tests

- Test full cart flow with authenticated user: add item on Device A, verify Device B receives update
- Test full wishlist flow with authenticated user: add item on Device A, verify Device B receives update
- Test switching between guest and authenticated states
- Test that visual feedback (cart count, wishlist indicators) updates in real-time across devices
