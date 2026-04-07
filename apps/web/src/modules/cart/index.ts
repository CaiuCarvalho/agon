/**
 * Cart and Wishlist Module
 * 
 * This module provides cart and wishlist persistence functionality
 * with support for authenticated users (Supabase) and guest users (localStorage).
 * 
 * Features:
 * - Dual persistence strategy (database + localStorage)
 * - Optimistic UI updates with rollback
 * - Automatic migration on login
 * - Multi-device synchronization via Supabase Realtime
 * - Conflict resolution (Last-Write-Wins)
 * - Retry strategy for network errors
 */

// Export types
export type {
  CartItem,
  WishlistItem,
  CartItemInput,
  WishlistItemInput,
  CartItemIdentifier,
  CartSummary,
  CartItemRow,
  WishlistItemRow,
  LocalStorageCart,
  LocalStorageWishlist,
  OptimisticState,
  MigrationResult,
  MigrationStatus,
  CartRealtimeEvent,
  ClientMetadata,
  Product,
} from './types';

// Export schemas
export {
  cartItemSchema,
  wishlistItemSchema,
  cartItemUpdateSchema,
  localStorageCartSchema,
  localStorageWishlistSchema,
  type CartItemUpdate,
  type LocalStorageCartData,
  type LocalStorageWishlistData,
} from './schemas';

// Export contracts (single source of truth)
export * from './contracts';

// Export hooks
export { useMigrationStatus, useCart, useCartMutations } from './hooks';
