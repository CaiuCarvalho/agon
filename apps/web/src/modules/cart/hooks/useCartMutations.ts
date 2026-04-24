"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { cartService } from '../services/cartService';
import { localStorageService } from '../services/localStorageService';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { CartItem, CartItemInput, CartItemIdentifier } from '../types';
import { trackAddToCart, trackRemoveFromCart } from '@/lib/analytics';

/**
 * useCartMutations Hook
 * 
 * Provides mutation functions for cart operations with optimistic updates and rollback.
 * 
 * Key features:
 * - Optimistic UI updates (< 100ms response time)
 * - Automatic rollback on server failure
 * - Debounced quantity updates (500ms delay)
 * - Retry logic for network errors
 * - Support for both authenticated and guest users
 * - Composite key consistency (productId, size)
 * 
 * @returns Mutation functions and loading states
 * 
 * @example
 * ```typescript
 * const { addToCart, updateQuantityDebounced, removeFromCart, isAdding } = useCartMutations();
 * 
 * // Add item to cart
 * addToCart({ productId: '123', quantity: 2, size: 'M' });
 * 
 * // Update quantity with debounce
 * updateQuantityDebounced({ productId: '123', size: 'M' }, 5);
 * 
 * // Remove item
 * removeFromCart('item-id');
 * ```
 */
