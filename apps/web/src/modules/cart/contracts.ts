/**
 * Cart and Wishlist Module Contracts
 * 
 * This file serves as the single source of truth for all data contracts
 * in the cart and wishlist module. It defines Zod schemas and types to ensure
 * consistency between frontend, services, and backend.
 * 
 * Following SDD principles: All data validation uses Zod schemas.
 */

import { z } from 'zod';

/**
 * Cart item validation schema
 * Validates cart item input with Portuguese error messages
 * Enforces quantity limits (1-99) and size constraints (1-10 chars)
 */
export const cartItemSchema = z.object({
  productId: z.string().uuid('Product ID inválido'),
  quantity: z.number()
    .int('Quantidade deve ser um número inteiro')
    .min(1, 'Quantidade mínima é 1')
    .max(99, 'Quantidade máxima é 99'),
  size: z.string()
    .min(1, 'Tamanho é obrigatório')
    .max(10, 'Tamanho deve ter no máximo 10 caracteres'),
});

/**
 * Wishlist item validation schema
 * Validates wishlist item input with Portuguese error messages
 */
export const wishlistItemSchema = z.object({
  productId: z.string().uuid('Product ID inválido'),
});

/**
 * Cart item update schema (partial)
 * Allows updating quantity or size independently
 */
export const cartItemUpdateSchema = z.object({
  quantity: z.number()
    .int('Quantidade deve ser um número inteiro')
    .min(1, 'Quantidade mínima é 1')
    .max(99, 'Quantidade máxima é 99')
    .optional(),
  size: z.string()
    .min(1, 'Tamanho é obrigatório')
    .max(10, 'Tamanho deve ter no máximo 10 caracteres')
    .optional(),
});

/**
 * localStorage cart schema
 * Validates cart data stored in browser localStorage
 * Includes version field for future schema migrations
 */
export const localStorageCartSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(99),
    size: z.string().min(1).max(10),
  })),
  version: z.number().int().default(1),
});

/**
 * localStorage wishlist schema
 * Validates wishlist data stored in browser localStorage
 * Includes version field for future schema migrations
 */
export const localStorageWishlistSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
  })),
  version: z.number().int().default(1),
});

// Export type inference helpers
export type CartItemInput = z.infer<typeof cartItemSchema>;
export type WishlistItemInput = z.infer<typeof wishlistItemSchema>;
export type CartItemUpdate = z.infer<typeof cartItemUpdateSchema>;
export type LocalStorageCartData = z.infer<typeof localStorageCartSchema>;
export type LocalStorageWishlistData = z.infer<typeof localStorageWishlistSchema>;

// Re-export domain types
export type {
  CartItem,
  WishlistItem,
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
