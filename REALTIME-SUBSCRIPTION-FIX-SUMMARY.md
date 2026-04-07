# Realtime Subscription Fix - Implementation Summary

## Problem

The application was experiencing a runtime error when trying to set up Supabase Realtime subscriptions:

```
Error: cannot add `postgres_changes` callbacks for realtime:wishlist:{user-id} after `subscribe()`
```

This error prevented cross-device synchronization from working for both cart and wishlist features.

## Root Cause

The issue had two underlying causes:

1. **Non-Singleton Supabase Client**: The `createClient()` function was creating a new Supabase client instance on every call, leading to multiple client instances across the application.

2. **Channel Name Conflicts**: When React components re-rendered (due to dependency changes in useEffect), new channels were being created with the same name before old channels were properly cleaned up, causing Supabase to throw errors about duplicate channel registrations.

## Solution

### 1. Made Supabase Client a Singleton

**File**: `apps/web/src/lib/supabase/client.ts`

Changed the client creation to use a singleton pattern:

```typescript
let client: SupabaseClient | null = null

export function createClient() {
  // Return existing client if already created
  if (client) {
    return client
  }
  
  // Create new client only if it doesn't exist
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  return client
}
```

**Benefits**:
- Single Supabase client instance across the entire application
- Prevents channel conflicts from multiple client instances
- Improves performance by reusing the same WebSocket connection

### 2. Added Channel Cleanup Before Creation

**Files**: 
- `apps/web/src/modules/wishlist/hooks/useWishlist.ts`
- `apps/web/src/modules/cart/hooks/useCart.ts`

Added logic to remove any existing channel with the same name before creating a new one:

```typescript
// Remove any existing channel with the same name before creating a new one
const existingChannel = supabase.getChannels().find(ch => ch.topic === channelName);
if (existingChannel) {
  supabase.removeChannel(existingChannel);
}
```

**Benefits**:
- Prevents duplicate channel registrations
- Ensures clean state when useEffect re-runs
- Avoids the "cannot add callbacks after subscribe" error

### 3. Removed Timestamp from Cart Channel Name

**File**: `apps/web/src/modules/cart/hooks/useCart.ts`

Changed from:
```typescript
const channelName = `cart:${user.id}:${Date.now()}`;
```

To:
```typescript
const channelName = `cart:${user.id}`;
```

**Benefits**:
- Consistent channel naming across re-renders
- Easier to identify and clean up existing channels
- Matches the pattern used in wishlist hook

## Testing

### Bug Condition Tests (4 tests - All Pass ✅)

1. **Property 1.1**: useCart creates Supabase client before attempting subscription
2. **Property 1.2**: useWishlist properly chains `.channel()` → `.on()` → `.subscribe()` methods
3. **Property 1.3**: For all authenticated users, hooks establish Realtime subscriptions without errors
4. **Property 1.4**: Authenticated users receive Realtime events for cross-device sync

### Preservation Tests (15 tests - All Pass ✅)

Verified that the fix doesn't break existing functionality:

1. **Guest Users** (3 tests): localStorage behavior preserved
2. **Migration Gate** (2 tests): Cart query blocking preserved
3. **Event Filtering** (2 tests): CLIENT_ID loop prevention preserved
4. **Cleanup** (3 tests): Channel unsubscribe preserved
5. **Cart Calculations** (3 tests): totalItems and subtotal preserved
6. **Wishlist Helper** (2 tests): isInWishlist lookup preserved

## Impact

### Before Fix
- ❌ Realtime subscriptions failed with runtime error
- ❌ Cross-device sync didn't work
- ❌ Multiple Supabase client instances created
- ❌ Channel conflicts on component re-renders

### After Fix
- ✅ Realtime subscriptions establish successfully
- ✅ Cross-device sync works for cart and wishlist
- ✅ Single Supabase client instance (singleton)
- ✅ Clean channel management with no conflicts
- ✅ All existing functionality preserved (no regressions)

## Files Modified

1. `apps/web/src/lib/supabase/client.ts` - Made client a singleton
2. `apps/web/src/modules/wishlist/hooks/useWishlist.ts` - Added channel cleanup
3. `apps/web/src/modules/cart/hooks/useCart.ts` - Added channel cleanup, removed timestamp from channel name

## Files Created

1. `apps/web/src/__tests__/realtime-subscription-fix.bugcondition.test.ts` - Bug condition exploration tests
2. `apps/web/src/__tests__/realtime-subscription-fix.preservation.test.ts` - Preservation property tests
3. `apps/web/src/__tests__/PRESERVATION-TEST-OBSERVATIONS.md` - Detailed test observations
4. `.kiro/specs/realtime-subscription-fix/bugfix.md` - Bugfix requirements
5. `.kiro/specs/realtime-subscription-fix/design.md` - Bugfix design
6. `.kiro/specs/realtime-subscription-fix/tasks.md` - Implementation tasks

## Next Steps

The fix is complete and tested. Users can now:

1. Add items to cart/wishlist on Device A
2. See the changes sync in real-time to Device B
3. Experience seamless cross-device synchronization

No further action required. The Realtime subscription error is resolved.
