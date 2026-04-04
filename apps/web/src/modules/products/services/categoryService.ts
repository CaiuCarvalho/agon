import { createClient } from '@/lib/supabase/client';
import { categorySchema } from '../schemas';
import type { Category, CategoryFormValues, CategoryRow } from '../types';

/**
 * Category Service Layer
 * 
 * Handles all category CRUD operations with:
 * - Slug generation (lowercase, accent removal, hyphenation)
 * - Category deletion protection (prevents deletion if products exist)
 * - Product count tracking
 * - Snake_case to camelCase transformation
 * - Zod validation
 * 
 * Validates Requirements: 13.1-13.10
 */

/**
 * Transform database row (snake_case) to Category interface (camelCase)
 */
function transformCategoryRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Generate URL-friendly slug from category name
 * - Converts to lowercase
 * - Removes accents using NFD normalization
 * - Replaces spaces with hyphens
 * - Removes special characters
 * 
 * Validates Requirement: 13.7
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove special characters
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Get count of non-deleted products in a category
 * 
 * Validates Requirement: 13.9
 */
export async function getCategoryProductCount(id: string): Promise<number> {
  const supabase = createClient();

  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)
    .is('deleted_at', null);

  if (error) {
    throw new Error(`Failed to get product count: ${error.message}`);
  }

  return count || 0;
}

/**
 * Get all categories ordered by name
 * 
 * Validates Requirement: 13.1
 */
export async function getCategories(): Promise<Category[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  return (data || []).map(transformCategoryRow);
}

/**
 * Get single category by ID
 * 
 * Validates Requirement: 13.2
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch category: ${error.message}`);
  }

  return transformCategoryRow(data);
}

/**
 * Get category by slug for URL-based lookups
 * 
 * Validates Requirement: 13.3
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch category: ${error.message}`);
  }

  return transformCategoryRow(data);
}

/**
 * Create new category with Zod validation
 * 
 * Validates Requirements: 13.4, 13.5
 */
export async function createCategory(values: CategoryFormValues): Promise<Category> {
  // Validate input
  const validated = categorySchema.parse(values);

  const supabase = createClient();

  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: validated.name,
      slug: validated.slug,
      description: validated.description || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create category: ${error.message}`);
  }

  return transformCategoryRow(data);
}

/**
 * Update category with partial Zod validation
 * 
 * Validates Requirement: 13.6
 */
export async function updateCategory(
  id: string,
  values: Partial<CategoryFormValues>
): Promise<Category> {
  // Validate input with partial schema
  const validated = categorySchema.partial().parse(values);

  const supabase = createClient();

  const { data, error } = await supabase
    .from('categories')
    .update({
      ...(validated.name !== undefined && { name: validated.name }),
      ...(validated.slug !== undefined && { slug: validated.slug }),
      ...(validated.description !== undefined && { description: validated.description || null }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update category: ${error.message}`);
  }

  return transformCategoryRow(data);
}

/**
 * Delete category with product count check
 * Prevents deletion if category has products
 * 
 * Validates Requirements: 13.8, 13.9, 13.10
 */
export async function deleteCategory(id: string): Promise<void> {
  // Check if category has products
  const productCount = await getCategoryProductCount(id);

  if (productCount > 0) {
    throw new Error(
      `Cannot delete category: ${productCount} product(s) still assigned to this category`
    );
  }

  const supabase = createClient();

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete category: ${error.message}`);
  }
}
