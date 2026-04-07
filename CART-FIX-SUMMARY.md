# Cart Update Bug - Fix Summary

## Problem
User reported that items are being added to Supabase successfully and toast messages appear, but the cart UI doesn't update to show the new items.

## Root Cause
The cart query was blocked by a **migration gate** that prevents React Query from fetching cart data until a migration process completes. If the migration failed or got stuck in 'in_progress' state, the cart would never update because the query was disabled.

## Solution Applied

### 1. Fixed Migration Error Handling
**File**: `apps/web/src/modules/cart/hooks/useMigrationStatus.ts`

- Changed migration to ALWAYS mark as complete, even on error
- This ensures the UI is never permanently blocked
- Users can still use the cart even if migration fails

### 2. Updated Cart Query Gate
**File**: `apps/web/src/modules/cart/hooks/useCart.ts`

- Changed query `enabled` condition from `migrationStatus === 'complete'` to `migrationStatus === 'complete' || migrationStatus === 'error'`
- This allows cart queries to run even if migration errors

### 3. Added Debug Logging
Added console logs to track:
- Migration lifecycle
- Cart query execution  
- Cache invalidation
- Item fetching

## Quick User Fix

If the user is still experiencing the issue, they can run this in the browser console:

```javascript
localStorage.setItem('agon_migrated', 'true')
location.reload()
```

This manually marks migration as complete and unblocks the cart.

## Files Modified

1. `apps/web/src/modules/cart/hooks/useMigrationStatus.ts` - Fixed error handling
2. `apps/web/src/modules/cart/hooks/useCart.ts` - Updated query gate and added logging
3. `apps/web/src/modules/cart/hooks/useCartMutations.ts` - Added debug logging
4. `CART-DEBUG-GUIDE.md` - Created comprehensive debug guide

## Testing

The user should:
1. Refresh the page to load the new code
2. Open DevTools Console (F12)
3. Try adding items to cart
4. Check console logs for migration and cart query status
5. Verify cart page updates immediately

## Expected Behavior After Fix

1. Migration completes successfully (or fails gracefully)
2. Cart queries are enabled regardless of migration outcome
3. Adding items triggers cache invalidation
4. Cart UI updates immediately without page refresh
5. Console shows clear debug logs for troubleshooting

## Fallback

If the issue persists, the debug guide includes:
- Manual localStorage reset commands
- SQL queries to verify database state
- Step-by-step troubleshooting checklist
- Common issues and solutions
