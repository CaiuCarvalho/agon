/**
 * Product Module Schemas
 * 
 * This file re-exports schemas from contracts.ts for backward compatibility.
 * All schema definitions are now in contracts.ts as the single source of truth.
 */

export {
  productSchema,
  categorySchema,
  productFiltersSchema,
  imageFileSchema,
  type ProductFormData,
  type CategoryFormData,
  type ProductFiltersData,
  type ImageFileData,
} from './contracts';
