// useAdminProducts Hook
// Manages product state and CRUD operations

import { useState, useEffect } from 'react';
import type { Product } from '../types';
import type { ProductInput, StockUpdateInput } from '../schemas';

interface ProductListData {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export function useAdminProducts() {
  const [data, setData] = useState<ProductListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  
  const fetchProducts = async (pageNum: number = page) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/products?page=${pageNum}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch products');
      }
      
      const result = await response.json();
      setData(result);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const createProduct = async (input: ProductInput): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }
      
      await fetchProducts(page);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'An error occurred',
      };
    }
  };
  
  const updateProduct = async (id: string, input: ProductInput): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }
      
      await fetchProducts(page);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'An error occurred',
      };
    }
  };
  
  const toggleProduct = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/admin/products/${id}/toggle`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle product');
      }
      
      await fetchProducts(page);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'An error occurred',
      };
    }
  };
  
  const updateStock = async (id: string, input: StockUpdateInput): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/admin/products/${id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update stock');
      }
      
      await fetchProducts(page);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'An error occurred',
      };
    }
  };
  
  useEffect(() => {
    fetchProducts(1);
  }, []);
  
  return {
    products: data?.products || [],
    total: data?.total || 0,
    page,
    pageSize: data?.pageSize || 20,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    toggleProduct,
    updateStock,
  };
}
