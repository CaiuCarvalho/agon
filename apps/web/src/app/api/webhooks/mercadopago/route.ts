/**
 * API Route: Mercado Pago Webhook
 * 
 * POST /api/webhooks/mercadopago
 * 
 * Receives payment notifications from Mercado Pago and updates order status
 */

import { NextRequest, NextResponse } from 'next/server';
import { mercadoPagoService } from '@/modules/payment/services/mercadoPagoService';
import { createAdminClient } from '@/lib/supabase/admin';

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
    const supabase = createAdminClient();
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, order_id, status, mercadopago_payment_id')
      .eq('order_id', paymentDetails.external_reference)
      .single();
    
    if (paymentError || !payment) {
      console.error('[Webhook] Payment not found in database:', {
        externalReference: paymentDetails.external_reference,
        error: paymentError,
        correlationId,
      });
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }
    
    console.log('[Webhook] Payment found in database:', {
      paymentId: payment.id,
      orderId: payment.order_id,
      currentStatus: payment.status,
      storedMercadopagoPaymentId: payment.mercadopago_payment_id,
      correlationId,
    });
    
    const mercadopagoPaymentId = paymentDetails.id.toString();

    // 7. Check for payment ID conflict (409 Conflict)
    if (
      payment.mercadopago_payment_id &&
      payment.mercadopago_payment_id !== mercadopagoPaymentId
    ) {
      console.error('[Webhook] Payment ID mismatch - conflict detected:', {
        orderId: payment.order_id,
        storedPaymentId: payment.mercadopago_payment_id,
        incomingPaymentId: mercadopagoPaymentId,
        correlationId,
      });
      return NextResponse.json(
        { error: 'Payment ID mismatch' },
        { status: 409 }
      );
    }

    // 8. Seed mercadopago_payment_id on first webhook (if NULL)
    if (!payment.mercadopago_payment_id) {
      console.log('[Webhook] Seeding Mercado Pago payment ID (first webhook):', {
        paymentId: payment.id,
        orderId: payment.order_id,
        mercadopagoPaymentId,
        correlationId,
      });
      
      const { error: seedPaymentIdError } = await supabase
        .from('payments')
        .update({ mercadopago_payment_id: mercadopagoPaymentId })
        .eq('id', payment.id)
        .is('mercadopago_payment_id', null);

      if (seedPaymentIdError) {
        console.error('[Webhook] Failed to seed Mercado Pago payment ID:', {
          error: seedPaymentIdError,
          paymentId: payment.id,
          correlationId,
        });
        return NextResponse.json(
          { error: 'Failed to initialize payment mapping' },
          { status: 500 }
        );
      }
      
      console.log('[Webhook] Successfully seeded Mercado Pago payment ID:', {
        paymentId: payment.id,
        mercadopagoPaymentId,
        correlationId,
      });
    }

    // 9. idempotency check: compare current status with new status
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
    
    console.log('[Webhook] Status change detected, proceeding with update:', {
      paymentId: payment.id,
      orderId: payment.order_id,
      oldStatus: payment.status,
      newStatus: paymentDetails.status,
      correlationId,
    });
    
    // 10. Update payment status via RPC function
    console.log('[Webhook] Calling RPC function to update payment and order:', {
      mercadopagoPaymentId,
      newStatus: paymentDetails.status,
      paymentMethod: paymentDetails.payment_method_id,
      correlationId,
    });
    
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'update_payment_from_webhook',
        {
          p_mercadopago_payment_id: mercadopagoPaymentId,
          p_status: paymentDetails.status,
          p_payment_method: paymentDetails.payment_method_id,
        }
      );

      if (rpcError) {
        console.error('[Webhook] RPC function returned error:', {
          error: rpcError,
          correlationId,
        });
        throw rpcError;
      }

      const result = rpcResult as any;
      if (!result?.success) {
        console.error('[Webhook] RPC function failed:', {
          error: result?.error || 'Unknown error',
          correlationId,
        });
        throw new Error(result?.error || 'Webhook RPC failed');
      }
      
      console.log('[Webhook] Payment status updated successfully:', {
        paymentId: result.payment_id ?? result.paymentId,
        orderId: result.order_id ?? result.orderId,
        oldStatus: result.old_payment_status ?? result.oldStatus ?? result.old_status,
        newStatus: result.new_payment_status ?? result.newStatus ?? result.new_status,
        orderStatus: result.order_status ?? result.orderStatus,
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
        error: error.message,
        stack: error.stack,
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
