// Product Service
// Provides product CRUD operations for admin panel

import { isConfigurationError } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/admin';
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

function mapRow(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    stock: p.stock,
    unlimitedStock: p.unlimited_stock ?? false,
    categoryId: p.category_id ?? null,
    category: (p.categories as { name: string } | null)?.name ?? '',
    sizes: p.sizes ?? [],
    imageUrl: p.image_url ?? '',
    deletedAt: p.deleted_at,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

/**
 * Lists all products with pagination (includes soft-deleted products)
 */
export async function listProducts(page: number = 1): Promise<ServiceResult<ProductListResult>> {
  try {
    const supabase = createAdminClient();
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

    // Get products with pagination (join categories for display name)
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
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

    return {
      success: true,
      data: {
        products: data.map(mapRow),
        total: count || 0,
        page,
        pageSize: PAGE_SIZE,
      },
    };
  } catch (error) {
    console.error('[Product Service] List error:', error);
    if (isConfigurationError(error)) {
      return {
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: error.message,
          details: { env: error.missingVars },
        },
      };
    }

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

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('products')
      .insert({
        name: input.name,
        description: input.description,
        price: input.price,
        stock: input.stock,
        unlimited_stock: input.unlimitedStock ?? false,
        category_id: input.categoryId ?? null,
        sizes: input.sizes,
        image_url: input.imageUrl,
      })
      .select('*, categories(name)')
      .single();

    if (error) {
      console.error('[Product Service] DB insert error:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: error.message || 'Failed to create product',
        },
      };
    }

    return { success: true, data: mapRow(data) };
  } catch (error) {
    console.error('[Product Service] Create error:', error);
    if (isConfigurationError(error)) {
      return {
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: error.message,
          details: { env: error.missingVars },
        },
      };
    }

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

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('products')
      .update({
        name: input.name,
        description: input.description,
        price: input.price,
        stock: input.stock,
        unlimited_stock: input.unlimitedStock ?? false,
        category_id: input.categoryId ?? null,
        sizes: input.sizes,
        image_url: input.imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, categories(name)')
      .single();

    if (error) {
      console.error('[Product Service] DB update error:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: error.message || 'Failed to update product',
        },
      };
    }

    return { success: true, data: mapRow(data) };
  } catch (error) {
    console.error('[Product Service] Update error:', error);
    if (isConfigurationError(error)) {
      return {
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: error.message,
          details: { env: error.missingVars },
        },
      };
    }

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
    const supabase = createAdminClient();

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

    return { success: true, data: mapRow(data) };
  } catch (error) {
    console.error('[Product Service] Toggle error:', error);
    if (isConfigurationError(error)) {
      return {
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: error.message,
          details: { env: error.missingVars },
        },
      };
    }

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

    const supabase = createAdminClient();

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

    return { success: true, data: mapRow(data) };
  } catch (error) {
    console.error('[Product Service] Update stock error:', error);
    if (isConfigurationError(error)) {
      return {
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: error.message,
          details: { env: error.missingVars },
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    };
  }
}
