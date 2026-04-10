/**
 * API Route: Mercado Pago Webhook
 * 
 * POST /api/webhooks/mercadopago
 * 
 * Receives payment notifications from Mercado Pago and updates order status
 */

import { NextRequest, NextResponse } from 'next/server';
import { mercadoPagoService } from '@/modules/payment/services/mercadoPagoService';
import { paymentService } from '@/modules/payment/services/paymentService';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Extract headers
    const signature = request.headers.get('x-signature');
    const requestId = request.headers.get('x-request-id');
    const correlationId = requestId; // Use request ID as correlation ID for tracing
    
    if (!signature || !requestId) {
      console.error('[Webhook] Missing required headers', { correlationId });
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      );
    }
    
    // 2. Parse body
    const body = await request.json();
    const { data, type } = body;
    
    // Log webhook received with correlation ID
    console.log('[Webhook] Received:', {
      type,
      dataId: data?.id,
      requestId,
      correlationId,
      timestamp: new Date().toISOString(),
    });
    
    // 3. Ignore non-payment notifications
    if (type !== 'payment') {
      console.log('[Webhook] Ignoring non-payment notification:', { type, correlationId });
      return NextResponse.json({ received: true }, { status: 200 });
    }
    
    const paymentId = data?.id;
    if (!paymentId) {
      console.error('[Webhook] Missing payment ID', { correlationId });
      return NextResponse.json(
        { error: 'Missing payment ID' },
        { status: 400 }
      );
    }
    
    // 4. Validate signature
    let isValidSignature = false;
    try {
      isValidSignature = mercadoPagoService.validateWebhookSignature(
        signature,
        requestId,
        paymentId
      );
    } catch (error) {
      console.error('[Webhook] Signature validation error:', { error, correlationId });
      return NextResponse.json(
        { error: 'Signature validation failed' },
        { status: 401 }
      );
    }
    
    if (!isValidSignature) {
      console.error('[Webhook] Invalid signature', { correlationId });
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    console.log('[Webhook] Signature validated', { correlationId });
    
    // 5. Fetch payment details from Mercado Pago
    let paymentDetails;
    try {
      paymentDetails = await mercadoPagoService.getPaymentDetails(paymentId);
    } catch (error: any) {
      console.error('[Webhook] Failed to fetch payment details:', { error, correlationId });
      return NextResponse.json(
        { error: 'Failed to fetch payment details' },
        { status: 500 }
      );
    }
    
    console.log('[Webhook] Payment details fetched:', {
      paymentId: paymentDetails.id,
      status: paymentDetails.status,
      paymentMethod: paymentDetails.payment_method_id,
      externalReference: paymentDetails.external_reference,
      correlationId,
    });
    
    // 6. Find payment in database by external_reference (order_id)
    const supabase = await createClient();
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, order_id, status')
      .eq('order_id', paymentDetails.external_reference)
      .single();
    
    if (paymentError || !payment) {
      console.error('[Webhook] Payment not found in database:', {
        externalReference: paymentDetails.external_reference,
        correlationId,
      });
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }
    
    // 7. Check if already processed (idempotency)
    if (payment.status === paymentDetails.status) {
      console.log('[Webhook] Idempotency check: Status unchanged, skipping update', {
        paymentId: payment.id,
        orderId: payment.order_id,
        status: payment.status,
        action: 'skipped',
        correlationId,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json({ received: true, skipped: true }, { status: 200 });
    }
    
    // 8. Update payment status via RPC function
    try {
      const result = await paymentService.updatePaymentFromWebhook(
        paymentDetails.id.toString(),
        paymentDetails.status as any,
        paymentDetails.payment_method_id
      );
      
      console.log('[Webhook] Payment status updated:', {
        paymentId: result.paymentId,
        orderId: result.orderId,
        oldStatus: result.oldStatus,
        newStatus: result.newStatus,
        orderStatus: result.orderStatus,
        action: 'updated',
        correlationId,
        timestamp: new Date().toISOString(),
      });
      
      return NextResponse.json(
        { received: true, updated: true },
        { status: 200 }
      );
      
    } catch (error: any) {
      console.error('[Webhook] Failed to update payment status:', {
        error,
        paymentId: payment.id,
        orderId: payment.order_id,
        correlationId,
      });
      
      // Return 500 so Mercado Pago retries
      return NextResponse.json(
        { error: 'Failed to update payment status' },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('[Webhook] Unexpected error:', error);
    
    // Return 500 so Mercado Pago retries
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Allow only POST method
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
