// Admin Panel Zod Schemas
// All validation schemas for the admin panel module

import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().min(1, 'Description is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  category: z.string().min(1, 'Category is required'),
  sizes: z.array(z.string()).min(1, 'At least one size required'),
  images: z.array(z.string().url()).min(1, 'At least one image required'),
});

export const shippingUpdateSchema = z.object({
  shippingStatus: z.enum(['pending', 'processing', 'shipped', 'delivered']),
  trackingCode: z.string().optional(),
  carrier: z.string().optional(),
}).refine(
  (data) => {
    if (data.shippingStatus === 'shipped' || data.shippingStatus === 'delivered') {
      return data.trackingCode && data.carrier;
    }
    return true;
  },
  {
    message: 'Tracking code and carrier are required when status is shipped or delivered',
    path: ['trackingCode'],
  }
);

export const stockUpdateSchema = z.object({
  stock: z.number().int().min(0, 'Stock must be non-negative'),
});

export const orderFiltersSchema = z.object({
  paymentStatus: z.enum(['pending', 'approved', 'rejected', 'cancelled', 'refunded', 'in_process']).optional(),
  shippingStatus: z.enum(['pending', 'processing', 'shipped', 'delivered']).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ShippingUpdateInput = z.infer<typeof shippingUpdateSchema>;
export type StockUpdateInput = z.infer<typeof stockUpdateSchema>;
export type OrderFiltersInput = z.infer<typeof orderFiltersSchema>;
