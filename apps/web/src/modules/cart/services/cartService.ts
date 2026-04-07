/**
 * Cart Service
 * 
 * Handles all cart-related database operations for authenticated users.
 * Implements atomic operations, retry logic, and data transformation.
 * 
 * Key features:
 * - Atomic add-to-cart using RPC function
 * - Retry logic for network errors
 * - Snake_case to camelCase transformation
 * - Price change detection
 * - User ownership validation
 */

import { createClient } from '@/lib/supabase/client';
import { cartItemSchema, cartItemUpdateSchema } from '../contracts';
import type { CartItem, CartItemInput, CartSummary } from '../types';
import { isRetryableError, getUserFriendlyMessage } from '@/lib/utils/databaseErrors';

/**
 * Transform database row (snake_case) to CartItem (camelCase)
 */
function transformCartItemRow(row: any): CartItem {
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    quantity: row.quantity,
    size: row.size,
    priceSnapshot: parseFloat(row.price_snapshot),
    productNameSnapshot: row.product_name_snapshot,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    product: row.product ? {
      id: row.product.id,
      name: row.product.name,
      description: row.product.description,
      price: parseFloat(row.product.price),
      categoryId: row.product.category_id,
      imageUrl: row.product.image_url,
      stock: row.product.stock,
      features: row.product.features || [],
      rating: parseFloat(row.product.rating || 0),
      reviews: row.product.reviews || 0,
      createdAt: row.product.created_at,
      updatedAt: row.product.updated_at,
      deletedAt: row.product.deleted_at,
    } : undefined,
  };
}

/**
 * Retry wrapper for network errors using PostgreSQL error codes
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  delayMs: number = 500
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if error is retryable using centralized utility
      if (attempt < maxRetries && isRetryableError(error)) {
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, delayMs * Math.pow(2, attempt))
        );
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError!;
}

/**
 * Cart Service
 * All operations for authenticated users
 */
export const cartService = {
  /**
   * Get all cart items for authenticated user with product details
   * Uses JOIN to fetch current product information
   */
  async getCartItems(userId: string): Promise<CartItem[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(transformCartItemRow);
  },
  
  /**
   * Add item to cart using atomic RPC function
   * Prevents race conditions by using database-level upsert
   * If item exists (same product_id and size), increments quantity
   */
  async addToCart(userId: string, input: CartItemInput): Promise<CartItem> {
    // Validate input BEFORE creating client
    const validated = cartItemSchema.parse(input);
    
    const supabase = createClient();
    
    try {
      // Use atomic RPC function to prevent race conditions
      const { data, error } = await withRetry(async () => {
        return await supabase.rpc('add_to_cart_atomic', {
          p_user_id: userId,
          p_product_id: validated.productId,
          p_quantity: validated.quantity,
          p_size: validated.size,
        });
      });
      
      if (error) {
        // Handle specific error types
        if (error.code === '42883') {
          // RPC function doesn't exist - use fallback
          console.error('RPC add_to_cart_atomic failed, using fallback', error);
          throw new Error('RPC_NOT_FOUND');
        }
        throw new Error(getUserFriendlyMessage(error));
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido ao adicionar ao carrinho');
      }
      
      return transformCartItemRow(data.item);
    } catch (error: any) {
      // Fallback: try direct insert if RPC doesn't exist
      if (error.message === 'RPC_NOT_FOUND') {
        console.warn('Using fallback insert for cart item');
        try {
          // Fetch product details for snapshot fields
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('price, name')
            .eq('id', validated.productId)
            .is('deleted_at', null) // Exclude soft-deleted products
            .single();

          if (productError || !product) {
            throw new Error('Produto não encontrado ou indisponível');
          }

          const { data, error: insertError } = await supabase
            .from('cart_items')
            .insert({
              user_id: userId,
              product_id: validated.productId,
              quantity: validated.quantity,
              size: validated.size,
              price_snapshot: product.price,
              product_name_snapshot: product.name,
            })
            .select('*, product:products(*)')
            .single();
          
          if (insertError) {
            console.error('Fallback insert failed', insertError);
            throw new Error(getUserFriendlyMessage(insertError));
          }
          return transformCartItemRow(data);
        } catch (fallbackError: any) {
          throw fallbackError;
        }
      }
      
      throw error;
    }
  },
  
  /**
   * Update cart item quantity or size
   * Validates user ownership before updating
   */
  async updateCartItem(
    userId: string,
    itemId: string,
    updates: { quantity?: number; size?: string }
  ): Promise<CartItem> {
    // Validate updates BEFORE creating client
    const validated = cartItemUpdateSchema.parse(updates);
    
    const supabase = createClient();
    
    const { data, error } = await withRetry(async () => {
      return await supabase
        .from('cart_items')
        .update(validated)
        .eq('id', itemId)
        .eq('user_id', userId) // Ensure user owns this item
        .select('*, product:products(*)')
        .single();
    });
    
    if (error) throw error;
    
    return transformCartItemRow(data);
  },
  
  /**
   * Remove item from cart
   * Validates user ownership before deleting
   */
  async removeFromCart(userId: string, itemId: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await withRetry(async () => {
      return await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId); // Ensure user owns this item
    });
    
    if (error) throw error;
  },
  
  /**
   * Clear entire cart for user
   */
  async clearCart(userId: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await withRetry(async () => {
      return await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);
    });
    
    if (error) throw error;
  },
  
  /**
   * Get cart summary with totals and price change detection
   * Compares current product prices with price snapshots
   */
  async getCartSummary(userId: string): Promise<CartSummary> {
    const items = await this.getCartItems(userId);
    
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + (item.product?.price || 0) * item.quantity,
      0
    );
    
    // Detect price changes by comparing snapshot with current price
    const priceChanges = items
      .filter(item => item.product && item.product.price !== item.priceSnapshot)
      .map(item => ({
        itemId: item.id,
        productName: item.productNameSnapshot,
        oldPrice: item.priceSnapshot,
        newPrice: item.product!.price,
      }));
    
    return { items, totalItems, subtotal, priceChanges };
  },
  
  /**
   * Expose retry helper for external use
   */
  withRetry,
};
