/**
 * useWishlist Hook
 * 
 * Manages wishlist data fetching, caching, and real-time synchronization.
 * 
 * Key features:
 * - Fetches wishlist from database (authenticated) or localStorage (guest)
 * - Subscribes to Supabase Realtime for cross-device sync
 * - Provides isInWishlist helper for quick lookups
 * - Simpler than cart (no debouncing needed)
 * 
 * @module useWishlist
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { wishlistService } from '../services/wishlistService';
import { localStorageService } from '../../cart/services/localStorageService';
import type { WishlistItem } from '../types';

/**
 * Transform database row (snake_case) to WishlistItem (camelCase)
 * This is needed for Realtime events which return raw database rows
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

export function useWishlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch wishlist items
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      if (user) {
        // Authenticated: fetch from database
        return await wishlistService.getWishlistItems(user.id);
      } else {
        // Guest: fetch from localStorage
        const localWishlist = localStorageService.getWishlist();
        // Return items in WishlistItem format (without product details for now)
        return localWishlist.items.map(item => ({
          id: `local-${item.productId}`,
          userId: '',
          productId: item.productId,
          createdAt: new Date().toISOString(),
        })) as WishlistItem[];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Subscribe to Realtime updates (authenticated users only)
  useEffect(() => {
    if (!user) return;
    
    const supabase = createClient();
    
    // Use consistent channel name (no timestamp) to avoid duplicate channels
    const channelName = `wishlist:${user.id}`;
    
    // Remove any existing channel with the same name before creating a new one
    // Note: Supabase adds "realtime:" prefix, so we need to check if topic includes our channel name
    supabase.getChannels().forEach(ch => {
      if (ch.topic.includes(channelName)) {
        ch.unsubscribe();
        supabase.removeChannel(ch);
      }
    });
    
    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wishlist_items',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Wishlist realtime event:', payload);
          
          // Use setQueryData to apply deltas
          // This prevents refetch loops and provides instant updates
          queryClient.setQueryData(['wishlist', user.id], (old: WishlistItem[] = []) => {
            if (payload.eventType === 'INSERT') {
              // Add new item
              return [...old, transformWishlistItemRow(payload.new)];
            } else if (payload.eventType === 'UPDATE') {
              // Update existing item
              return old.map(item =>
                item.id === payload.new.id ? transformWishlistItemRow(payload.new) : item
              );
            } else if (payload.eventType === 'DELETE') {
              // Remove item
              return old.filter(item => item.id !== payload.old.id);
            }
            return old;
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Wishlist] Realtime subscription established');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.log('[Wishlist] Realtime subscription error:', status);
        }
      });
    
    return () => {
      // Properly unsubscribe and remove channel
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
  
  /**
   * Helper function to check if a product is in the wishlist
   * Provides O(n) lookup - acceptable for 20-item limit
   */
  const isInWishlist = (productId: string): boolean => {
    return items.some(item => item.productId === productId);
  };
  
  return {
    items,
    isInWishlist,
    isLoading,
    error,
  };
}
