import type { SupabaseClient } from '@supabase/supabase-js';
import { productSchema } from '../schemas';
import type {
  Product,
  ProductFormValues,
  ProductFilters,
  PaginatedProducts,
  ProductRow,
  CategoryRow,
} from '../types';

/**
 * Product Service Layer
 * 
 * Handles all product CRUD operations with:
 * - Full-text search using PostgreSQL to_tsvector (Portuguese)
 * - Pagination (offset-based)
 * - Filtering (category, price range, rating)
 * - Sorting (latest, oldest, price_asc, price_desc)
 * - Soft delete support
 * - Optimistic locking with updated_at validation
 * - RLS policy compliance
 * 
 * Validates Requirements: 4.9, 4.10, 5.5, 5.6, 5.7, 6.1-6.10, 8.1-8.12, 9.1-9.10, 10.1-10.8
 */

/**
 * Database row structure from Supabase query
 * Matches the exact structure returned by Supabase with joined category data
 */
interface DatabaseProductRow {
  id: string;
  name: string;
  description: string;
  price: string | number;
  category_id: string;
  image_url: string;
  stock: number;
  features: string[];
  rating: string | number;
  reviews: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    created_at: string;
    updated_at: string;
  };
}

/**
 * Transform database row (snake_case) to Product interface (camelCase)
 */
function transformProductRow(row: DatabaseProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: typeof row.price === 'number' ? row.price : parseFloat(row.price),
    categoryId: row.category_id,
    imageUrl: row.image_url,
    stock: row.stock,
    features: row.features || [],
    rating: typeof row.rating === 'number' ? row.rating : parseFloat(row.rating || '0'),
    reviews: row.reviews || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    category: row.category ? {
      id: row.category.id,
      name: row.category.name,
      slug: row.category.slug,
      description: row.category.description,
      createdAt: row.category.created_at,
      updatedAt: row.category.updated_at,
    } : undefined,
  };
}

/**
 * Get paginated products with filters
 * 
 * Supports:
 * - Full-text search (Portuguese) on name and description using to_tsvector
 * - Category filtering
 * - Price range filtering
 * - Rating filtering
 * - Multiple sort options
 * - Offset-based pagination
 * 
 * Validates Requirements: 8.1-8.12, 9.1-9.10, 10.1-10.8
 */
export async function getProducts(
  supabase: SupabaseClient,
  filters: ProductFilters = {}
): Promise<PaginatedProducts> {
  const {
    search,
    categoryId,
    minPrice,
    maxPrice,
    minRating,
    sortBy = 'latest',
    page = 1,
    limit = 20,
  } = filters;

  // Enforce LIMIT to prevent unbounded queries (max 100)
  const effectiveLimit = Math.min(limit || 20, 100);

  // If search is provided, we need to use a different approach
  // because we need to search both name AND description with full-text search
  if (search && search.trim()) {
    return await getProductsWithSearch(supabase, { ...filters, limit: effectiveLimit });
  }

  // Start building query with explicit field selection (no SELECT *)
  // This reduces data transfer and improves performance
  let query = supabase
    .from('products')
    .select(
      'id, name, description, price, category_id, image_url, stock, features, rating, reviews, created_at, updated_at, deleted_at, category:categories(id, name, slug, description, created_at, updated_at)',
      { count: 'exact' }
    )
    .is('deleted_at', null);

  // Apply category filter
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  // Apply price range filters
  if (minPrice !== undefined) {
    query = query.gte('price', minPrice);
  }
  if (maxPrice !== undefined) {
    query = query.lte('price', maxPrice);
  }

  // Apply rating filter
  if (minRating !== undefined) {
    query = query.gte('rating', minRating);
  }

  // Apply sorting
  switch (sortBy) {
    case 'latest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  // Apply pagination with effective limit
  const from = (page - 1) * effectiveLimit;
  const to = from + effectiveLimit - 1;
  query = query.range(from, to);

  // Wrap query with timeout to prevent infinite loading (increased to 15s for cold start)
  const startTime = Date.now();
  const queryPromise = query;
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('Query timeout after 15 seconds')), 15000)
  );

  let data, error, count;
  let retryAttempted = false;
  
  try {
    const result = await Promise.race([queryPromise, timeoutPromise]);
    data = result.data;
    error = result.error;
    count = result.count;
  } catch (timeoutError: any) {
    const queryTime = Date.now() - startTime;
    
    // Log timeout with context
    console.error('[getProducts] Query timeout:', {
      filters: { ...filters, limit: effectiveLimit },
      queryTime,
      error: timeoutError?.message,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      isColdStart: true,
    });
    
    // Retry once on timeout (cold start mitigation)
    if (!retryAttempted) {
      retryAttempted = true;

      try {
        const retryResult = await query;
        data = retryResult.data;
        error = retryResult.error;
        count = retryResult.count;
      } catch (retryError: any) {
        console.error('[getProducts] Retry failed:', retryError?.message);
        throw timeoutError; // Throw original timeout error
      }
    } else {
      throw timeoutError;
    }
  }

  if (error) {
    console.error('[products] fetch failed', {
      page: 'service:getProducts',
      filters,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      nodeEnv: process.env.NODE_ENV,
      code: error.code,
      message: error.message,
      hint: (error as any).hint,
    });
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  // CRITICAL: Check for silent failure (data is null but no error)
  if (!data) {
    console.error('[getProducts] Silent failure: data is null but no error', { filters });
    throw new Error('Failed to fetch products: No data returned');
  }

  return {
    products: (data || []).map(transformProductRow),
    total: count || 0,
    page,
    limit: effectiveLimit,
    totalPages: Math.ceil((count || 0) / effectiveLimit),
  };
}

