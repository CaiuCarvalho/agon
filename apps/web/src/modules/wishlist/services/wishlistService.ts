/**
 * Wishlist Service
 * 
 * Handles all wishlist-related database operations for authenticated users.
 * Implements 20-item limit enforcement, duplicate prevention, and data transformation.
 * 
 * Key features:
 * - 20-item limit enforced by database trigger
 * - Graceful handling of unique constraint violations
 * - Snake_case to camelCase transformation
 * - User ownership validation
 * - Retry logic for network resilience
 */

import { createClient } from '@/lib/supabase/client';
import { wishlistItemSchema } from '../contracts';
import type { WishlistItem, WishlistItemInput } from '../types';
import { cartService } from '@/modules/cart/services/cartService';
import { isRetryableError, getUserFriendlyMessage, DATABASE_ERROR_CODES } from '@/lib/utils/databaseErrors';

// Import retry utility from cart service for consistency
const { withRetry } = cartService;

/**
 * Transform database row (snake_case) to WishlistItem (camelCase)
 */
function transformWishlistItemRow(row: any): WishlistItem {
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    createdAt: row.created_at,
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
 * Wishlist Service
 * All operations for authenticated users
 */
export const wishlistService = {
  /**
   * Get all wishlist items for authenticated user with product details
   * Uses JOIN to fetch current product information
   */
  async getWishlistItems(userId: string): Promise<WishlistItem[]> {
    const supabase = createClient();
    
    const { data, error } = await withRetry(async () => {
      return await supabase
        .from('wishlist_items')
        .select('*, product:products(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    });
    
    if (error) throw error;
    
    return (data || []).map(transformWishlistItemRow);
  },
  
  /**
   * Add item to wishlist with 20-item limit enforcement
   * Handles unique constraint violation gracefully by returning existing item
   * The 20-item limit is enforced by a database trigger
   */
  async addToWishlist(userId: string, input: WishlistItemInput): Promise<WishlistItem> {
    // Validate input BEFORE creating client
    const validated = wishlistItemSchema.parse(input);
    
    const supabase = createClient();
    
    // Insert new item (limit enforced by database trigger)
    const { data, error } = await withRetry(async () => {
      return await supabase
        .from('wishlist_items')
        .insert({
          user_id: userId,
          product_id: validated.productId,
        })
        .select('*, product:products(*)')
        .single();
    });
    
    if (error) {
      // If unique constraint violation (23505), return existing item gracefully
      if (error.code === DATABASE_ERROR_CODES.UNIQUE_VIOLATION) {
        const { data: existing } = await withRetry(async () => {
          return await supabase
            .from('wishlist_items')
            .select('*, product:products(*)')
            .eq('user_id', userId)
            .eq('product_id', validated.productId)
            .single();
        });
        
        if (existing) {
          return transformWishlistItemRow(existing);
        }
      }
      
      // If limit exceeded (from trigger)
      if (error.message.includes('Limite') || error.message.includes('20 itens')) {
        throw new Error('Limite de 20 itens na wishlist atingido');
      }
      
      throw new Error(getUserFriendlyMessage(error));
    }
    
    return transformWishlistItemRow(data);
  },
  
  /**
   * Remove item from wishlist by item ID
   * Validates user ownership before deleting
   */
  async removeFromWishlist(userId: string, itemId: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await withRetry(async () => {
      return await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId); // Ensure user owns this item
    });
    
    if (error) throw error;
  },
  
  /**
   * Remove item from wishlist by product ID
   * Useful for toggle functionality where we don't have the item ID
   */
  async removeFromWishlistByProductId(userId: string, productId: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await withRetry(async () => {
      return await supabase
        .from('wishlist_items')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);
    });
    
    if (error) throw error;
  },
  
  /**
   * Check if product is in wishlist
   * Returns true if the product exists in user's wishlist
   */
  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const supabase = createClient();
    
    const { data, error } = await withRetry(async () => {
      return await supabase
        .from('wishlist_items')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();
    });
    
    // PGRST116 is "not found" error - not an actual error for this use case
    if (error && error.code !== 'PGRST116') throw error;
    
    return !!data;
  },
  
  /**
   * Clear entire wishlist for user
   */
  async clearWishlist(userId: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await withRetry(async () => {
      return await supabase
        .from('wishlist_items')
        .delete()
        .eq('user_id', userId);
    });
    
    if (error) throw error;
  },
};
