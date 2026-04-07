/**
 * Cart and Wishlist Module Schemas
 * 
 * This file re-exports schemas from contracts.ts for backward compatibility.
 * All schema definitions are now in contracts.ts as the single source of truth.
 */

export {
  cartItemSchema,
  wishlistItemSchema,
  cartItemUpdateSchema,
  localStorageCartSchema,
  localStorageWishlistSchema,
  type CartItemInput,
  type WishlistItemInput,
  type CartItemUpdate,
  type LocalStorageCartData,
  type LocalStorageWishlistData,
} from './contracts';
