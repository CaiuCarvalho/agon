/**
 * Wishlist Module Contracts
 * 
 * Re-exports wishlist-related schemas from the cart module
 * for better organization and discoverability.
 */

export {
  wishlistItemSchema,
  localStorageWishlistSchema,
  type WishlistItemInput,
  type LocalStorageWishlistData,
} from '../cart/contracts';
