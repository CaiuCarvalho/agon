// Product Catalog Types
// This file contains TypeScript interfaces for the product catalog feature

/**
 * Product entity (camelCase for TypeScript)
 * Represents a product in the catalog with all its attributes
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl: string;
  stock: number;
  features: string[];
  rating: number;
  reviews: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  category?: Category; // Optional joined category data
}

/**
 * Category entity
 * Represents a product category for organization
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Product form values (for create/update operations)
 * Excludes system-managed fields (id, timestamps)
 * Inferred from Zod schema to ensure type compatibility
 */
export type ProductFormValues = {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl: string;
  stock: number;
  features: string[];
};

/**
 * Category form values (for create/update operations)
 * Excludes system-managed fields (id, timestamps)
 */
export interface CategoryFormValues {
  name: string;
  slug: string;
  description?: string;
}

/**
 * Product filters for search and filtering
 * Used in product listing and search functionality
 */
export interface ProductFilters {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: 'latest' | 'oldest' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}

/**
 * Paginated products response
 * Contains products array and pagination metadata
 */
export interface PaginatedProducts {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Product database row (snake_case from Supabase)
 * Represents the raw database structure
 */
export interface ProductRow {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url: string;
  stock: number;
  features: string[];
  rating: number;
  reviews: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Category database row (snake_case from Supabase)
 * Represents the raw database structure
 */
export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}
