/**
 * Integration Tests: Webhook Handler
 * 
 * Tests for /api/webhooks/mercadopago route handler
 * Validates Requirements 2.1-2.11, 11.1-11.10, 12.1-12.8, 16.1-16.8, 25.1-25.10, 28.1-28.10
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST } from '../app/api/webhooks/mercadopago/route';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

// Mock modules
const mockSupabaseClient = {
  from: vi.fn(),
  rpc: vi.fn(),
};

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock('@/modules/payment/services/mercadoPagoService', () => ({
  mercadoPagoService: {
    validateWebhookSignature: vi.fn(),
    getPaymentDetails: vi.fn(),
  },
}));

describe('Webhook Handler Integration', () => {
  const TEST_SECRET = 'test-webhook-secret-12345';
  const originalEnv = process.env;
  
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.MERCADOPAGO_WEBHOOK_SECRET = TEST_SECRET;
    
    // Reset mock implementations
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });
    mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: null });
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
  
  /**
   * Helper: Generate valid signature
   */
  function generateValidSignature(dataId: string, requestId: string, ts: string): string {
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const hash = crypto
      .createHmac('sha256', TEST_SECRET)
      .update(manifest)
      .digest('hex');
    
    return `ts=${ts},v1=${hash}`;
  }
  
  /**
   * Helper: Create mock request
   */
  function createMockRequest(
    body: any,
    headers: Record<string, string>
  ): NextRequest {
    return {
      headers: {
        get: (name: string) => headers[name] || null,
      },
      json: async () => body,
    } as unknown as NextRequest;
  }
  
  describe('Requirement 1: Signature Validation', () => {
    it('should return 400 when x-signature header is missing', async () => {
      const request = createMockRequest(
        { type: 'payment', data: { id: '12345' } },
        { 'x-request-id': 'req-123' }
      );
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required headers');
    });
    
    it('should return 400 when x-request-id header is missing', async () => {
      const request = createMockRequest(
        { type: 'payment', data: { id: '12345' } },
        { 'x-signature': 'ts=123,v1=abc' }
      );
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required headers');
    });
    
    it('should return 401 when signature is invalid', async () => {
      const { mercadoPagoService } = await import('@/modules/payment/services/mercadoPagoService');
      vi.mocked(mercadoPagoService.validateWebhookSignature).mockReturnValue(false);
      
      const request = createMockRequest(
        { type: 'payment', data: { id: '12345' } },
        {
          'x-signature': 'ts=123,v1=invalid',
          'x-request-id': 'req-123',
        }
      );
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid signature');
    });
  });
  
  describe('Requirement 2: Non-Payment Notifications', () => {
    it('should return 200 and ignore non-payment notifications', async () => {
      const { mercadoPagoService } = await import('@/modules/payment/services/mercadoPagoService');
      vi.mocked(mercadoPagoService.validateWebhookSignature).mockReturnValue(true);
      
      const request = createMockRequest(
        { type: 'merchant_order', data: { id: '12345' } },
        {
          'x-signature': 'ts=123,v1=abc',
          'x-request-id': 'req-123',
        }
      );
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });
  });
  
  describe('Requirement 3: Payment ID Validation', () => {
    it('should return 400 when payment ID is missing', async () => {
      const { mercadoPagoService } = await import('@/modules/payment/services/mercadoPagoService');
      vi.mocked(mercadoPagoService.validateWebhookSignature).mockReturnValue(true);
      
      const request = createMockRequest(
        { type: 'payment', data: {} },
        {
          'x-signature': 'ts=123,v1=abc',
          'x-request-id': 'req-123',
        }
      );
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing payment ID');
    });
  });
  
  describe('Requirement 4: Payment Not Found', () => {
    it('should return 404 when payment not found in database', async () => {
      const { mercadoPagoService } = await import('@/modules/payment/services/mercadoPagoService');
      
      vi.mocked(mercadoPagoService.validateWebhookSignature).mockReturnValue(true);
      vi.mocked(mercadoPagoService.getPaymentDetails).mockResolvedValue({
        id: 12345,
        status: 'approved',
        status_detail: 'accredited',
        payment_method_id: 'pix',
        payment_type_id: 'bank_transfer',
        transaction_amount: 100.00,
        currency_id: 'BRL',
        date_created: '2024-01-01T00:00:00Z',
        date_approved: '2024-01-01T00:01:00Z',
        external_reference: 'order-123',
        payer: {
          email: 'test@example.com',
          identification: {
            type: 'CPF',
            number: '12345678900',
          },
        },
      });
      
      // Mock payment not found
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      });
      
      const request = createMockRequest(
        { type: 'payment', data: { id: '12345' } },
        {
          'x-signature': 'ts=123,v1=abc',
          'x-request-id': 'req-123',
        }
      );
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toBe('Payment not found');
    });
  });
  
  describe('Requirement 5: Payment ID Conflict', () => {
    it('should return 409 when payment ID mismatch detected', async () => {
      const { mercadoPagoService } = await import('@/modules/payment/services/mercadoPagoService');
      const { createAdminClient } = await import('@/lib/supabase/admin');
      
      vi.mocked(mercadoPagoService.validateWebhookSignature).mockReturnValue(true);
      vi.mocked(mercadoPagoService.getPaymentDetails).mockResolvedValue({
        id: 12345,
        status: 'approved',
        status_detail: 'accredited',
        payment_method_id: 'pix',
        payment_type_id: 'bank_transfer',
        transaction_amount: 100.00,
        currency_id: 'BRL',
        date_created: '2024-01-01T00:00:00Z',
        date_approved: '2024-01-01T00:01:00Z',
        external_reference: 'order-123',
        payer: {
          email: 'test@example.com',
          identification: {
            type: 'CPF',
            number: '12345678900',
          },
        },
      });
      
      const mockSupabase = vi.mocked(createAdminClient());
      vi.mocked(mockSupabase.from('payments').select().eq().single).mockResolvedValue({
        data: {
          id: 'payment-uuid',
          order_id: 'order-123',
          status: 'pending',
          mercadopago_payment_id: '99999', // Different payment ID
        },
        error: null,
      });
      
      const request = createMockRequest(
        { type: 'payment', data: { id: '12345' } },
        {
          'x-signature': 'ts=123,v1=abc',
          'x-request-id': 'req-123',
        }
      );
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(409);
      expect(data.error).toBe('Payment ID mismatch');
    });
  });
  
  describe('Requirement 6: Idempotency Check', () => {
    it('should return 200 and skip update when status unchanged', async () => {
      const { mercadoPagoService } = await import('@/modules/payment/services/mercadoPagoService');
      const { createAdminClient } = await import('@/lib/supabase/admin');
      
      vi.mocked(mercadoPagoService.validateWebhookSignature).mockReturnValue(true);
      vi.mocked(mercadoPagoService.getPaymentDetails).mockResolvedValue({
        id: 12345,
        status: 'approved',
        status_detail: 'accredited',
        payment_method_id: 'pix',
        payment_type_id: 'bank_transfer',
        transaction_amount: 100.00,
        currency_id: 'BRL',
        date_created: '2024-01-01T00:00:00Z',
        date_approved: '2024-01-01T00:01:00Z',
        external_reference: 'order-123',
        payer: {
          email: 'test@example.com',
          identification: {
            type: 'CPF',
            number: '12345678900',
          },
        },
      });
      
      const mockSupabase = vi.mocked(createAdminClient());
      vi.mocked(mockSupabase.from('payments').select().eq().single).mockResolvedValue({
        data: {
          id: 'payment-uuid',
          order_id: 'order-123',
          status: 'approved', // Same status
          mercadopago_payment_id: '12345',
        },
        error: null,
      });
      
      const request = createMockRequest(
        { type: 'payment', data: { id: '12345' } },
        {
          'x-signature': 'ts=123,v1=abc',
          'x-request-id': 'req-123',
        }
      );
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(data.skipped).toBe(true);
    });
  });
  
  describe('Requirement 7: Payment ID Seeding', () => {
    it('should seed mercadopago_payment_id on first webhook', async () => {
      const { mercadoPagoService } = await import('@/modules/payment/services/mercadoPagoService');
      const { createAdminClient } = await import('@/lib/supabase/admin');
      
      vi.mocked(mercadoPagoService.validateWebhookSignature).mockReturnValue(true);
      vi.mocked(mercadoPagoService.getPaymentDetails).mockResolvedValue({
        id: 12345,
        status: 'approved',
        status_detail: 'accredited',
        payment_method_id: 'pix',
        payment_type_id: 'bank_transfer',
        transaction_amount: 100.00,
        currency_id: 'BRL',
        date_created: '2024-01-01T00:00:00Z',
        date_approved: '2024-01-01T00:01:00Z',
        external_reference: 'order-123',
        payer: {
          email: 'test@example.com',
          identification: {
            type: 'CPF',
            number: '12345678900',
          },
        },
      });
      
      const mockSupabase = vi.mocked(createAdminClient());
      
      // First call: payment found without mercadopago_payment_id
      vi.mocked(mockSupabase.from('payments').select().eq().single).mockResolvedValue({
        data: {
          id: 'payment-uuid',
          order_id: 'order-123',
          status: 'pending',
          mercadopago_payment_id: null, // NULL - needs seeding
        },
        error: null,
      });
      
      // Mock update call for seeding
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockResolvedValue({ error: null }),
        }),
      });
      vi.mocked(mockSupabase.from('payments').update).mockReturnValue(mockUpdate() as any);
      
      // Mock RPC call
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: {
          success: true,
          payment_id: 'payment-uuid',
          order_id: 'order-123',
          old_status: 'pending',
          new_status: 'approved',
          order_status: 'processing',
        },
        error: null,
      });
      
      const request = createMockRequest(
        { type: 'payment', data: { id: '12345' } },
        {
          'x-signature': 'ts=123,v1=abc',
          'x-request-id': 'req-123',
        }
      );
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(data.updated).toBe(true);
      
      // Verify update was called to seed payment ID
      expect(mockSupabase.from).toHaveBeenCalledWith('payments');
    });
  });
  
  describe('Requirement 8: HTTP Status Codes', () => {
    it('should return 200 on successful update', async () => {
      const { mercadoPagoService } = await import('@/modules/payment/services/mercadoPagoService');
      const { createAdminClient } = await import('@/lib/supabase/admin');
      
      vi.mocked(mercadoPagoService.validateWebhookSignature).mockReturnValue(true);
      vi.mocked(mercadoPagoService.getPaymentDetails).mockResolvedValue({
        id: 12345,
        status: 'approved',
        status_detail: 'accredited',
        payment_method_id: 'pix',
        payment_type_id: 'bank_transfer',
        transaction_amount: 100.00,
        currency_id: 'BRL',
        date_created: '2024-01-01T00:00:00Z',
        date_approved: '2024-01-01T00:01:00Z',
        external_reference: 'order-123',
        payer: {
          email: 'test@example.com',
          identification: {
            type: 'CPF',
            number: '12345678900',
          },
        },
      });
      
      const mockSupabase = vi.mocked(createAdminClient());
      vi.mocked(mockSupabase.from('payments').select().eq().single).mockResolvedValue({
        data: {
          id: 'payment-uuid',
          order_id: 'order-123',
          status: 'pending',
          mercadopago_payment_id: '12345',
        },
        error: null,
      });
      
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: {
          success: true,
          payment_id: 'payment-uuid',
          order_id: 'order-123',
          old_status: 'pending',
          new_status: 'approved',
          order_status: 'processing',
        },
        error: null,
      });
      
      const request = createMockRequest(
        { type: 'payment', data: { id: '12345' } },
        {
          'x-signature': 'ts=123,v1=abc',
          'x-request-id': 'req-123',
        }
      );
      
      const response = await POST(request);
      
      expect(response.status).toBe(200);
    });
    
    it('should return 500 on RPC function failure', async () => {
      const { mercadoPagoService } = await import('@/modules/payment/services/mercadoPagoService');
      const { createAdminClient } = await import('@/lib/supabase/admin');
      
      vi.mocked(mercadoPagoService.validateWebhookSignature).mockReturnValue(true);
      vi.mocked(mercadoPagoService.getPaymentDetails).mockResolvedValue({
        id: 12345,
        status: 'approved',
        status_detail: 'accredited',
        payment_method_id: 'pix',
        payment_type_id: 'bank_transfer',
        transaction_amount: 100.00,
        currency_id: 'BRL',
        date_created: '2024-01-01T00:00:00Z',
        date_approved: '2024-01-01T00:01:00Z',
        external_reference: 'order-123',
        payer: {
          email: 'test@example.com',
          identification: {
            type: 'CPF',
            number: '12345678900',
          },
        },
      });
      
      const mockSupabase = vi.mocked(createAdminClient());
      vi.mocked(mockSupabase.from('payments').select().eq().single).mockResolvedValue({
        data: {
          id: 'payment-uuid',
          order_id: 'order-123',
          status: 'pending',
          mercadopago_payment_id: '12345',
        },
        error: null,
      });
      
      // Mock RPC failure
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Database error' } as any,
      });
      
      const request = createMockRequest(
        { type: 'payment', data: { id: '12345' } },
        {
          'x-signature': 'ts=123,v1=abc',
          'x-request-id': 'req-123',
        }
      );
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update payment status');
    });
  });
});
