# Cart and Wishlist Persistence Module

This module provides cart and wishlist persistence functionality with support for authenticated users (Supabase) and guest users (localStorage).

## Features

- **Dual Persistence Strategy**: Database for authenticated users, localStorage for guests
- **Optimistic UI Updates**: Immediate feedback with rollback on failure (< 100ms)
- **Automatic Migration**: Seamless transfer from localStorage to database on login
- **Multi-Device Sync**: Supabase Realtime for cross-device synchronization
- **Conflict Resolution**: Last-Write-Wins strategy based on timestamps
- **Idempotent Operations**: Safe retry and migration without data duplication
- **Security First**: RLS policies enforce user isolation
- **Graceful Degradation**: Fallback strategies for network failures

## Module Structure

```
cart/
├── types.ts          # TypeScript interfaces and types
├── contracts.ts      # Zod schemas (single source of truth)
├── schemas.ts        # Re-exports for backward compatibility
├── index.ts          # Public API exports
├── services/         # Business logic and data access (to be implemented)
├── hooks/            # React hooks for UI integration (to be implemented)
└── README.md         # This file
```

## Data Models

### CartItem
Represents an item in the shopping cart with product details and snapshot data.

```typescript
interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;        // 1-99
  size: string;            // 1-10 chars
  priceSnapshot: number;   // Price at time of add-to-cart
  productNameSnapshot: string;
  createdAt: string;
  updatedAt: string;
  product?: Product;       // Joined data
}
```

### WishlistItem
Represents a favorited product in the user's wishlist.

```typescript
interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product?: Product;
}
```

### LocalStorageCart
Structure for guest user cart data stored in browser localStorage.

```typescript
interface LocalStorageCart {
  items: Array<{
    productId: string;
    quantity: number;
    size: string;
  }>;
  version: number;  // For future schema migrations
}
```

### LocalStorageWishlist
Structure for guest user wishlist data stored in browser localStorage.

```typescript
interface LocalStorageWishlist {
  items: Array<{
    productId: string;
  }>;
  version: number;
}
```

## Validation Schemas

All input validation uses Zod schemas defined in `contracts.ts`:

### cartItemSchema
Validates cart item input with constraints:
- `productId`: Must be valid UUID
- `quantity`: Integer between 1 and 99
- `size`: String between 1 and 10 characters

### wishlistItemSchema
Validates wishlist item input:
- `productId`: Must be valid UUID

### cartItemUpdateSchema
Validates partial cart item updates (quantity or size).

### localStorageCartSchema
Validates cart data structure in localStorage.

### localStorageWishlistSchema
Validates wishlist data structure in localStorage.

## Usage

### Importing Types

```typescript
import type { CartItem, WishlistItem, CartItemInput } from '@/modules/cart';
```

### Importing Schemas

```typescript
import { cartItemSchema, wishlistItemSchema } from '@/modules/cart';

// Validate input
const validated = cartItemSchema.parse(input);
```

### Type Inference

```typescript
import { cartItemSchema } from '@/modules/cart';
import type { z } from 'zod';

type CartItemInput = z.infer<typeof cartItemSchema>;
```

## Database Schema

### cart_items Table
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

### wishlist_items Table
```sql
CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_wishlist_item UNIQUE (user_id, product_id)
);
```

## Constraints and Limits

- **Cart Quantity**: 1-99 items per cart item
- **Cart Size**: 1-10 characters
- **Wishlist Limit**: 20 items per user (enforced by database trigger)
- **Unique Constraint**: One cart item per (user_id, product_id, size)
- **Unique Constraint**: One wishlist item per (user_id, product_id)

## Error Messages

All validation errors use Portuguese messages for user-facing display:

- "Product ID inválido"
- "Quantidade mínima é 1"
- "Quantidade máxima é 99"
- "Tamanho é obrigatório"
- "Tamanho deve ter no máximo 10 caracteres"
- "Limite de 20 itens na wishlist atingido"

## Next Steps

The following components need to be implemented:

1. **Services Layer** (Task 3.2-3.5):
   - `cartService.ts`: CRUD operations for cart items
   - `wishlistService.ts`: CRUD operations for wishlist items
   - `localStorageService.ts`: localStorage management
   - `migrationService.ts`: Migration logic on login

2. **Hooks Layer** (Task 5.1-5.5):
   - `useCart.ts`: Fetch cart data and Realtime subscription
   - `useCartMutations.ts`: Add/update/remove with optimistic updates
   - `useWishlist.ts`: Fetch wishlist data and Realtime subscription
   - `useWishlistMutations.ts`: Add/remove with optimistic updates
   - `useMigrationStatus.ts`: Track migration state

3. **UI Integration** (Task 7.1-7.5):
   - Update ProductCard component
   - Implement Cart page
   - Implement Wishlist page
   - Integrate migration on login
   - Add error handling and rollback UI

## References

- Design Document: `.kiro/specs/cart-wishlist-persistence/design.md`
- Requirements: `.kiro/specs/cart-wishlist-persistence/requirements.md`
- Tasks: `.kiro/specs/cart-wishlist-persistence/tasks.md`
