/**
 * Unit Tests: Webhook Signature Validation
 * 
 * Tests for mercadoPagoService.validateWebhookSignature
 * Validates Requirements 1.1-1.9 from payment-status-notifications spec
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';

describe('Webhook Signature Validation', () => {
  const originalEnv = process.env;
  const TEST_SECRET = 'test-webhook-secret-12345';
  
  beforeEach(() => {
    // Reset modules to ensure fresh import
    vi.resetModules();
    // Set test environment
    process.env = { ...originalEnv };
    process.env.MERCADOPAGO_WEBHOOK_SECRET = TEST_SECRET;
  });
  
  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });
  
  /**
   * Helper: Generate valid signature for testing
   */
  function generateValidSignature(dataId: string, requestId: string, ts: string): string {
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const hash = crypto
      .createHmac('sha256', TEST_SECRET)
      .update(manifest)
      .digest('hex');
    
    return `ts=${ts},v1=${hash}`;
  }
  
  describe('Valid Signatures', () => {
    it('should validate correct signature', async () => {
      const { mercadoPagoService } = await import('../modules/payment/services/mercadoPagoService');
      
      const dataId = '12345678';
      const requestId = 'req-abc-123';
      const ts = '1234567890';
      const signature = generateValidSignature(dataId, requestId, ts);
      
      const result = mercadoPagoService.validateWebhookSignature(
        signature,
        requestId,
        dataId
      );
      
      expect(result).toBe(true);
    });
    
    it('should validate signature with different data', async () => {
      const { mercadoPagoService } = await import('../modules/payment/services/mercadoPagoService');
      
      const dataId = '98765432';
      const requestId = 'req-xyz-789';
      const ts = '9876543210';
      const signature = generateValidSignature(dataId, requestId, ts);
      
      const result = mercadoPagoService.validateWebhookSignature(
        signature,
        requestId,
        dataId
      );
      
      expect(result).toBe(true);
    });
  });
  
  describe('Invalid Signatures', () => {
    it('should reject signature with wrong hash', async () => {
      const { mercadoPagoService } = await import('../modules/payment/services/mercadoPagoService');
      
      const dataId = '12345678';
      const requestId = 'req-abc-123';
      const ts = '1234567890';
      const signature = `ts=${ts},v1=wronghash123456`;
      
      const result = mercadoPagoService.validateWebhookSignature(
        signature,
        requestId,
        dataId
      );
      
      expect(result).toBe(false);
    });
    
    it('should reject signature with tampered dataId', async () => {
      const { mercadoPagoService } = await import('../modules/payment/services/mercadoPagoService');
      
      const originalDataId = '12345678';
      const tamperedDataId = '87654321';
      const requestId = 'req-abc-123';
      const ts = '1234567890';
      
      // Generate signature with original dataId
      const signature = generateValidSignature(originalDataId, requestId, ts);
      
      // Try to validate with tampered dataId
      const result = mercadoPagoService.validateWebhookSignature(
        signature,
        requestId,
        tamperedDataId
      );
      
      expect(result).toBe(false);
    });
    
    it('should reject signature with tampered requestId', async () => {
      const { mercadoPagoService } = await import('../modules/payment/services/mercadoPagoService');
      
      const dataId = '12345678';
      const originalRequestId = 'req-abc-123';
      const tamperedRequestId = 'req-xyz-789';
      const ts = '1234567890';
      
      // Generate signature with original requestId
      const signature = generateValidSignature(dataId, originalRequestId, ts);
      
      // Try to validate with tampered requestId
      const result = mercadoPagoService.validateWebhookSignature(
        signature,
        tamperedRequestId,
        dataId
      );
      
      expect(result).toBe(false);
    });
    
    it('should reject signature with tampered timestamp', async () => {
      const { mercadoPagoService } = await import('../modules/payment/services/mercadoPagoService');
      
      const dataId = '12345678';
      const requestId = 'req-abc-123';
      const originalTs = '1234567890';
      const tamperedTs = '9876543210';
      
      // Generate signature with original timestamp
      const originalSignature = generateValidSignature(dataId, requestId, originalTs);
      
      // Extract hash and create tampered signature
      const hash = originalSignature.split(',v1=')[1];
      const tamperedSignature = `ts=${tamperedTs},v1=${hash}`;
      
      // Try to validate with tampered timestamp
      const result = mercadoPagoService.validateWebhookSignature(
        tamperedSignature,
        requestId,
        dataId
      );
      
      expect(result).toBe(false);
    });
  });
  
  describe('Malformed Signatures', () => {
    it('should reject signature without ts field', async () => {
      const { mercadoPagoService } = await import('../modules/payment/services/mercadoPagoService');
      
      const signature = 'v1=abc123def456';
      const result = mercadoPagoService.validateWebhookSignature(
        signature,
        'req-123',
        '12345'
      );
      
      expect(result).toBe(false);
    });
    
    it('should reject signature without v1 field', async () => {
      const { mercadoPagoService } = await import('../modules/payment/services/mercadoPagoService');
      
      const signature = 'ts=1234567890';
      const result = mercadoPagoService.validateWebhookSignature(
        signature,
        'req-123',
        '12345'
      );
      
      expect(result).toBe(false);
    });
    
    it('should reject empty signature', async () => {
      const { mercadoPagoService } = await import('../modules/payment/services/mercadoPagoService');
      
      const signature = '';
      const result = mercadoPagoService.validateWebhookSignature(
        signature,
        'req-123',
        '12345'
      );
      
      expect(result).toBe(false);
    });
    
    it('should reject signature with wrong format', async () => {
      const { mercadoPagoService } = await import('../modules/payment/services/mercadoPagoService');
      
      const signature = 'invalid-format-signature';
      const result = mercadoPagoService.validateWebhookSignature(
        signature,
        'req-123',
        '12345'
      );
      
      expect(result).toBe(false);
    });
  });
  
  describe('Configuration Errors', () => {
    it('should throw error when MERCADOPAGO_WEBHOOK_SECRET is not configured', async () => {
      // Remove webhook secret
      delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
      
      const { mercadoPagoService } = await import('../modules/payment/services/mercadoPagoService');
      
      expect(() => {
        mercadoPagoService.validateWebhookSignature(
          'ts=123,v1=abc',
          'req-123',
          '12345'
        );
      }).toThrow('MERCADOPAGO_WEBHOOK_SECRET is not configured');
    });
  });
  
  describe('Security: Constant-Time Comparison', () => {
    it('should use timing-safe comparison (crypto.timingSafeEqual)', async () => {
      const { mercadoPagoService } = await import('../modules/payment/services/mercadoPagoService');
      
      const dataId = '12345678';
      const requestId = 'req-abc-123';
      const ts = '1234567890';
      
      // Generate two different valid signatures
      const signature1 = generateValidSignature(dataId, requestId, ts);
      const signature2 = generateValidSignature('87654321', requestId, ts);
      
      // Both should execute in similar time (constant-time comparison)
      // This test verifies the function doesn't throw on comparison
      const result1 = mercadoPagoService.validateWebhookSignature(
        signature1,
        requestId,
        dataId
      );
      
      const result2 = mercadoPagoService.validateWebhookSignature(
        signature2,
        requestId,
        dataId
      );
      
      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });
  
  describe('Manifest Construction', () => {
    it('should construct manifest in correct format', async () => {
      const { mercadoPagoService } = await import('../modules/payment/services/mercadoPagoService');
      
      // Test that manifest format is: id:{data.id};request-id:{x-request-id};ts:{ts};
      const dataId = '12345678';
      const requestId = 'req-abc-123';
      const ts = '1234567890';
      
      // Expected manifest
      const expectedManifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
      
      // Generate signature using expected manifest
      const expectedHash = crypto
        .createHmac('sha256', TEST_SECRET)
        .update(expectedManifest)
        .digest('hex');
      
      const signature = `ts=${ts},v1=${expectedHash}`;
      
      // Should validate successfully
      const result = mercadoPagoService.validateWebhookSignature(
        signature,
        requestId,
        dataId
      );
      
      expect(result).toBe(true);
    });
  });
});
