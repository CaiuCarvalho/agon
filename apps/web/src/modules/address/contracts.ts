/**
 * Address Module Contracts
 * 
 * Zod schemas for validation of address inputs
 */

import { z } from 'zod';

export const addressSchema = z.object({
  zipCode: z.string().length(8, "CEP deve ter 8 dígitos"),
  street: z.string().min(3, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, "Bairro é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().length(2, "UF deve ter 2 caracteres"),
  isDefault: z.boolean().default(false),
});

export const addressUpdateSchema = addressSchema.partial();
