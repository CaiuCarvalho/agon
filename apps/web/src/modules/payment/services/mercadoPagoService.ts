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
import type { PreferenceRequest, PreferenceResponse, MercadoPagoPayment } from '../types';

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
      options: { timeout: 5000 },
    });
  }
  
  return mercadoPagoClient;
}

export const mercadoPagoService = {
  /**
   * Create payment preference
   */
  async createPreference(request: PreferenceRequest): Promise<PreferenceResponse> {
    const client = getMercadoPagoClient();
    
    try {
      console.log('Mercado Pago SDK: Creating preference with request:', {
        itemsCount: request.items.length,
        totalAmount: request.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0),
        payerEmail: request.payer.email,
        externalReference: request.external_reference,
      });
      
      const preference = new Preference(client);
      
      const response = await preference.create({
        body: request,
      });
      
      console.log('Mercado Pago SDK: Preference created:', {
        id: response.id,
        initPoint: response.init_point,
      });
      
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
        cause: error.cause,
        response: error.response,
      });
      throw new Error(`Failed to create payment preference: ${error.message}`);
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
      return crypto.timingSafeEqual(
        Buffer.from(receivedHash, 'hex'),
        Buffer.from(computedHash, 'hex')
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
    
    // Parse phone: (XX) XXXXX-XXXX -> area_code: XX, number: XXXXXXXXX
    const phoneMatch = shippingInfo.shippingPhone.match(/\((\d{2})\) (\d{4,5})-(\d{4})/);
    const areaCode = phoneMatch?.[1] || '';
    const phoneNumber = phoneMatch ? `${phoneMatch[2]}${phoneMatch[3]}` : '';
    
    return {
      items: items.map((item) => ({
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
      external_reference: orderId,
      notification_url: `${appUrl}/api/webhooks/mercadopago`,
      statement_descriptor: 'AGON MVP',
      payment_methods: {
        excluded_payment_types: [], // Allow all payment methods
        installments: 12, // Allow up to 12 installments
      },
    };
  },
};
