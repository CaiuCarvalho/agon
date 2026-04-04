'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createProduct,
  updateProduct,
  softDeleteProduct,
  restoreProduct,
} from '../services/productService';
import type { Product, ProductFormValues, PaginatedProducts } from '../types';

/**
 * React Query Mutation Hooks for Product CRUD Operations
 * 
 * Features:
 * - Optimistic UI updates for immediate feedback
 * - Automatic rollback on error within 100ms
 * - Mandatory query invalidation for cross-page consistency
 * - Toast notifications (success: green, error: red)
 * - Type-safe mutations
 * 
 * CRITICAL REQUIREMENTS:
 * - ALL mutations MUST invalidate affected queries to enforce cross-page consistency
 * - Optimistic updates MUST rollback to exact previous state on failure within 100ms
 * - After ANY mutation: ALL affected queries MUST be invalidated
 * - UI MUST never rely permanently on optimistic state
 * - Data MUST always converge to database state
 * - Cross-page consistency MUST be enforced (Listing, Detail, Admin panel)
 * 
 * Validates Requirements: 4.9, 4.10, 4.11, 5.5-5.10, 6.1-6.10, 17.1-17.8
 */

export function useProductMutations() {
  const queryClient = useQueryClient();

  /**
   * Create Product Mutation
   * 
   * Optimistic Update Strategy:
   * 1. Cancel outgoing refetches to prevent race conditions
   * 2. Snapshot previous state for rollback
   * 3. Add temporary product to list with temp ID
   * 4. On success: invalidate queries to fetch real data
   * 5. On error: rollback to previous state within 100ms
   * 
   * Validates Requirements: 4.9, 4.10, 4.11, 17.1, 17.2, 17.7
   */
  const createProductMutation = useMutation({
    mutationFn: createProduct,
    
    onMutate: async (newProduct: ProductFormValues) => {
      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['products'] });
      
      // Snapshot previous value for rollback
      const previousProducts = queryClient.getQueryData(['products']);
      
      // Optimistically update: add temp product to list
      queryClient.setQueryData(['products'], (old: PaginatedProducts | undefined) => {
        if (!old) return old;
        
        const tempProduct: Product = {
          ...newProduct,
          id: `temp-${Date.now()}`,
          rating: 0,
          reviews: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        };
        
        return {
          ...old,
          products: [tempProduct, ...old.products],
          total: old.total + 1,
        };
      });
      
      return { previousProducts };
    },
    
    onError: (error: Error, _newProduct, context) => {
      // Rollback on error: restore exact previous state
      if (context?.previousProducts) {
        queryClient.setQueryData(['products'], context.previousProducts);
      }
      
      toast.error('Erro ao criar produto');
      console.error('[Products][Create]', error);
    },
    
    onSuccess: () => {
      toast.success('Produto criado com sucesso');
    },
    
    onSettled: () => {
      // CRITICAL: Invalidate queries to enforce cross-page consistency
      // This ensures all views (listing, detail, admin) converge to database state
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  /**
   * Update Product Mutation
   * 
   * Optimistic Update Strategy:
   * 1. Cancel outgoing refetches to prevent race conditions
   * 2. Snapshot previous state for both list and single product cache
   * 3. Update product in list and single product cache
   * 4. On success: invalidate both ['products'] and ['products', id] queries
   * 5. On error: rollback both caches to previous state within 100ms
   * 
   * Validates Requirements: 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 17.3, 17.4, 17.7
   */
  const updateProductMutation = useMutation({
    mutationFn: ({ id, values, currentUpdatedAt }: { 
      id: string; 
      values: Partial<ProductFormValues>;
      currentUpdatedAt?: string;
    }) => updateProduct(id, values, currentUpdatedAt),
    
    onMutate: async ({ id, values }) => {
      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['products'] });
      await queryClient.cancelQueries({ queryKey: ['products', id] });
      
      // Snapshot previous values for rollback
      const previousProducts = queryClient.getQueryData(['products']);
      const previousProduct = queryClient.getQueryData(['products', id]);
      
      // Optimistically update list
      queryClient.setQueryData(['products'], (old: PaginatedProducts | undefined) => {
        if (!old) return old;
        
        return {
          ...old,
          products: old.products.map((p: Product) =>
            p.id === id 
              ? { ...p, ...values, updatedAt: new Date().toISOString() } 
              : p
          ),
        };
      });
      
      // Optimistically update single product cache
      queryClient.setQueryData(['products', id], (old: Product | null | undefined) => {
        if (!old) return old;
        return { ...old, ...values, updatedAt: new Date().toISOString() };
      });
      
      return { previousProducts, previousProduct };
    },
    
    onError: (error: Error, { id }, context) => {
      // Rollback on error: restore exact previous state for both caches
      if (context?.previousProducts) {
        queryClient.setQueryData(['products'], context.previousProducts);
      }
      if (context?.previousProduct) {
        queryClient.setQueryData(['products', id], context.previousProduct);
      }
      
      toast.error('Erro ao atualizar produto');
      console.error('[Products][Update]', error);
    },
    
    onSuccess: () => {
      toast.success('Produto atualizado com sucesso');
    },
    
    onSettled: (_data, _error, { id }) => {
      // CRITICAL: Invalidate both list and single product queries
      // This ensures cross-page consistency (listing, detail, admin)
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', id] });
    },
  });

  /**
   * Soft Delete Product Mutation
   * 
   * Optimistic Update Strategy:
   * 1. Cancel outgoing refetches to prevent race conditions
   * 2. Snapshot previous state for rollback
   * 3. Remove product from list immediately
   * 4. On success: invalidate queries to ensure consistency
   * 5. On error: rollback to previous state within 100ms
   * 
   * Validates Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 17.5, 17.6, 17.7
   */
  const softDeleteProductMutation = useMutation({
    mutationFn: softDeleteProduct,
    
    onMutate: async (id: string) => {
      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['products'] });
      
      // Snapshot previous value for rollback
      const previousProducts = queryClient.getQueryData(['products']);
      
      // Optimistically remove from list
      queryClient.setQueryData(['products'], (old: PaginatedProducts | undefined) => {
        if (!old) return old;
        
        return {
          ...old,
          products: old.products.filter((p: Product) => p.id !== id),
          total: old.total - 1,
        };
      });
      
      return { previousProducts };
    },
    
    onError: (error: Error, _id, context) => {
      // Rollback on error: restore exact previous state
      if (context?.previousProducts) {
        queryClient.setQueryData(['products'], context.previousProducts);
      }
      
      toast.error('Erro ao deletar produto');
      console.error('[Products][SoftDelete]', error);
    },
    
    onSuccess: () => {
      toast.success('Produto deletado com sucesso');
    },
    
    onSettled: () => {
      // CRITICAL: Invalidate queries to enforce cross-page consistency
      // This ensures deleted products disappear from all views
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  /**
   * Restore Product Mutation
   * 
   * No optimistic update for restore (simpler flow)
   * Invalidates queries on success to show restored product
   * 
   * Validates Requirements: 6.9, 6.10
   */
  const restoreProductMutation = useMutation({
    mutationFn: restoreProduct,
    
    onSuccess: () => {
      toast.success('Produto restaurado com sucesso');
      // CRITICAL: Invalidate queries to show restored product
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    
    onError: (error: Error) => {
      toast.error('Erro ao restaurar produto');
      console.error('[Products][Restore]', error);
    },
  });

  return {
    createProduct: createProductMutation,
    updateProduct: updateProductMutation,
    softDeleteProduct: softDeleteProductMutation,
    restoreProduct: restoreProductMutation,
  };
}
