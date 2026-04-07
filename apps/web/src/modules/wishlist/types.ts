/**
 * Wishlist Module Types
 * 
 * Re-exports wishlist-related types from the cart module
 * for better organization and discoverability.
 */

export type {
  WishlistItem,
  WishlistItemInput,
  WishlistItemRow,
  LocalStorageWishlist,
} from '../cart/types';
