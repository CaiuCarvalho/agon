/**
 * Migration Service for Cart and Wishlist
 * 
 * Manages the migration of cart and wishlist data from localStorage to Supabase
 * database when a guest user logs in. Uses transactional RPC functions to ensure
 * atomic migrations with automatic rollback on failure.
 * 
 * Key features:
 * - Transactional migrations using Supabase RPC functions
 * - Idempotent operations (safe to run multiple times)
 * - Automatic rollback on failure
 * - localStorage preservation on error for retry
 * - Clear localStorage only on successful migration
 * 
 * @module migrationService
 */

import { createClient } from '@/lib/supabase/client';
import { localStorageService } from './localStorageService';
import type { MigrationResult } from '../types';

export const migrationService = {
  /**
   * Migrate both cart and wishlist data from localStorage to database
   * 
   * This is the main entry point for migration, called after successful login.
   * It orchestrates both cart and wishlist migrations in parallel and aggregates
   * the results.
   * 
   * @param userId - The authenticated user's ID
   * @returns MigrationResult with counts and any errors encountered
   */
  async migrateUserData(userId: string): Promise<MigrationResult> {
    const result: MigrationResult = {
      cartItemsMigrated: 0,
      wishlistItemsMigrated: 0,
      errors: [],
    };
    
    try {
      // Migrate cart using transactional RPC
      const cartResult = await this.migrateCart(userId);
      result.cartItemsMigrated = cartResult.itemsMigrated;
      result.errors.push(...cartResult.errors);
      
      // Migrate wishlist using transactional RPC
      const wishlistResult = await this.migrateWishlist(userId);
      result.wishlistItemsMigrated = wishlistResult.itemsMigrated;
      result.errors.push(...wishlistResult.errors);
      
      return result;
    } catch (error: any) {
      console.error('Migration failed:', error);
      result.errors.push(error.message || 'Unknown migration error');
      return result;
    }
  },
  
  /**
   * Migrate cart items from localStorage to database using transactional RPC
   * 
   * Uses the migrate_cart_items RPC function which ensures atomic migration:
   * - All items are migrated in a single transaction
   * - If any item fails, the entire transaction rolls back
   * - Quantities are summed for duplicate items (same product_id and size)
   * - Price snapshots are captured from current product data
   * 
   * localStorage is cleared ONLY on successful migration to prevent data loss.
   * On failure, localStorage is preserved so the user can retry.
   * 
   * @param userId - The authenticated user's ID
   * @returns Object with migrated count and any errors
   */
  async migrateCart(userId: string): Promise<{ itemsMigrated: number; errors: string[] }> {
    const supabase = createClient();
    const localCart = localStorageService.getCart();
    const errors: string[] = [];
    
    // Skip if no items to migrate
    if (localCart.items.length === 0) {
      return { itemsMigrated: 0, errors: [] };
    }
    
    try {
      // Use transactional RPC function for atomic migration
      const { data, error } = await supabase.rpc('migrate_cart_items', {
        p_user_id: userId,
        p_items: localCart.items,
      });
      
      if (error) {
        console.error('Cart migration RPC failed:', error);
        errors.push(`Cart migration failed: ${error.message}`);
        return { itemsMigrated: 0, errors };
      }
      
      // Check if RPC returned success
      if (!data || !data.success) {
        const errorMsg = data?.error || 'Unknown error';
        errors.push(`Cart migration failed: ${errorMsg}`);
        return { itemsMigrated: 0, errors };
      }
      
      // Clear localStorage only if migration succeeded
      localStorageService.clearCart();
      
      return { itemsMigrated: data.migrated_count || 0, errors };
    } catch (error: any) {
      console.error('Cart migration exception:', error);
      errors.push(`Cart migration exception: ${error.message}`);
      return { itemsMigrated: 0, errors };
    }
  },
  
  /**
   * Migrate wishlist items from localStorage to database using transactional RPC
   * 
   * Uses the migrate_wishlist_items RPC function which ensures atomic migration:
   * - All items are migrated in a single transaction
   * - If any item fails, the entire transaction rolls back
   * - Enforces 20-item limit (items beyond limit are skipped)
   * - Duplicate items (same product_id) are handled idempotently
   * 
   * If some items are skipped due to the 20-item limit, a warning is added to
   * the errors array (but migration is still considered successful).
   * 
   * localStorage is cleared ONLY on successful migration to prevent data loss.
   * On failure, localStorage is preserved so the user can retry.
   * 
   * @param userId - The authenticated user's ID
   * @returns Object with migrated count and any errors/warnings
   */
  async migrateWishlist(userId: string): Promise<{ itemsMigrated: number; errors: string[] }> {
    const supabase = createClient();
    const localWishlist = localStorageService.getWishlist();
    const errors: string[] = [];
    
    // Skip if no items to migrate
    if (localWishlist.items.length === 0) {
      return { itemsMigrated: 0, errors: [] };
    }
    
    try {
      // Use transactional RPC function for atomic migration
      const { data, error } = await supabase.rpc('migrate_wishlist_items', {
        p_user_id: userId,
        p_items: localWishlist.items,
      });
      
      if (error) {
        console.error('Wishlist migration RPC failed:', error);
        errors.push(`Wishlist migration failed: ${error.message}`);
        return { itemsMigrated: 0, errors };
      }
      
      // Check if RPC returned success
      if (!data || !data.success) {
        const errorMsg = data?.error || 'Unknown error';
        errors.push(`Wishlist migration failed: ${errorMsg}`);
        return { itemsMigrated: 0, errors };
      }
      
      // Warn if some items couldn't be migrated due to 20-item limit
      if (data.skipped_count && data.skipped_count > 0) {
        errors.push(
          `${data.skipped_count} itens não puderam ser migrados devido ao limite de 20 itens`
        );
      }
      
      // Clear localStorage only if migration succeeded
      localStorageService.clearWishlist();
      
      return { itemsMigrated: data.migrated_count || 0, errors };
    } catch (error: any) {
      console.error('Wishlist migration exception:', error);
      errors.push(`Wishlist migration exception: ${error.message}`);
      return { itemsMigrated: 0, errors };
    }
  },
};
