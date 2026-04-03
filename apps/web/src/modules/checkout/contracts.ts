import { z } from "zod";

export const CartItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  size: z.string(),
  imageUrl: z.string().url(),
});

export const CartSchema = z.object({
  sessionId: z.string(),
  items: z.array(CartItemSchema),
  total: z.number().min(0),
});

export type CartItem = z.infer<typeof CartItemSchema>;
export type Cart = z.infer<typeof CartSchema>;

// Contract expecting input payload to API
export const AddToCartPayloadSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  size: z.string(),
});

export type AddToCartPayload = z.infer<typeof AddToCartPayloadSchema>;
