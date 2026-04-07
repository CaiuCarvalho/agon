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

// Brazilian state codes
const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
] as const;

// Shipping information validation schema
export const shippingFormSchema = z.object({
  shippingName: z.string()
    .min(1, 'Nome é obrigatório')
    .max(200, 'Nome deve ter no máximo 200 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  
  shippingAddress: z.string()
    .min(1, 'Endereço é obrigatório')
    .max(500, 'Endereço deve ter no máximo 500 caracteres'),
  
  shippingCity: z.string()
    .min(1, 'Cidade é obrigatória')
    .max(100, 'Cidade deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Cidade deve conter apenas letras'),
  
  shippingState: z.enum(BRAZILIAN_STATES, {
    errorMap: () => ({ message: 'Estado inválido' })
  }),
  
  shippingZip: z.string()
    .regex(/^\d{5}-\d{3}$/, 'CEP deve estar no formato XXXXX-XXX'),
  
  shippingPhone: z.string()
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX'),
  
  shippingEmail: z.string()
    .email('Email inválido')
    .max(200, 'Email deve ter no máximo 200 caracteres'),
});

export type ShippingFormValues = z.infer<typeof shippingFormSchema>;

// Payment method validation
export const paymentMethodSchema = z.enum(['cash_on_delivery'], {
  errorMap: () => ({ message: 'Método de pagamento inválido' })
});

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

// Order creation validation
export const createOrderSchema = z.object({
  shippingInfo: shippingFormSchema,
  paymentMethod: paymentMethodSchema,
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
