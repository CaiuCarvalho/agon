// Cart and Wishlist Persistence Types
// This file contains TypeScript interfaces for the cart and wishlist persistence feature

/**
 * Cart item entity (camelCase for TypeScript)
 * Represents an item in the shopping cart with product details and snapshot data
 */
export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  size: string;
  priceSnapshot: number; // Price at time of add-to-cart
  productNameSnapshot: string; // Name at time of add-to-cart
  createdAt: string;
  updatedAt: string;
  product?: Product; // Joined data (current product info)
}

/**
 * Wishlist item entity (camelCase for TypeScript)
 * Represents a favorited product in the user's wishlist
 */
export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product?: Product; // Joined data
}

/**
 * Cart item form values (for add/update operations)
 * Used when adding items to cart or updating existing items
 */
export interface CartItemInput {
  productId: string;
  quantity: number;
  size: string;
}

/**
 * Cart item identifier (composite key)
 * Used to uniquely identify cart items by product and size
 */
export interface CartItemIdentifier {
  productId: string;
  size: string;
}

/**
 * Wishlist item input
 * Used when adding items to wishlist
 */
export interface WishlistItemInput {
  productId: string;
}

/**
 * Cart summary with totals and price change detection
 * Provides aggregated cart information for display
 */
export interface CartSummary {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  priceChanges: Array<{
    itemId: string;
    productName: string;
    oldPrice: number;
    newPrice: number;
  }>;
}

/**
 * Cart item database row (snake_case from Supabase)
 * Represents the raw database structure
 */
export interface CartItemRow {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  size: string;
  price_snapshot: number;
  product_name_snapshot: string;
  created_at: string;
  updated_at: string;
}

/**
 * Wishlist item database row (snake_case from Supabase)
 * Represents the raw database structure
 */
export interface WishlistItemRow {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

/**
 * localStorage cart structure
 * Used for guest users before authentication
 */
export interface LocalStorageCart {
  items: Array<{
    productId: string;
    quantity: number;
    size: string;
  }>;
  version: number; // For future schema migrations
}

/**
 * localStorage wishlist structure
 * Used for guest users before authentication
 */
export interface LocalStorageWishlist {
  items: Array<{
    productId: string;
  }>;
  version: number; // For future schema migrations
}

/**
 * Optimistic update state
 * Tracks pending operations and snapshots for rollback
 */
export interface OptimisticState<T> {
  snapshot: T;
  pendingOperations: Array<{
    id: string;
    type: 'add' | 'update' | 'remove';
    timestamp: number;
  }>;
}

/**
 * Migration result
 * Contains counts and errors from migration process
 */
export interface MigrationResult {
  cartItemsMigrated: number;
  wishlistItemsMigrated: number;
  errors: string[];
}

/**
 * Migration status
 * Tracks the current state of the migration process
 */
export type MigrationStatus = 'pending' | 'in_progress' | 'complete' | 'error';

/**
 * Realtime event payload
 * Structure of Supabase Realtime events for cart synchronization
 */
export interface CartRealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  operation: 'ADD' | 'UPDATE_QUANTITY' | 'REMOVE';
  delta?: number;
  new: CartItemRow;
  old?: CartItemRow;
  client_id: string;
  timestamp: string;
}

/**
 * Client session metadata
 * Identifies the current client session for event filtering
 */
export interface ClientMetadata {
  client_id: string;
  session_start: string;
}

/**
 * Product entity (minimal definition for cart/wishlist)
 * Full definition should be imported from products module
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl: string;
  stock: number;
  features: string[];
  rating: number;
  reviews: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
