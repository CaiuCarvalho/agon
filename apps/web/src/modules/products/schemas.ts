import { z } from 'zod';

/**
 * Product validation schema
 * Validates product form data with Portuguese error messages
 * 
 * Validates Requirements:
 * - 4.4: Name validation (1-200 chars, required)
 * - 4.5: Description validation (1-2000 chars, required)
 * - 4.6: Price validation (positive, max 2 decimals)
 * - 4.7: Stock validation (non-negative integer)
 * - 4.8: Category validation (UUID)
 * - 13.4: Image URL validation
 * - 14.2: Features array validation
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
 * 
 * Validates Requirements:
 * - 14.3: Category name validation (1-100 chars, unique)
 * - 14.3: Slug validation (1-100 chars, lowercase alphanumeric with hyphens)
 * - 14.3: Description validation (optional)
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
 * 
 * Validates Requirements:
 * - 13.4: MIME type validation (JPEG, PNG, WebP)
 * - 13.4: File size validation (max 5MB)
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
