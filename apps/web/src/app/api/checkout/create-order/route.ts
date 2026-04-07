/**
 * API Route: Create Order with Mercado Pago Payment
 * 
 * POST /api/checkout/create-order
 * 
 * Creates an order with payment atomically and generates Mercado Pago preference
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mercadoPagoService } from '@/modules/payment/services/mercadoPagoService';
import { shippingFormSchema } from '@/modules/payment/contracts';
import type { CreateOrderWithPaymentResponse } from '@/modules/payment/types';

export async function POST(request: NextRequest) {
  console.log('========================================');
  console.log('[CHECKOUT] POST /api/checkout/create-order - START');
  console.log('========================================');
  
  try {
    // Environment validation (helps debug 502 errors in production)
    console.log('[CHECKOUT] Step 1: Validating environment variables...');
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      console.error('[CRITICAL] MERCADOPAGO_ACCESS_TOKEN not configured');
      return NextResponse.json(
        { success: false, error: 'Configuração de pagamento ausente' },
        { status: 500 }
      );
    }
    console.log('[CHECKOUT] ✓ MERCADOPAGO_ACCESS_TOKEN configured');
    
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error('[CRITICAL] NEXT_PUBLIC_APP_URL not configured');
      return NextResponse.json(
        { success: false, error: 'Configuração de URL ausente' },
        { status: 500 }
      );
    }
    console.log('[CHECKOUT] ✓ NEXT_PUBLIC_APP_URL configured:', process.env.NEXT_PUBLIC_APP_URL);
    
    // 1. Authenticate user
    console.log('[CHECKOUT] Step 2: Authenticating user...');
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[CHECKOUT] ✗ Authentication failed:', authError);
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }
    console.log('[CHECKOUT] ✓ User authenticated:', user.id);
    
    // 2. Parse and validate request body
    console.log('[CHECKOUT] Step 3: Parsing request body...');
    const body = await request.json();
    console.log('[CHECKOUT] ✓ Body parsed');
    const { shippingInfo } = body;
    
    // Validate shipping info
    console.log('[CHECKOUT] Step 4: Validating shipping info...');
    const validationResult = shippingFormSchema.safeParse(shippingInfo);
    if (!validationResult.success) {
      console.error('[CHECKOUT] ✗ Validation failed:', validationResult.error.errors);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dados de entrega inválidos',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }
    console.log('[CHECKOUT] ✓ Shipping info validated');
    
    const validatedShipping = validationResult.data;
    
    // 3. Create order with payment atomically (without preference_id yet)
    console.log('[CHECKOUT] Step 5: Creating order in database...');
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'create_order_with_payment_atomic',
      {
        p_user_id: user.id,
        p_shipping_name: validatedShipping.shippingName,
        p_shipping_address: validatedShipping.shippingAddress,
        p_shipping_city: validatedShipping.shippingCity,
        p_shipping_state: validatedShipping.shippingState,
        p_shipping_zip: validatedShipping.shippingZip,
        p_shipping_phone: validatedShipping.shippingPhone,
        p_shipping_email: validatedShipping.shippingEmail,
        p_payment_method: 'mercadopago_credit_card',
        p_mercadopago_preference_id: 'temp', // Temporary, will be updated
      }
    );
    
    if (rpcError) {
      console.error('[CHECKOUT] ✗ RPC error:', rpcError);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar pedido' },
        { status: 500 }
      );
    }
    console.log('[CHECKOUT] ✓ Order created in database');
    
    const orderResult = rpcResult as any;
    
    if (!orderResult.success) {
      console.error('[CHECKOUT] ✗ Order creation failed:', orderResult.error);
      return NextResponse.json(
        { success: false, error: orderResult.error },
        { status: 400 }
      );
    }
    console.log('[CHECKOUT] ✓ Order ID:', orderResult.order_id);
    
    // 4. Fetch order items for Mercado Pago preference
    console.log('[CHECKOUT] Step 6: Fetching order items...');
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_name, quantity, product_price')
      .eq('order_id', orderResult.order_id);
    
    if (itemsError || !orderItems) {
      console.error('[CHECKOUT] ✗ Failed to fetch order items:', itemsError);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar itens do pedido' },
        { status: 500 }
      );
    }
    console.log('[CHECKOUT] ✓ Order items fetched:', orderItems.length, 'items');
    
    // 5. Build preference request
    console.log('[CHECKOUT] Step 7: Building Mercado Pago preference request...');
    const preferenceRequest = mercadoPagoService.buildPreferenceRequest(
      orderResult.order_id,
      orderItems.map((item: any) => ({
        productName: item.product_name,
        quantity: item.quantity,
        productPrice: parseFloat(item.product_price),
      })),
      {
        shippingName: validatedShipping.shippingName,
        shippingEmail: validatedShipping.shippingEmail,
        shippingPhone: validatedShipping.shippingPhone,
      }
    );
    console.log('[CHECKOUT] ✓ Preference request built');
    
    // 6. Create Mercado Pago preference
    console.log('[CHECKOUT] Step 8: Creating Mercado Pago preference...');
    let preference;
    try {
      const startTime = Date.now();
      console.log('Creating Mercado Pago preference...', {
        orderId: orderResult.order_id,
        itemCount: orderItems.length,
        totalAmount: orderResult.total_amount,
        timestamp: new Date().toISOString(),
      });
      
      preference = await mercadoPagoService.createPreference(preferenceRequest);
      
      const duration = Date.now() - startTime;
      console.log('Preference created successfully:', {
        preferenceId: preference.id,
        initPoint: preference.init_point,
        duration: `${duration}ms`,
      });
    } catch (mpError: any) {
      console.error('[CHECKOUT] ✗ Mercado Pago error:', mpError);
      console.error('[CHECKOUT] Error details:', {
        message: mpError.message,
        stack: mpError.stack,
        cause: mpError.cause,
        code: mpError.code,
        status: mpError.status,
        errno: mpError.errno,
      });
      
      console.log('[CHECKOUT] Step 9: Rolling back order...');
      // Rollback: delete order and payment
      await supabase.from('payments').delete().eq('id', orderResult.payment_id);
      await supabase.from('order_items').delete().eq('order_id', orderResult.order_id);
      await supabase.from('orders').delete().eq('id', orderResult.order_id);
      console.log('[CHECKOUT] ✓ Order rolled back');
      
      // Determine appropriate error status based on error type
      let errorStatus = 500;
      let errorMessage = 'Erro ao criar preferência de pagamento';
      
      // Check for timeout errors
      if (
        mpError.code === 'ETIMEDOUT' ||
        mpError.code === 'ESOCKETTIMEDOUT' ||
        mpError.message?.toLowerCase().includes('timeout') ||
        mpError.message?.toLowerCase().includes('timed out')
      ) {
        errorStatus = 504; // Gateway Timeout
        errorMessage = 'Timeout ao conectar com o serviço de pagamento. Por favor, tente novamente.';
        console.error('Timeout error detected - returning 504');
      }
      // Check for network errors
      else if (
        mpError.code === 'ECONNREFUSED' ||
        mpError.code === 'ENOTFOUND' ||
        mpError.code === 'ECONNRESET' ||
        mpError.code === 'ENETUNREACH' ||
        mpError.message?.toLowerCase().includes('network') ||
        mpError.message?.toLowerCase().includes('connect')
      ) {
        errorStatus = 503; // Service Unavailable
        errorMessage = 'Serviço de pagamento temporariamente indisponível. Por favor, tente novamente em alguns instantes.';
        console.error('Network error detected - returning 503');
      }
      // Check for API errors with status codes
      else if (mpError.status) {
        errorStatus = mpError.status >= 500 ? 500 : mpError.status;
        errorMessage = `Erro no serviço de pagamento: ${mpError.message}`;
        console.error(`API error with status ${mpError.status} - returning ${errorStatus}`);
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          details: mpError.message,
        },
        { status: errorStatus }
      );
    }
    
    // 7. Update payment with preference_id
    const { error: updateError } = await supabase
      .from('payments')
      .update({ mercadopago_preference_id: preference.id })
      .eq('id', orderResult.payment_id);
    
    if (updateError) {
      console.error('Failed to update payment with preference_id:', updateError);
      // Continue anyway, preference was created
    }
    
    // 8. Return success with init_point
    const response: CreateOrderWithPaymentResponse = {
      success: true,
      orderId: orderResult.order_id,
      paymentId: orderResult.payment_id,
      preferenceId: preference.id,
      initPoint: preference.init_point,
      totalAmount: orderResult.total_amount,
      itemCount: orderResult.item_count,
    };
    
    console.log('[CHECKOUT] ✓ Order created successfully:', {
      orderId: response.orderId,
      preferenceId: response.preferenceId,
      totalAmount: response.totalAmount,
    });
    console.log('========================================');
    console.log('[CHECKOUT] POST /api/checkout/create-order - SUCCESS');
    console.log('========================================');
    
    return NextResponse.json(response, { status: 200 });
    
  } catch (error: any) {
    console.error('========================================');
    console.error('[CHECKOUT] ✗ Unexpected error in create-order:', error);
    console.error('[CHECKOUT] Error stack:', error.stack);
    console.error('========================================');
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
