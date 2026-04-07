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
    
    if (!signature || !requestId) {
      console.error('Missing required headers');
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      );
    }
    
    // 2. Parse body
    const body = await request.json();
    const { data, type } = body;
    
    // Log webhook received
    console.log('Webhook received:', {
      type,
      dataId: data?.id,
      requestId,
      timestamp: new Date().toISOString(),
    });
    
    // 3. Ignore non-payment notifications
    if (type !== 'payment') {
      console.log('Ignoring non-payment notification:', type);
      return NextResponse.json({ received: true }, { status: 200 });
    }
    
    const paymentId = data?.id;
    if (!paymentId) {
      console.error('Missing payment ID in webhook data');
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
      console.error('Signature validation error:', error);
      return NextResponse.json(
        { error: 'Signature validation failed' },
        { status: 401 }
      );
    }
    
    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    console.log('Webhook signature validated successfully');
    
    // 5. Fetch payment details from Mercado Pago
    let paymentDetails;
    try {
      paymentDetails = await mercadoPagoService.getPaymentDetails(paymentId);
    } catch (error: any) {
      console.error('Failed to fetch payment details:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payment details' },
        { status: 500 }
      );
    }
    
    console.log('Payment details fetched:', {
      paymentId: paymentDetails.id,
      status: paymentDetails.status,
      paymentMethod: paymentDetails.payment_method_id,
      externalReference: paymentDetails.external_reference,
    });
    
    // 6. Find payment in database by external_reference (order_id)
    const supabase = await createClient();
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, order_id, status')
      .eq('order_id', paymentDetails.external_reference)
      .single();
    
    if (paymentError || !payment) {
      console.error('Payment not found in database:', paymentDetails.external_reference);
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }
    
    // 7. Check if already processed (idempotency)
    if (payment.status === paymentDetails.status) {
      console.log('Payment already processed with same status, skipping update');
      return NextResponse.json({ received: true, skipped: true }, { status: 200 });
    }
    
    // 8. Update payment status via RPC function
    try {
      const result = await paymentService.updatePaymentFromWebhook(
        paymentDetails.id.toString(),
        paymentDetails.status as any,
        paymentDetails.payment_method_id
      );
      
      console.log('Payment status updated:', {
        paymentId: result.paymentId,
        orderId: result.orderId,
        oldStatus: result.oldStatus,
        newStatus: result.newStatus,
        orderStatus: result.orderStatus,
      });
      
      return NextResponse.json(
        { received: true, updated: true },
        { status: 200 }
      );
      
    } catch (error: any) {
      console.error('Failed to update payment status:', error);
      
      // Return 500 so Mercado Pago retries
      return NextResponse.json(
        { error: 'Failed to update payment status' },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('Unexpected error in webhook:', error);
    
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
