"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { wishlistService } from '../services/wishlistService';
import { localStorageService } from '../../cart/services/localStorageService';
import { toast } from 'sonner';
import type { WishlistItem, WishlistItemInput } from '../types';

/**
 * useWishlistMutations Hook
 * 
 * Provides mutation functions for wishlist operations with optimistic updates and rollback.
 * 
 * Key features:
 * - Optimistic UI updates (< 100ms response time)
 * - Automatic rollback on server failure
 * - 20-item limit error handling with specific message
 * - Toggle helper (add if not present, remove if present)
 * - Support for both authenticated and guest users
 * 
 * @returns Mutation functions and loading states
 * 
 * @example
 * ```typescript
 * const { addToWishlist, removeFromWishlist, toggleWishlist, isAdding } = useWishlistMutations();
 * 
 * // Add item to wishlist
 * addToWishlist({ productId: '123' });
 * 
 * // Remove item
 * removeFromWishlist('item-id');
 * 
 * // Toggle (add or remove)
 * toggleWishlist('product-id');
 * ```
 */
export function useWishlistMutations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  /**
   * Add to wishlist mutation
   * Implements optimistic update with rollback on failure
   * Handles 20-item limit error with specific message
   */
  const addToWishlistMutation = useMutation({
    mutationFn: async (input: WishlistItemInput) => {
      if (user) {
        return await wishlistService.addToWishlist(user.id, input);
      } else {
        // Guest: add to localStorage
        try {
          localStorageService.addToWishlist(input.productId);
          return null;
        } catch (error) {
          // Re-throw to trigger onError
          throw error;
        }
      }
    },
    onMutate: async (input) => {
      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['wishlist', user?.id] });

      // Snapshot previous value for rollback
      const previousWishlist = queryClient.getQueryData<WishlistItem[]>(['wishlist', user?.id]);

      // Optimistically update UI immediately
      queryClient.setQueryData<WishlistItem[]>(['wishlist', user?.id], (old = []) => {
        // Check if already in wishlist
        const exists = old.some(item => item.productId === input.productId);
        if (exists) {
          return old; // Already exists, no change
        }

        // Add new item with temporary ID
        return [...old, {
          id: 'temp-' + Date.now(),
          userId: user?.id || '',
          productId: input.productId,
          createdAt: new Date().toISOString(),
        } as WishlistItem];
      });

      return { previousWishlist };
    },
    onError: (error: any, input, context) => {
      // Rollback to snapshot on error
      if (context?.previousWishlist) {
        queryClient.setQueryData(['wishlist', user?.id], context.previousWishlist);
      }

      // Handle 20-item limit error with specific message
      if (error?.message?.includes('Limite') || error?.message?.includes('20 itens')) {
        toast.error('Limite de 20 itens na wishlist atingido');
      } else {
        toast.error('Erro ao adicionar à wishlist');
      }
      
      console.error('Add to wishlist error:', error);
    },
    onSuccess: () => {
      toast.success('Produto adicionado à wishlist');
    },
    onSettled: () => {
      // Refetch to ensure consistency with server
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
    },
  });

  /**
   * Remove from wishlist mutation
   * Implements optimistic update with rollback
   */
  const removeFromWishlistMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (user) {
        return await wishlistService.removeFromWishlist(user.id, itemId);
      } else {
        // For localStorage, itemId is actually the productId
        localStorageService.removeFromWishlist(itemId);
        return null;
      }
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ['wishlist', user?.id] });

      const previousWishlist = queryClient.getQueryData<WishlistItem[]>(['wishlist', user?.id]);

      queryClient.setQueryData<WishlistItem[]>(['wishlist', user?.id], (old = []) => {
        return old.filter(item => item.id !== itemId);
      });

      return { previousWishlist };
    },
    onError: (error, itemId, context) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(['wishlist', user?.id], context.previousWishlist);
      }
      toast.error('Erro ao remover da wishlist');
      console.error('Remove from wishlist error:', error);
    },
    onSuccess: () => {
      toast.success('Produto removido da wishlist');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
    },
  });

  /**
   * Toggle wishlist helper
   * Adds if not present, removes if present
   * Useful for heart icon buttons
   */
  const toggleWishlist = (productId: string) => {
    const items = queryClient.getQueryData<WishlistItem[]>(['wishlist', user?.id]) || [];
    const existingItem = items.find(item => item.productId === productId);

    if (existingItem) {
      // Remove if exists
      removeFromWishlistMutation.mutate(existingItem.id);
    } else {
      // Add if not exists
      addToWishlistMutation.mutate({ productId });
    }
  };

  return {
    addToWishlist: addToWishlistMutation.mutate,
    removeFromWishlist: removeFromWishlistMutation.mutate,
    toggleWishlist,
    isAdding: addToWishlistMutation.isPending,
    isRemoving: removeFromWishlistMutation.isPending,
  };
}
