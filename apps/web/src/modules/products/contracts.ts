/**
 * Product Module Contracts
 * 
 * This file serves as the single source of truth for all data contracts
 * in the products module. It defines Zod schemas and types to ensure
 * consistency between frontend, services, and backend.
 * 
 * Following SDD principles: All data validation uses Zod schemas.
 */

import { z } from 'zod';

/**
 * Product validation schema
 * Validates product form data with Portuguese error messages
 */
export const productSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(200, 'Nome deve ter no máximo 200 caracteres'),
  description: z.string()
    .min(1, 'Descrição é obrigatória')
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres'),
  price: z.number()
    .positive('Preço deve ser positivo')
    .multipleOf(0.01, 'Preço deve ter no máximo 2 casas decimais'),
  categoryId: z.string()
    .uuid('Categoria inválida'),
  imageUrl: z.string()
    .url('URL da imagem inválida'),
  stock: z.number()
    .int('Estoque deve ser um número inteiro')
    .nonnegative('Estoque não pode ser negativo'),
  features: z.array(z.string())
    .default([]),
});

/**
 * Category validation schema
 * Validates category form data with Portuguese error messages
 */
export const categorySchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  slug: z.string()
    .min(1, 'Slug é obrigatório')
    .max(100, 'Slug deve ter no máximo 100 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  description: z.string()
    .optional(),
});

/**
 * Product filters validation schema
 * Validates search and filter parameters
 */
export const productFiltersSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  minRating: z.number().min(0).max(5).optional(),
  sortBy: z.enum(['latest', 'oldest', 'price_asc', 'price_desc']).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

/**
 * Image file validation schema
 * Validates uploaded image files
 */
export const imageFileSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'Arquivo deve ter no máximo 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Formato deve ser JPEG, PNG ou WebP'
    ),
});

// Export type inference helpers
export type ProductFormData = z.infer<typeof productSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type ProductFiltersData = z.infer<typeof productFiltersSchema>;
export type ImageFileData = z.infer<typeof imageFileSchema>;

// Re-export domain types
export type {
  Product,
  Category,
} from './types';
