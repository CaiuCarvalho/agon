/**
 * Wishlist Module Contracts
 *
 * Defines wishlist-specific validation schemas and re-exports
 * shared schemas from the cart module.
 */

import { z } from 'zod';

export {
  wishlistItemSchema,
  localStorageWishlistSchema,
  type WishlistItemInput,
  type LocalStorageWishlistData,
} from '../cart/contracts';

/** Pagination/filter params for wishlist API queries */
export const wishlistQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
});

export type WishlistQueryParams = z.infer<typeof wishlistQuerySchema>;
