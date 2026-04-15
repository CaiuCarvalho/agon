/**
 * Payment Module Validation Schemas
 * 
 * Zod schemas for validating payment-related data
 */

import { z } from 'zod';

// Brazilian state codes
export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
] as const;

// Payment status validation
export const paymentStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'refunded',
  'in_process'
]);

// Mercado Pago payment method validation
export const mercadopagoPaymentMethodSchema = z.enum([
  'credit_card',
  'debit_card',
  'pix',
  'account_money'
]);

// Shipping form validation (Brazilian formats)
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

// Webhook notification validation
export const webhookNotificationSchema = z.object({
  action: z.string(),
  api_version: z.string(),
  data: z.object({
    id: z.string(),
  }),
  date_created: z.string(),
  id: z.number(),
  live_mode: z.boolean(),
  type: z.enum(['payment', 'plan', 'subscription', 'invoice']),
  user_id: z.string(),
});

// Environment variables validation
export const mercadopagoEnvSchema = z.object({
  MERCADOPAGO_ACCESS_TOKEN: z.string()
    .min(1, 'MERCADOPAGO_ACCESS_TOKEN is required')
    .startsWith('APP_USR-', 'Invalid Mercado Pago access token format'),
  
  MERCADOPAGO_WEBHOOK_SECRET: z.string()
    .min(1, 'MERCADOPAGO_WEBHOOK_SECRET is required'),
  
  NEXT_PUBLIC_APP_URL: z.string()
    .url('NEXT_PUBLIC_APP_URL must be a valid URL'),
});

// CEP validation and formatting
export const cepSchema = z.string()
  .transform((val) => val.replace(/\D/g, '')) // Remove non-digits
  .refine((val) => val.length === 8, 'CEP deve ter 8 dígitos')
  .transform((val) => `${val.slice(0, 5)}-${val.slice(5)}`); // Format as XXXXX-XXX

// Phone validation and formatting
export const phoneSchema = z.string()
  .transform((val) => val.replace(/\D/g, '')) // Remove non-digits
  .refine((val) => val.length >= 10 && val.length <= 11, 'Telefone deve ter 10 ou 11 dígitos')
  .transform((val) => {
    const ddd = val.slice(0, 2);
    const number = val.slice(2);
    if (number.length === 8) {
      return `(${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;
    } else {
      return `(${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`;
    }
  });
