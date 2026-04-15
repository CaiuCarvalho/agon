/**
 * Validation Service
 *
 * Brazilian-specific validation and formatting utilities.
 * Uses Zod schemas from payment/contracts for CEP and phone validation.
 */

import { cepSchema, phoneSchema, BRAZILIAN_STATES } from '@/modules/payment/contracts';

export const validationService = {
  /**
   * Validate and format CEP
   */
  validateCEP(cep: string): { valid: boolean; formatted: string } {
    const result = cepSchema.safeParse(cep);
    if (!result.success) {
      return { valid: false, formatted: cep };
    }
    return { valid: true, formatted: result.data };
  },

  /**
   * Validate and format phone
   */
  validatePhone(phone: string): { valid: boolean; formatted: string } {
    const result = phoneSchema.safeParse(phone);
    if (!result.success) {
      return { valid: false, formatted: phone };
    }
    return { valid: true, formatted: result.data };
  },

  /**
   * Validate Brazilian state code
   */
  validateState(state: string): boolean {
    return BRAZILIAN_STATES.includes(state as any);
  },

  /**
   * Format currency as Brazilian Real
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  },

  /**
   * Sanitize input (remove dangerous characters)
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  },
};
