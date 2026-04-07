import { describe, it, expect } from 'vitest';
import {
  shippingFormSchema,
  paymentMethodSchema,
  createOrderSchema,
} from '../contracts';

describe('Checkout Validation Schemas', () => {
  describe('shippingFormSchema', () => {
    it('should validate correct shipping info', () => {
      const validData = {
        shippingName: 'João Silva',
        shippingAddress: 'Rua Brasil, 100',
        shippingCity: 'São Paulo',
        shippingState: 'SP',
        shippingZip: '01234-567',
        shippingPhone: '(11) 98765-4321',
        shippingEmail: 'joao@example.com',
      };

      const result = shippingFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid CEP format', () => {
      const invalidData = {
        shippingName: 'João Silva',
        shippingAddress: 'Rua Brasil, 100',
        shippingCity: 'São Paulo',
        shippingState: 'SP',
        shippingZip: '12345678', // Missing hyphen
        shippingPhone: '(11) 98765-4321',
        shippingEmail: 'joao@example.com',
      };

      const result = shippingFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('CEP deve estar no formato');
      }
    });

    it('should reject invalid state code', () => {
      const invalidData = {
        shippingName: 'João Silva',
        shippingAddress: 'Rua Brasil, 100',
        shippingCity: 'São Paulo',
        shippingState: 'XX', // Invalid state
        shippingZip: '01234-567',
        shippingPhone: '(11) 98765-4321',
        shippingEmail: 'joao@example.com',
      };

      const result = shippingFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid phone format', () => {
      const invalidData = {
        shippingName: 'João Silva',
        shippingAddress: 'Rua Brasil, 100',
        shippingCity: 'São Paulo',
        shippingState: 'SP',
        shippingZip: '01234-567',
        shippingPhone: '11987654321', // Missing formatting
        shippingEmail: 'joao@example.com',
      };

      const result = shippingFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept landline phone format', () => {
      const validData = {
        shippingName: 'João Silva',
        shippingAddress: 'Rua Brasil, 100',
        shippingCity: 'São Paulo',
        shippingState: 'SP',
        shippingZip: '01234-567',
        shippingPhone: '(11) 3333-4444', // Landline
        shippingEmail: 'joao@example.com',
      };

      const result = shippingFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        shippingName: 'João Silva',
        shippingAddress: 'Rua Brasil, 100',
        shippingCity: 'São Paulo',
        shippingState: 'SP',
        shippingZip: '01234-567',
        shippingPhone: '(11) 98765-4321',
        shippingEmail: 'invalid-email',
      };

      const result = shippingFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject name with numbers', () => {
      const invalidData = {
        shippingName: 'João Silva 123',
        shippingAddress: 'Rua Brasil, 100',
        shippingCity: 'São Paulo',
        shippingState: 'SP',
        shippingZip: '01234-567',
        shippingPhone: '(11) 98765-4321',
        shippingEmail: 'joao@example.com',
      };

      const result = shippingFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('paymentMethodSchema', () => {
    it('should accept cash_on_delivery', () => {
      const result = paymentMethodSchema.safeParse('cash_on_delivery');
      expect(result.success).toBe(true);
    });

    it('should reject invalid payment method', () => {
      const result = paymentMethodSchema.safeParse('credit_card');
      expect(result.success).toBe(false);
    });
  });

  describe('createOrderSchema', () => {
    it('should validate complete order data', () => {
      const validData = {
        shippingInfo: {
          shippingName: 'João Silva',
          shippingAddress: 'Rua Brasil, 100',
          shippingCity: 'São Paulo',
          shippingState: 'SP',
          shippingZip: '01234-567',
          shippingPhone: '(11) 98765-4321',
          shippingEmail: 'joao@example.com',
        },
        paymentMethod: 'cash_on_delivery' as const,
      };

      const result = createOrderSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid order data', () => {
      const invalidData = {
        shippingInfo: {
          shippingName: '',
          shippingAddress: 'Rua Brasil, 100',
          shippingCity: 'São Paulo',
          shippingState: 'SP',
          shippingZip: '01234-567',
          shippingPhone: '(11) 98765-4321',
          shippingEmail: 'joao@example.com',
        },
        paymentMethod: 'cash_on_delivery' as const,
      };

      const result = createOrderSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
