/**
 * Admin Module Contracts
 *
 * Single source of truth for admin module validation schemas.
 * Re-exports domain schemas from schemas.ts and adds module-level contracts.
 */

import { z } from 'zod';

export {
  productSchema,
  productUpdateSchema,
  stockUpdateSchema,
  shippingUpdateSchema,
  orderFiltersSchema,
  type ProductInput,
  type ProductUpdateInput,
  type StockUpdateInput,
  type ShippingUpdateInput,
  type OrderFiltersInput,
} from './schemas';

/** Validated admin user returned by validateAdmin() */
export const adminUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.literal('admin'),
});

export type AdminUserData = z.infer<typeof adminUserSchema>;
