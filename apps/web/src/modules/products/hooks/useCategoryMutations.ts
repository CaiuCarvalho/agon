'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from '../services/categoryService';
import type { Category, CategoryFormValues } from '../types';

/**
 * React Query Mutation Hooks for Category CRUD Operations
 * 
 * Features:
 * - Mandatory query invalidation for cross-page consistency
 * - Toast notifications (success: green, error: red)
 * - Type-safe mutations
 * - Special error handling for categories with products
 * 
 * CRITICAL REQUIREMENTS:
 * - ALL mutations MUST invalidate ['categories'] queries to enforce cross-page consistency
 * - After ANY mutation: ALL affected queries MUST be invalidated
 * - Cross-page consistency MUST be enforced (Admin panel, Product forms, Filters)
 * - Category deletion MUST show specific error message when category has products
 * 
 * Validates Requirements: 13.1, 13.2, 13.3, 13.5, 13.6, 13.7
 */

export function useCategoryMutations() {
  const queryClient = useQueryClient();

  /**
   * Create Category Mutation
   * 
   * Strategy:
   * 1. Call service to create category
   * 2. On success: invalidate ['categories'] queries and show success toast
   * 3. On error: show error toast
   * 
   * Validates Requirements: 13.1, 13.2, 13.5
   */
  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    
    onSuccess: () => {
      toast.success('Categoria criada com sucesso');
      // CRITICAL: Invalidate queries to enforce cross-page consistency
      // This ensures new category appears in all dropdowns and lists
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    
    onError: (error: Error) => {
      toast.error('Erro ao criar categoria');
      console.error('[Categories][Create]', error);
    },
  });

  /**
   * Update Category Mutation
   * 
   * Strategy:
   * 1. Call service to update category
   * 2. On success: invalidate ['categories'] queries and show success toast
   * 3. On error: show error toast
   * 
   * Validates Requirements: 13.3, 13.5
   */
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<CategoryFormValues> }) =>
      updateCategory(id, values),
    
    onSuccess: () => {
      toast.success('Categoria atualizada com sucesso');
      // CRITICAL: Invalidate queries to enforce cross-page consistency
      // This ensures updated category reflects in all views
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    
    onError: (error: Error) => {
      toast.error('Erro ao atualizar categoria');
      console.error('[Categories][Update]', error);
    },
  });

  /**
   * Delete Category Mutation
   * 
   * Strategy:
   * 1. Call service to delete category (service checks for products)
   * 2. On success: invalidate ['categories'] queries and show success toast
   * 3. On error: show specific error message if category has products
   * 
   * Special Error Handling:
   * - If error message contains "product(s)", show specific message about products
   * - Otherwise, show generic error message
   * 
   * Validates Requirements: 13.6, 13.7
   */
  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    
    onSuccess: () => {
      toast.success('Categoria deletada com sucesso');
      // CRITICAL: Invalidate queries to enforce cross-page consistency
      // This ensures deleted category disappears from all views
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    
    onError: (error: Error) => {
      // Special error handling for categories with products
      if (error.message.includes('product')) {
        toast.error('Não é possível deletar categoria com produtos associados');
      } else {
        toast.error('Erro ao deletar categoria');
      }
      console.error('[Categories][Delete]', error);
    },
  });

  return {
    createCategory: createCategoryMutation,
    updateCategory: updateCategoryMutation,
    deleteCategory: deleteCategoryMutation,
  };
}
