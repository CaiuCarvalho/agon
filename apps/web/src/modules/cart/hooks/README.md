# Cart Hooks

This directory contains React hooks for managing cart and wishlist data with Supabase Realtime synchronization.

## Hooks

### `useMigrationStatus`

Manages the migration status of cart and wishlist data from localStorage to Supabase database when a guest user logs in.

**Features:**
- Checks if migration has already been completed (localStorage flag)
- Runs migration automatically on first login
- Implements migration gate to prevent empty cart flash
- Returns migration status and errors

**Usage:**
```typescript
import { useMigrationStatus } from '@/modules/cart/hooks';

function MyComponent() {
  const { status, errors, isComplete, isInProgress, hasErrors } = useMigrationStatus();
  
  if (isInProgress) {
    return <div>Migrating your cart...</div>;
  }
  
  if (hasErrors) {
    return <div>Migration failed: {errors.join(', ')}</div>;
  }
  
  return <div>Ready!</div>;
}
```

### `useCart`

Manages cart data fetching, caching, and real-time synchronization.

**Features:**
- Fetches cart from database (authenticated) or localStorage (guest)
- Subscribes to Supabase Realtime for cross-device sync
- Implements migration gate to prevent empty cart flash
- Handles reconnection with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Provides polling fallback (30s interval) when Realtime fails
- Filters own events by client_id to prevent loops
- Uses setQueryData() instead of invalidateQueries to apply deltas
- Calculates cart summary (totalItems, subtotal)

**Usage:**
```typescript
import { useCart } from '@/modules/cart/hooks';

function CartPage() {
  const { items, totalItems, subtotal, isLoading, error, realtimeStatus } = useCart();
  
  if (isLoading) {
    return <div>Loading cart...</div>;
  }
  
  if (error) {
    return <div>Error loading cart: {error.message}</div>;
  }
  
  return (
    <div>
      <h1>Cart ({totalItems} items)</h1>
      <div>Subtotal: ${subtotal.toFixed(2)}</div>
      <div>Realtime: {realtimeStatus}</div>
      
      {items.map(item => (
        <div key={item.id}>
          {item.product?.name} - {item.quantity} x ${item.product?.price}
        </div>
      ))}
    </div>
  );
}
```

## Implementation Details

### Migration Gate

The migration gate prevents queries from running until migration is complete, avoiding the "empty cart flash" issue where the cart appears empty momentarily before migration completes.

```typescript
// Query is blocked until migration completes
const { data } = useQuery({
  queryKey: ['cart', user?.id],
  queryFn: fetchCart,
  enabled: migrationStatus === 'complete', // Migration gate
});
```

### Realtime Event Filtering

Events are filtered by client_id to prevent loops where local updates trigger Realtime events that trigger more updates:

```typescript
// Filter out events from this client
if (payload.new?.client_id === CLIENT_ID) {
  return;
}
```

### Delta-Based Updates

Instead of invalidating queries (which triggers refetch), we use setQueryData to apply deltas directly:

```typescript
queryClient.setQueryData(['cart', user.id], (old: CartItem[] = []) => {
  if (payload.eventType === 'INSERT') {
    return [...old, transformCartItemRow(payload.new)];
  } else if (payload.eventType === 'UPDATE') {
    return old.map(item =>
      item.id === payload.new.id ? transformCartItemRow(payload.new) : item
    );
  } else if (payload.eventType === 'DELETE') {
    return old.filter(item => item.id !== payload.old.id);
  }
  return old;
});
```

### Exponential Backoff Reconnection

When Realtime disconnects, we implement exponential backoff reconnection:

```typescript
const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
// Delays: 1s, 2s, 4s, 8s, 16s, 30s (max)
```

### Polling Fallback

When Realtime fails, we start polling as a fallback:

```typescript
pollingInterval.current = setInterval(() => {
  queryClient.invalidateQueries({ queryKey: ['cart', user.id] });
}, 30000); // Poll every 30s
```

## Testing

Unit tests for these hooks will be added in Phase 5 (Testing) of the implementation plan.

## Requirements Validated

This implementation validates the following requirements:

- **4.1-4.4**: Optimistic UI with loading states
- **5.1-5.4**: Automatic synchronization across devices
- **13.1-13.5**: Conflict resolution with Last-Write-Wins
- **18.1-18.5**: Database as source of truth
- **20.1-20.6**: Re-sync fallback for disconnections

## Next Steps

1. Implement `useCartMutations` hook (Task 5.3)
2. Implement `useWishlist` hook (Task 5.4)
3. Implement `useWishlistMutations` hook (Task 5.5)
4. Write unit tests (Task 5.6)