/**
 * Get products with full-text search
 * 
 * Uses PostgreSQL to_tsvector('portuguese', name) and plainto_tsquery('portuguese', searchTerm)
 * This is a separate function because Supabase's query builder doesn't support
 * complex OR conditions with textSearch on multiple columns
 * 
 * CRITICAL: Uses to_tsvector NOT ILIKE for better performance and language support
 */
async function getProductsWithSearch(
  supabase: SupabaseClient,
  filters: ProductFilters
): Promise<PaginatedProducts> {
  const {
    search,
    categoryId,
    minPrice,
    maxPrice,
    minRating,
    sortBy = 'latest',
    page = 1,
    limit = 20,
  } = filters;

  // Enforce LIMIT to prevent unbounded queries (max 100)
  const effectiveLimit = Math.min(limit || 20, 100);
  const searchTerm = search!.trim();

  // Build the full-text search query using textSearch with explicit field selection
  let nameQuery = supabase
    .from('products')
    .select(
      'id, name, description, price, category_id, image_url, stock, features, rating, reviews, created_at, updated_at, deleted_at, category:categories(id, name, slug, description, created_at, updated_at)',
      { count: 'exact' }
    )
    .is('deleted_at', null)
    .textSearch('name', searchTerm, { type: 'plain', config: 'portuguese' });

  let descQuery = supabase
    .from('products')
    .select(
      'id, name, description, price, category_id, image_url, stock, features, rating, reviews, created_at, updated_at, deleted_at, category:categories(id, name, slug, description, created_at, updated_at)',
      { count: 'exact' }
    )
    .is('deleted_at', null)
    .textSearch('description', searchTerm, { type: 'plain', config: 'portuguese' });

  // Apply filters to both queries
  const applyFilters = (query: any) => {
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (minPrice !== undefined) {
      query = query.gte('price', minPrice);
    }
    if (maxPrice !== undefined) {
      query = query.lte('price', maxPrice);
    }
    if (minRating !== undefined) {
      query = query.gte('rating', minRating);
    }
    return query;
  };

  nameQuery = applyFilters(nameQuery);
  descQuery = applyFilters(descQuery);

  // Wrap queries with timeout to prevent infinite loading (increased to 15s for cold start)
  const startTime = Date.now();
  const queriesPromise = Promise.all([nameQuery, descQuery]);
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('Query timeout after 15 seconds')), 15000)
  );

  let nameResults, descResults;
  let retryAttempted = false;
  
  try {
    [nameResults, descResults] = await Promise.race([queriesPromise, timeoutPromise]);
  } catch (timeoutError: any) {
    const queryTime = Date.now() - startTime;
    
    // Log timeout with context
    console.error('[getProductsWithSearch] Query timeout:', {
      filters: { ...filters, limit: effectiveLimit },
      queryTime,
      error: timeoutError?.message,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      isColdStart: true,
    });
    
    // Retry once on timeout (cold start mitigation)
    if (!retryAttempted) {
      retryAttempted = true;

      try {
        [nameResults, descResults] = await Promise.all([nameQuery, descQuery]);
      } catch (retryError: any) {
        console.error('[getProductsWithSearch] Retry failed:', retryError?.message);
        throw timeoutError; // Throw original timeout error
      }
    } else {
      throw timeoutError;
    }
  }

  if (nameResults.error) {
    console.error('[getProductsWithSearch] Name search error:', {
      filters,
      error: nameResults.error.message,
      code: nameResults.error.code,
    });
    throw new Error(`Failed to search products: ${nameResults.error.message}`);
  }
  if (descResults.error) {
    console.error('[getProductsWithSearch] Description search error:', {
      filters,
      error: descResults.error.message,
      code: descResults.error.code,
    });
    throw new Error(`Failed to search products: ${descResults.error.message}`);
  }

  // Merge results and remove duplicates
  const allProducts = [...(nameResults.data || []), ...(descResults.data || [])];
  const uniqueProducts = Array.from(
    new Map(allProducts.map(p => [p.id, p])).values()
  );

  // Apply sorting
  uniqueProducts.sort((a, b) => {
    switch (sortBy) {
      case 'latest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'price_asc':
        return parseFloat(a.price) - parseFloat(b.price);
      case 'price_desc':
        return parseFloat(b.price) - parseFloat(a.price);
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Apply pagination with effective limit
  const total = uniqueProducts.length;
  const from = (page - 1) * effectiveLimit;
  const to = from + effectiveLimit;
  const paginatedProducts = uniqueProducts.slice(from, to);

  return {
    products: paginatedProducts.map(transformProductRow),
    total,
    page,
    limit: effectiveLimit,
    totalPages: Math.ceil(total / effectiveLimit),
  };
}

/**
 * Get single product by ID
 * 
 * Returns null if not found or soft-deleted
 * Includes category join
 * 
 * Validates Requirements: 8.1, 8.2
 */
export async function getProductById(
  supabase: SupabaseClient,
  id: string
): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch product: ${error.message}`);
  }

  return transformProductRow(data);
}

/**
 * Create new product
 * 
 * Validates input with Zod schema before insertion
 * Returns created product with category join
 * 
 * Validates Requirements: 4.1-4.10
 */
export async function createProduct(
  supabase: SupabaseClient,
  values: ProductFormValues
): Promise<Product> {
  // Validate with Zod
  const validated = productSchema.parse(values);

  const { data, error } = await supabase
    .from('products')
    .insert({
      name: validated.name,
      description: validated.description,
      price: validated.price,
      category_id: validated.categoryId,
      image_url: validated.imageUrl,
      stock: validated.stock,
      features: validated.features,
    })
    .select('*, category:categories(*)')
    .single();

  if (error) {
    throw new Error(`Failed to create product: ${error.message}`);
  }

  return transformProductRow(data);
}

/**
 * Update existing product
 * 
 * Validates input with partial Zod schema
 * Implements optimistic locking with updated_at validation
 * Returns updated product with category join
 * 
 * Validates Requirements: 5.1-5.10
 */
export async function updateProduct(
  supabase: SupabaseClient,
  id: string,
  values: Partial<ProductFormValues>,
  currentUpdatedAt?: string
): Promise<Product> {
  // Validate with Zod (partial)
  const validated = productSchema.partial().parse(values);

  // Build update data object (snake_case for database)
  const updateData: any = {};
  if (validated.name !== undefined) updateData.name = validated.name;
  if (validated.description !== undefined) updateData.description = validated.description;
  if (validated.price !== undefined) updateData.price = validated.price;
  if (validated.categoryId !== undefined) updateData.category_id = validated.categoryId;
  if (validated.imageUrl !== undefined) updateData.image_url = validated.imageUrl;
  if (validated.stock !== undefined) updateData.stock = validated.stock;
  if (validated.features !== undefined) updateData.features = validated.features;

  // Start building update query
  let query = supabase
    .from('products')
    .update(updateData)
    .eq('id', id);

  // CRITICAL: Optimistic locking - validate updated_at timestamp
  if (currentUpdatedAt) {
    query = query.eq('updated_at', currentUpdatedAt);
  }

  const { data, error } = await query
    .select('*, category:categories(*)')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Product was modified by another user. Please refresh and try again.');
    }
    throw new Error(`Failed to update product: ${error.message}`);
  }

  return transformProductRow(data);
}

/**
 * Soft delete product
 * 
 * Sets deleted_at to current timestamp
 * Does not physically remove the row (preserves historical data)
 * 
 * Validates Requirements: 6.1-6.10
 */
export async function softDeleteProduct(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete product: ${error.message}`);
  }
}

/**
 * Restore soft-deleted product
 * 
 * Sets deleted_at to NULL
 * Returns restored product with category join
 * 
 * Validates Requirements: 6.9, 6.10
 */
export async function restoreProduct(
  supabase: SupabaseClient,
  id: string
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update({ deleted_at: null })
    .eq('id', id)
    .select('*, category:categories(*)')
    .single();

  if (error) {
    throw new Error(`Failed to restore product: ${error.message}`);
  }

  return transformProductRow(data);
}

/**
 * Get deleted products (admin only)
 * 
 * Returns products where deleted_at IS NOT NULL
 * Sorted by deletion date (most recent first)
 * 
 * Validates Requirements: 6.9
 */
export async function getDeletedProducts(supabase: SupabaseClient): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch deleted products: ${error.message}`);
  }

  return (data || []).map(transformProductRow);
}
