/**
 * Validation Service
 * 
 * Brazilian-specific validation and formatting utilities
 */

import { BRAZILIAN_STATES } from '@/modules/payment/contracts';

export const validationService = {
  /**
   * Validate and format CEP
   */
  validateCEP(cep: string): { valid: boolean; formatted: string } {
    const cleaned = cep.replace(/\D/g, '');
    
    if (cleaned.length !== 8) {
      return { valid: false, formatted: cep };
    }
    
    const formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    return { valid: true, formatted };
  },
  
  /**
   * Validate and format phone
   */
  validatePhone(phone: string): { valid: boolean; formatted: string } {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length < 10 || cleaned.length > 11) {
      return { valid: false, formatted: phone };
    }
    
    const ddd = cleaned.slice(0, 2);
    const number = cleaned.slice(2);
    
    if (number.length === 8) {
      // Landline: (XX) XXXX-XXXX
      const formatted = `(${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;
      return { valid: true, formatted };
    } else {
      // Mobile: (XX) XXXXX-XXXX
      const formatted = `(${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`;
      return { valid: true, formatted };
    }
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
