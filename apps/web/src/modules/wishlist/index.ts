/**
 * Wishlist Module
 * 
 * This module provides wishlist persistence functionality
 * with support for authenticated users (Supabase) and guest users (localStorage).
 * 
 * Features:
 * - 20-item limit enforcement
 * - Dual persistence strategy (database + localStorage)
 * - Optimistic UI updates with rollback
 * - Automatic migration on login
 * - Multi-device synchronization via Supabase Realtime
 */

// Export types
export type {
  WishlistItem,
  WishlistItemInput,
  WishlistItemRow,
  LocalStorageWishlist,
} from './types';

// Export schemas
export {
  wishlistItemSchema,
  localStorageWishlistSchema,
  type LocalStorageWishlistData,
} from './contracts';

// Export services
export { wishlistService } from './services/wishlistService';

// Export hooks
export { useWishlist } from './hooks/useWishlist';
export { useWishlistMutations } from './hooks/useWishlistMutations';
