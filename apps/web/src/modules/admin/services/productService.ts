// Product Service
// Provides product CRUD operations for admin panel

import { createClient } from '@/lib/supabase/server';
import type { Product, ServiceResult } from '../types';
import type { ProductInput, StockUpdateInput } from '../schemas';
import { productSchema, stockUpdateSchema } from '../schemas';
import { PAGE_SIZE } from '../constants';

interface ProductListResult {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Lists all products with pagination (includes soft-deleted products)
 */
export async function listProducts(page: number = 1): Promise<ServiceResult<ProductListResult>> {
  try {
    const supabase = await createClient();
    const offset = (page - 1) * PAGE_SIZE;
    
    // Get total count (including soft-deleted)
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to count products',
        },
      };
    }
    
    // Get products with pagination
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch products',
        },
      };
    }
    
    const products: Product[] = data.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      stock: p.stock,
      category: p.category,
      sizes: p.sizes,
      images: p.images,
      deletedAt: p.deleted_at,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
    
    return {
      success: true,
      data: {
        products,
        total: count || 0,
        page,
        pageSize: PAGE_SIZE,
      },
    };
  } catch (error) {
    console.error('[Product Service] List error:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Creates a new product
 */
export async function createProduct(input: ProductInput): Promise<ServiceResult<Product>> {
  try {
    // Validate input
    const validation = productSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid product data',
          details: validation.error.flatten().fieldErrors as Record<string, string[]>,
        },
      };
    }
    
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: input.name,
        description: input.description,
        price: input.price,
        stock: input.stock,
        category: input.category,
        sizes: input.sizes,
        images: input.images,
      })
      .select()
      .single();
    
    if (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create product',
        },
      };
    }
    
    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        category: data.category,
        sizes: data.sizes,
        images: data.images,
        deletedAt: data.deleted_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (error) {
    console.error('[Product Service] Create error:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Updates an existing product
 */
export async function updateProduct(id: string, input: ProductInput): Promise<ServiceResult<Product>> {
  try {
    // Validate input
    const validation = productSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid product data',
          details: validation.error.flatten().fieldErrors as Record<string, string[]>,
        },
      };
    }
    
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('products')
      .update({
        name: input.name,
        description: input.description,
        price: input.price,
        stock: input.stock,
        category: input.category,
        sizes: input.sizes,
        images: input.images,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update product',
        },
      };
    }
    
    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        category: data.category,
        sizes: data.sizes,
        images: data.images,
        deletedAt: data.deleted_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (error) {
    console.error('[Product Service] Update error:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Toggles product soft delete status
 */
export async function toggleProduct(id: string): Promise<ServiceResult<Product>> {
  try {
    const supabase = await createClient();
    
    // Get current product
    const { data: current, error: fetchError } = await supabase
      .from('products')
      .select('deleted_at')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Product not found',
        },
      };
    }
    
    // Toggle deleted_at
    const newDeletedAt = current.deleted_at ? null : new Date().toISOString();
    
    const { data, error } = await supabase
      .from('products')
      .update({
        deleted_at: newDeletedAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to toggle product',
        },
      };
    }
    
    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        category: data.category,
        sizes: data.sizes,
        images: data.images,
        deletedAt: data.deleted_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (error) {
    console.error('[Product Service] Toggle error:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Updates product stock
 */
export async function updateStock(id: string, input: StockUpdateInput): Promise<ServiceResult<Product>> {
  try {
    // Validate input
    const validation = stockUpdateSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid stock value',
          details: validation.error.flatten().fieldErrors as Record<string, string[]>,
        },
      };
    }
    
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('products')
      .update({
        stock: input.stock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update stock',
        },
      };
    }
    
    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        category: data.category,
        sizes: data.sizes,
        images: data.images,
        deletedAt: data.deleted_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (error) {
    console.error('[Product Service] Update stock error:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    };
  }
}
