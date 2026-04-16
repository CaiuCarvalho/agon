/**
 * Mercado Pago Service
 * 
 * Handles all Mercado Pago SDK operations:
 * - Create payment preferences
 * - Fetch payment details
 * - Validate webhook signatures
 * - Build preference requests
 */

import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import crypto from 'crypto';
import { z } from 'zod';
import type { PreferenceRequest, PreferenceResponse, MercadoPagoPayment } from '../types';

const preferenceItemSchema = z.object({
  productName: z.string().min(1),
  quantity: z.number().int().positive(),
  productPrice: z.number().positive(),
});

// Initialize SDK (singleton)
let mercadoPagoClient: MercadoPagoConfig | null = null;

function getMercadoPagoClient(): MercadoPagoConfig {
  if (!mercadoPagoClient) {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN is not configured');
    }
    
    if (!accessToken.startsWith('APP_USR-')) {
      throw new Error('Invalid MERCADOPAGO_ACCESS_TOKEN format');
    }
    
    mercadoPagoClient = new MercadoPagoConfig({
      accessToken,
      options: { 
        timeout: 25000, // 25s timeout - provides 35s margin before Next.js 60s limit to handle retries and error processing
      },
    });
  }
  
  return mercadoPagoClient;
}

export const mercadoPagoService = {
  /**
   * Create payment preference with retry logic
   */
  async createPreference(request: PreferenceRequest): Promise<PreferenceResponse> {
    const client = getMercadoPagoClient();
    
    try {
      const preference = new Preference(client);
      
      // Attempt to create preference with retry logic
      const response = await this._createPreferenceWithRetry(preference, request);
      
      return {
        id: response.id!,
        init_point: response.init_point!,
        sandbox_init_point: response.sandbox_init_point!,
        date_created: response.date_created!,
        external_reference: response.external_reference!,
      };
    } catch (error: any) {
      console.error('Mercado Pago SDK error:', {
        message: error.message,
        status: error.status,
        code: error.code,
        cause: error.cause,
        response: error.response?.data,
      });
      
      // Enhance error message with more details
      const errorDetails = [];
      if (error.status) errorDetails.push(`status: ${error.status}`);
      if (error.code) errorDetails.push(`code: ${error.code}`);
      if (error.response?.data?.message) errorDetails.push(`message: ${error.response.data.message}`);
      
      const detailsStr = errorDetails.length > 0 ? ` (${errorDetails.join(', ')})` : '';
      const enhancedError = new Error(`Failed to create payment preference: ${error.message}${detailsStr}`);
      
      // Preserve error code for timeout detection in route handler
      if (error.code) {
        (enhancedError as any).code = error.code;
      }
      
      throw enhancedError;
    }
  },
  
  /**
   * Internal: Create preference with retry logic for transient failures
   */
  async _createPreferenceWithRetry(preference: any, request: PreferenceRequest, attempt: number = 1): Promise<any> {
    const maxAttempts = 2;
    const retryDelay = 2000; // 2 seconds
    
    try {
      return await preference.create({ body: request });
    } catch (error: any) {
      // Check if error is retryable (timeout or network error)
      const isRetryable = 
        error.code === 'ETIMEDOUT' ||
        error.code === 'ESOCKETTIMEDOUT' ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ECONNRESET' ||
        error.code === 'ENETUNREACH' ||
        error.message?.toLowerCase().includes('timeout') ||
        error.message?.toLowerCase().includes('network');
      
      // Retry if this is a retryable error and we haven't exceeded max attempts
      if (isRetryable && attempt < maxAttempts) {
        console.warn(`Mercado Pago request failed (attempt ${attempt}/${maxAttempts}), retrying in ${retryDelay}ms...`, {
          error: error.message,
          code: error.code,
        });
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        // Retry with incremented attempt counter
        return this._createPreferenceWithRetry(preference, request, attempt + 1);
      }
      
      // Not retryable or max attempts exceeded - throw error
      throw error;
    }
  },
  
  /**
   * Get payment details by payment ID
   */
  async getPaymentDetails(paymentId: string): Promise<MercadoPagoPayment> {
    const client = getMercadoPagoClient();
    
    try {
      const payment = new Payment(client);
      const response = await payment.get({ id: paymentId });
      
      return {
        id: response.id!,
        status: response.status!,
        status_detail: response.status_detail!,
        payment_method_id: response.payment_method_id!,
        payment_type_id: response.payment_type_id!,
        transaction_amount: response.transaction_amount!,
        currency_id: response.currency_id!,
        date_created: response.date_created!,
        date_approved: response.date_approved || null,
        external_reference: response.external_reference!,
        payer: {
          email: response.payer?.email!,
          identification: {
            type: response.payer?.identification?.type!,
            number: response.payer?.identification?.number!,
          },
        },
      };
    } catch (error: any) {
      console.error('Failed to fetch payment details:', error);
      throw new Error(`Failed to fetch payment details: ${error.message}`);
    }
  },
  
  /**
   * Validate webhook signature using HMAC-SHA256
   * 
   * Mercado Pago sends signature in x-signature header:
   * ts=1234567890,v1=abc123def456...
   * 
   * Manifest format: id:{data.id};request-id:{x-request-id};ts:{ts};
   */
  validateWebhookSignature(
    signature: string,
    requestId: string,
    dataId: string
  ): boolean {
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      throw new Error('MERCADOPAGO_WEBHOOK_SECRET is not configured');
    }
    
    try {
      // Parse signature header: ts=1234567890,v1=abc123...
      const parts = signature.split(',');
      const tsMatch = parts.find((p) => p.startsWith('ts='));
      const v1Match = parts.find((p) => p.startsWith('v1='));
      
      if (!tsMatch || !v1Match) {
        console.error('Invalid signature format');
        return false;
      }
      
      const ts = tsMatch.split('=')[1];
      const receivedHash = v1Match.split('=')[1];
      
      // Construct manifest: id:{data.id};request-id:{x-request-id};ts:{ts};
      const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
      
      // Compute HMAC-SHA256
      const computedHash = crypto
        .createHmac('sha256', webhookSecret)
        .update(manifest)
        .digest('hex');
      
      // Compare hashes (constant-time comparison)
      const receivedBuffer = Buffer.from(receivedHash, 'hex');
      const computedBuffer = Buffer.from(computedHash, 'hex');
      
      return crypto.timingSafeEqual(
        new Uint8Array(receivedBuffer),
        new Uint8Array(computedBuffer)
      );
    } catch (error) {
      console.error('Signature validation error:', error);
      return false;
    }
  },
  
  /**
   * Build preference request from order data
   */
  buildPreferenceRequest(
    orderId: string,
    items: Array<{ productName: string; quantity: number; productPrice: number }>,
    shippingInfo: {
      shippingName: string;
      shippingEmail: string;
      shippingPhone: string;
    }
  ): PreferenceRequest {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL is not configured');
    }

    // Validate items before building the request
    const validatedItems = items.map((item, i) => {
      const result = preferenceItemSchema.safeParse(item);
      if (!result.success) {
        throw new Error(`Item inválido na posição ${i}: ${result.error.message}`);
      }
      return result.data;
    });

    // Parse phone: (XX) XXXXX-XXXX -> area_code: XX, number: XXXXXXXXX
    const phoneMatch = shippingInfo.shippingPhone.match(/\((\d{2})\) (\d{4,5})-(\d{4})/);
    if (!phoneMatch) {
      throw new Error(`Invalid phone format: expected "(XX) XXXXX-XXXX", received "${shippingInfo.shippingPhone}"`);
    }
    const areaCode = phoneMatch[1];
    const phoneNumber = `${phoneMatch[2]}${phoneMatch[3]}`;
    
    return {
      items: validatedItems.map((item, index) => ({
        id: `item-${index + 1}`,
        title: item.productName,
        quantity: item.quantity,
        unit_price: item.productPrice,
        currency_id: 'BRL',
      })),
      payer: {
        email: shippingInfo.shippingEmail,
        name: shippingInfo.shippingName,
        phone: {
          area_code: areaCode,
          number: phoneNumber,
        },
      },
      back_urls: {
        success: `${appUrl}/pedido/confirmado?order_id=${orderId}`,
        failure: `${appUrl}/pedido/falha?order_id=${orderId}`,
        pending: `${appUrl}/pedido/pendente?order_id=${orderId}`,
      },
      auto_return: 'approved', // Auto-redirect to success page after credit card payment approval
      external_reference: orderId,
      notification_url: `${appUrl}/api/webhooks/mercadopago`,
      statement_descriptor: 'AGON MVP',
      payment_methods: {
        excluded_payment_types: [{ id: 'ticket' }], // Desabilita boleto bancário
        installments: 12, // Max installments for credit card
      },
    };
  },
};
