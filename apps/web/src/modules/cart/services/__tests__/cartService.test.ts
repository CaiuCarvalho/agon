/**
 * Cart Service Unit Tests
 * 
 * Tests validation logic, retry behavior, and data transformation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cartService } from '../cartService';

describe('cartService', () => {
  describe('validation', () => {
    it('should reject quantity less than 1', async () => {
      await expect(
        cartService.addToCart('user-123', {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 0,
          size: 'M',
        })
      ).rejects.toThrow('Quantidade mínima é 1');
    });

    it('should reject quantity greater than 99', async () => {
      await expect(
        cartService.addToCart('user-123', {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 100,
          size: 'M',
        })
      ).rejects.toThrow('Quantidade máxima é 99');
    });

    it('should reject empty size', async () => {
      await expect(
        cartService.addToCart('user-123', {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 1,
          size: '',
        })
      ).rejects.toThrow('Tamanho é obrigatório');
    });

    it('should reject size longer than 10 characters', async () => {
      await expect(
        cartService.addToCart('user-123', {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 1,
          size: 'EXTRA-LARGE-SIZE',
        })
      ).rejects.toThrow('Tamanho deve ter no máximo 10 caracteres');
    });

    it('should reject invalid product ID format', async () => {
      await expect(
        cartService.addToCart('user-123', {
          productId: 'invalid-uuid',
          quantity: 1,
          size: 'M',
        })
      ).rejects.toThrow('Product ID inválido');
    });
  });

  describe('withRetry', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should retry on network errors', async () => {
      let attempts = 0;
      const operation = vi.fn(async () => {
        attempts++;
        if (attempts < 3) {
          const error: any = new Error('fetch failed');
          error.code = 'PGRST301';
          throw error;
        }
        return 'success';
      });

      const result = await cartService.withRetry(operation, 2, 100);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on validation errors', async () => {
      const operation = vi.fn(async () => {
        const error: any = new Error('Validation failed');
        error.code = '23505'; // Unique constraint violation
        throw error;
      });

      await expect(cartService.withRetry(operation, 2, 100)).rejects.toThrow('Validation failed');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries', async () => {
      const operation = vi.fn(async () => {
        const error: any = new Error('Network error');
        error.code = 'PGRST504';
        throw error;
      });

      await expect(cartService.withRetry(operation, 2, 100)).rejects.toThrow('Network error');
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });
});
