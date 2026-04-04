'use client';

import { useQuery } from '@tanstack/react-query';
import { getCategories, getCategoryById, getCategoryProductCount } from '../services/categoryService';
import type { Category } from '../types';

/**
 * React Query hook for fetching all categories
 * 
 * Features:
 * - Automatic caching with 10-minute staleTime (categories change less frequently than products)
 * - Ordered by name alphabetically
 * - Loading and error states
 * 
 * @returns React Query result with categories array, loading state, and error
 * 
 * Validates Requirements: 13.8, 13.9
 * 
 * @example
 * ```tsx
 * const { data: categories, isLoading, error } = useCategories();
 * 
 * if (isLoading) return <Skeleton />;
 * return (
 *   <select>
 *     {categories?.map(cat => (
 *       <option key={cat.id} value={cat.id}>{cat.name}</option>
 *     ))}
 *   </select>
 * );
 * ```
 */
export function useCategories() {
  return useQuery<Category[], Error>({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes (categories change less frequently)
  });
}

/**
 * React Query hook for fetching a single category by ID
 * 
 * Features:
 * - Automatic caching with 10-minute staleTime
 * - Only fetches when id is provided (enabled: !!id)
 * - Returns null for non-existent categories
 * - Loading and error states
 * 
 * @param id - Category UUID (optional)
 * @returns React Query result with category data, loading state, and error
 * 
 * Validates Requirements: 13.8, 13.9
 * 
 * @example
 * ```tsx
 * const { data: category, isLoading, error } = useCategory(categoryId);
 * 
 * if (isLoading) return <Skeleton />;
 * if (!category) return <NotFound />;
 * return <CategoryDetail category={category} />;
 * ```
 */
export function useCategory(id?: string) {
  return useQuery<Category | null, Error>({
    queryKey: ['categories', id],
    queryFn: () => getCategoryById(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * React Query hook for fetching product count for a category
 * 
 * Features:
 * - Automatic caching with 10-minute staleTime
 * - Only fetches when id is provided (enabled: !!id)
 * - Counts only non-deleted products
 * - Loading and error states
 * 
 * @param id - Category UUID (optional)
 * @returns React Query result with product count, loading state, and error
 * 
 * Validates Requirements: 13.8, 13.9
 * 
 * @example
 * ```tsx
 * const { data: count, isLoading } = useCategoryProductCount(categoryId);
 * 
 * return (
 *   <div>
 *     {category.name} ({count ?? 0} products)
 *   </div>
 * );
 * ```
 */
export function useCategoryProductCount(id?: string) {
  return useQuery<number, Error>({
    queryKey: ['categories', id, 'product-count'],
    queryFn: () => getCategoryProductCount(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