export function useCartMutations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const [pendingRemovals, setPendingRemovals] = useState<Set<string>>(new Set());

  /**
   * Add to cart mutation
   * Implements optimistic update with rollback on failure
   */
  const addToCartMutation = useMutation({
    mutationFn: async (input: CartItemInput) => {
      if (user) {
        return await cartService.withRetry(() =>
          cartService.addToCart(user.id, input)
        );
      } else {
        localStorageService.addToCart(input.productId, input.quantity, input.size);
        return null;
      }
    },
    onMutate: async (input) => {
      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['cart', user?.id] });

      // Snapshot previous value for rollback
      const previousCart = queryClient.getQueryData<CartItem[]>(['cart', user?.id]);

      // Optimistically update UI immediately
      queryClient.setQueryData<CartItem[]>(['cart', user?.id], (old = []) => {
        const existing = old.find(
          item => item.productId === input.productId && item.size === input.size
        );

        if (existing) {
          // Increment quantity (capped at 99)
          return old.map(item =>
            item.productId === input.productId && item.size === input.size
              ? { ...item, quantity: Math.min(item.quantity + input.quantity, 99) }
              : item
          );
        } else {
          // Add new item with temporary ID
          return [...old, {
            ...input,
            id: 'temp-' + Date.now(),
            userId: user?.id || '',
            priceSnapshot: 0,
            productNameSnapshot: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as CartItem];
        }
      });

      return { previousCart };
    },
    onError: (error, input, context) => {
      // Rollback to snapshot on error
      if (context?.previousCart) {
        queryClient.setQueryData(['cart', user?.id], context.previousCart);
      }
      toast.error('Erro ao adicionar ao carrinho');
      console.error('Add to cart error:', error);
    },
    onSuccess: (_data, input) => {
      toast.success('Produto adicionado ao carrinho');
      const cached = queryClient.getQueryData<CartItem[]>(['cart', user?.id]);
      const added = cached?.find(i => i.productId === input.productId && i.size === input.size);
      if (added) trackAddToCart({ item_id: added.productId, item_name: added.productNameSnapshot, price: added.priceSnapshot, quantity: input.quantity });
    },
    onSettled: () => {
      // Refetch to ensure consistency with server
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
    },
  });

  /**
   * Update cart item mutation
   * Used internally by debounced quantity updates
   */
  const updateCartItemMutation = useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: string; updates: { quantity?: number; size?: string } }) => {
      if (user) {
        return await cartService.withRetry(() =>
          cartService.updateCartItem(user.id, itemId, updates)
        );
      } else {
        // For localStorage, we need to find the item by composite key
        // This is handled by the debounced update function
        return null;
      }
    },
    onMutate: async ({ itemId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['cart', user?.id] });

      const previousCart = queryClient.getQueryData<CartItem[]>(['cart', user?.id]);

      queryClient.setQueryData<CartItem[]>(['cart', user?.id], (old = []) => {
        return old.map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        );
      });

      return { previousCart };
    },
    onError: (error, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart', user?.id], context.previousCart);
      }
      toast.error('Erro ao atualizar carrinho');
      console.error('Update cart error:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
    },
  });

  /**
   * Debounced quantity update
   * Delays server update by 500ms to batch rapid changes
   * Cancels pending debounce if Realtime event arrives for same item
   */
  const updateQuantityDebounced = useCallback(
    (identifier: CartItemIdentifier, quantity: number) => {
      const key = `quantity-${identifier.productId}-${identifier.size}`;

      // Clear existing timer for this item
      if (debounceTimers.current.has(key)) {
        clearTimeout(debounceTimers.current.get(key)!);
      }

      // Optimistic update immediately (< 100ms)
      queryClient.setQueryData<CartItem[]>(['cart', user?.id], (old = []) => {
        return old.map(item =>
          item.productId === identifier.productId && item.size === identifier.size
            ? { ...item, quantity }
            : item
        );
      });

      // Set new debounce timer (500ms delay)
      const timer = setTimeout(() => {
        // Find item by composite key
        const items = queryClient.getQueryData<CartItem[]>(['cart', user?.id]);
        const item = items?.find(
          i => i.productId === identifier.productId && i.size === identifier.size
        );

        if (item) {
          if (user) {
            // Authenticated: update database
            updateCartItemMutation.mutate({
              itemId: item.id,
              updates: { quantity }
            });
          } else {
            // Guest: update localStorage
            localStorageService.updateCartItem(identifier.productId, identifier.size, { quantity });
          }
        }

        debounceTimers.current.delete(key);
      }, 500);

      debounceTimers.current.set(key, timer);
    },
    [user, queryClient, updateCartItemMutation]
  );

  /**
   * Cancel pending debounce for an item
   * Called from useCart when Realtime event arrives
   */
  const cancelDebounce = useCallback((identifier: CartItemIdentifier) => {
    const key = `quantity-${identifier.productId}-${identifier.size}`;
    if (debounceTimers.current.has(key)) {
      clearTimeout(debounceTimers.current.get(key)!);
      debounceTimers.current.delete(key);
    }
  }, []);

  /**
   * Remove from cart mutation
   * Implements optimistic update with rollback
   */
  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (user) {
        return await cartService.withRetry(() =>
          cartService.removeFromCart(user.id, itemId)
        );
      } else {
        // For localStorage, support both guest ID formats:
        // 1) "productId:size"
        // 2) "local:productId:size"
        const normalizedId = itemId.startsWith('local:') ? itemId.slice('local:'.length) : itemId;
        const [productId, size] = normalizedId.split(':');

        if (!productId || !size) {
          throw new Error('Invalid local cart item identifier');
        }

        localStorageService.removeFromCart(productId, size);
        return null;
      }
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ['cart', user?.id] });
      setPendingRemovals((prev) => new Set(prev).add(itemId));

      const previousCart = queryClient.getQueryData<CartItem[]>(['cart', user?.id]);

      const removing = previousCart?.find(i => i.id === itemId);
      if (removing) trackRemoveFromCart({ item_id: removing.productId, item_name: removing.productNameSnapshot, price: removing.priceSnapshot, quantity: removing.quantity });

      queryClient.setQueryData<CartItem[]>(['cart', user?.id], (old = []) => {
        return old.filter(item => item.id !== itemId);
      });

      return { previousCart };
    },
    onError: (error, itemId, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart', user?.id], context.previousCart);
      }
      toast.error('Erro ao remover do carrinho');
      console.error('Remove from cart error:', error);
    },
    onSuccess: () => {
      toast.success('Produto removido do carrinho');
    },
    onSettled: () => {
      const itemId = removeFromCartMutation.variables;
      if (itemId) {
        setPendingRemovals((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
    },
  });

  /**
   * Clear cart mutation
   * Removes all items from cart
   */
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      if (user) {
        return await cartService.clearCart(user.id);
      } else {
        localStorageService.clearCart();
        return null;
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['cart', user?.id] });

      const previousCart = queryClient.getQueryData<CartItem[]>(['cart', user?.id]);

      queryClient.setQueryData<CartItem[]>(['cart', user?.id], []);

      return { previousCart };
    },
    onError: (error, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart', user?.id], context.previousCart);
      }
      toast.error('Erro ao limpar carrinho');
      console.error('Clear cart error:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
    },
  });

  return {
    addToCart: addToCartMutation.mutate,
    updateCartItem: updateCartItemMutation.mutate,
    updateQuantityDebounced,
    cancelDebounce,
    removeFromCart: removeFromCartMutation.mutate,
    isRemovingItem: (itemId: string) => pendingRemovals.has(itemId),
    clearCart: clearCartMutation.mutate,
    isAdding: addToCartMutation.isPending,
    isUpdating: updateCartItemMutation.isPending,
    isRemoving: removeFromCartMutation.isPending,
    isClearing: clearCartMutation.isPending,
  };
}
