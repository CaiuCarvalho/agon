# Cart Update Issue - Debug & Fix Guide

## Issue
Items are being added to Supabase successfully, toast message appears, but cart UI doesn't update.

## Root Cause Identified
The cart query is blocked by a **migration gate** that prevents queries until migration completes. If migration fails or gets stuck, the cart will never update.

## Fixes Applied ✅

### 1. Migration Error Handling
**File**: `apps/web/src/modules/cart/hooks/useMigrationStatus.ts`

Changed migration error handling to ALWAYS mark migration as complete, even on error:

```typescript
// Now: Even on total failure, mark as complete to unblock UI
localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
setStatus('complete');
```

**Why**: Users should be able to use the cart even if migration fails. The worst case is they lose localStorage items, but they can still add new items.

### 2. Cart Query Gate
**File**: `apps/web/src/modules/cart/hooks/useCart.ts`

Updated the query gate to allow queries when migration errors:

```typescript
enabled: migrationStatus === 'complete' || migrationStatus === 'error'
```

### 3. Added Debug Logging
Added console logs to track:
- Migration status changes
- Cart query execution
- Cache invalidation
- Item fetching

## Quick Fix (Try This First!)

1. Open browser DevTools Console (F12)
2. Run this command:
```javascript
localStorage.setItem('agon_migrated', 'true')
```
3. Refresh the page (F5)
4. Try adding items to cart again

This manually marks migration as complete and unblocks the cart queries.

## Testing Steps

### Step 1: Check Migration Status
Open DevTools Console and look for these logs:
```
[Migration] Starting migration for user: ...
[Migration] Migration result: ...
[Migration] Success, marking as complete
```

### Step 2: Check Cart Query
After adding an item, look for:
```
[Cart] Item added successfully, invalidating cache
[Cart] Invalidating queries for user: ...
[Cart] Fetching cart items for user: ...
[Cart] Fetched items from database: X
```

### Step 3: Verify Database
Check if items are actually in Supabase:
```sql
SELECT * FROM cart_items WHERE user_id = 'YOUR_USER_ID';
```

### Step 4: Test Add to Cart Flow
1. Go to `/products`
2. Click on any product
3. Click "Adicionar ao Carrinho"
4. Check console for logs
5. Navigate to `/cart` - items should appear immediately

## Common Issues & Solutions

### Issue 1: Migration Stuck in 'in_progress'
**Symptom**: Console shows migration starting but never completing
**Solution**: 
```javascript
// Force complete
localStorage.setItem('agon_migrated', 'true')
location.reload()
```

### Issue 2: RPC Functions Missing
**Symptom**: Console shows "RPC add_to_cart_atomic failed"
**Solution**: Check if migrations were applied in Supabase:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('add_to_cart_atomic', 'migrate_cart_items');
```

### Issue 3: Cart Query Not Running
**Symptom**: No "[Cart] Fetching cart items" logs after adding item
**Solution**: Check migration status:
```javascript
console.log(localStorage.getItem('agon_migrated'))
// Should be 'true'
```

### Issue 4: Items in DB But Not in UI
**Symptom**: SQL query shows items, but cart page is empty
**Solution**: Check React Query cache:
```javascript
// In console, after adding item
console.log('Cache should invalidate and refetch')
```

## Manual Reset (Nuclear Option)

If nothing works, reset everything:

```javascript
// Clear all cart-related data
localStorage.removeItem('agon_migrated')
localStorage.removeItem('agon_cart')
localStorage.removeItem('agon_wishlist')

// Reload
location.reload()
```

Then try adding items again.

## Verification Checklist

- [ ] Migration status is 'complete' (check localStorage)
- [ ] Console shows "[Cart] Fetching cart items" after adding
- [ ] Items exist in Supabase `cart_items` table
- [ ] Toast message appears when adding items
- [ ] Cart page shows items immediately (no refresh needed)
- [ ] Cart count in navbar updates

## Next Steps

1. **Refresh the page** to apply the fixes
2. **Open DevTools Console** to see debug logs
3. **Try adding an item** to cart
4. **Check the logs** to see where it's failing
5. **If still not working**, run the Quick Fix command above

## Expected Console Output (Success)

```
[Migration] Already migrated, marking as complete
[Cart] Fetching cart items for user: abc-123
[Cart] Fetched items from database: 0
[Cart] Item added successfully, invalidating cache
[Cart] Invalidating queries for user: abc-123
[Cart] Fetching cart items for user: abc-123
[Cart] Fetched items from database: 1
```
