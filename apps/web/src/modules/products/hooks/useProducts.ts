'use client';

import { useQuery } from '@tanstack/react-query';
import { getProducts, getProductById } from '../services/productService';
import type { ProductFilters, PaginatedProducts, Product } from '../types';

/**
 * React Query hook for fetching paginated products with filters
 * 
 * Features:
 * - Automatic caching with 5-minute staleTime (configured globally in QueryProvider)
 * - Automatic refetching on filter changes
 * - Loading and error states
 * - Type-safe filters
 * 
 * @param filters - Product filters (search, category, price range, rating, sort, pagination)
 * @returns React Query result with products data, loading state, and error
 * 
 * Validates Requirements: 8.1-8.12, 9.1-9.10, 10.1-10.8
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useProducts({
 *   search: 'jersey',
 *   categoryId: 'uuid',
 *   minPrice: 50,
 *   maxPrice: 200,
 *   sortBy: 'price_asc',
 *   page: 1,
 *   limit: 20
 * });
 * ```
 */
export function useProducts(filters: ProductFilters = {}) {
  return useQuery<PaginatedProducts, Error>({
    queryKey: ['products', filters],
    queryFn: () => getProducts(filters),
    // Retry configuration for resilience
    retry: 2, // Retry up to 2 times on error
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff (1s, 2s, max 30s)
    // Cache configuration
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer, reduces refetches
    // Keep previous data during refetch (better UX for pagination)
    keepPreviousData: true,
  });
}

/**
 * React Query hook for fetching a single product by ID
 * 
 * Features:
 * - Automatic caching with 5-minute staleTime (configured globally in QueryProvider)
 * - Only fetches when id is provided (enabled: !!id)
 * - Returns null for non-existent or soft-deleted products
 * - Loading and error states
 * 
 * @param id - Product UUID (optional)
 * @returns React Query result with product data, loading state, and error
 * 
 * Validates Requirements: 8.1, 8.2, 11.1-11.12
 * 
 * @example
 * ```tsx
 * const { data: product, isLoading, error } = useProduct(productId);
 * 
 * if (isLoading) return <Skeleton />;
 * if (!product) return <NotFound />;
 * return <ProductDetail product={product} />;
 * ```
 */
export function useProduct(id?: string) {
  return useQuery<Product | null, Error>({
    queryKey: ['products', id],
    queryFn: () => getProductById(id!),
    enabled: !!id,
  });
}
