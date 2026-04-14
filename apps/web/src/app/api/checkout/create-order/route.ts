/**
 * API Route: Create Order with Mercado Pago Payment
 * 
 * POST /api/checkout/create-order
 * 
 * Creates an order with payment atomically and generates Mercado Pago preference
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { mercadoPagoService } from '@/modules/payment/services/mercadoPagoService';
import { shippingFormSchema } from '@/modules/payment/contracts';
import type { CreateOrderWithPaymentResponse } from '@/modules/payment/types';
import { createOrderFromCart } from '@/modules/checkout/services/createOrderFromCart';

export async function POST(request: NextRequest) {
  console.log('========================================');
  console.log('[CHECKOUT] POST /api/checkout/create-order - START');
  console.log('========================================');
  
  try {
    // Environment validation (helps debug 502 errors in production)
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [CHECKOUT] Step 1: Validating environment variables...`);
    
    // Detailed validation with production diagnosis logging
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      const errorTimestamp = new Date().toISOString();
      console.error(`[${errorTimestamp}] [CRITICAL] MERCADOPAGO_ACCESS_TOKEN not configured`);
      console.error(`[${errorTimestamp}] [DIAGNOSIS] Environment: ${process.env.NODE_ENV}`);
      console.error(`[${errorTimestamp}] [DIAGNOSIS] Available env vars: ${Object.keys(process.env).filter(k => k.startsWith('MERCADOPAGO') || k.startsWith('NEXT_PUBLIC')).join(', ') || 'none'}`);
      return NextResponse.json(
        { success: false, error: 'Configuração de pagamento ausente' },
        { status: 500 }
      );
    }
    console.log(`[${timestamp}] [CHECKOUT] ✓ MERCADOPAGO_ACCESS_TOKEN configured`);
    
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      const errorTimestamp = new Date().toISOString();
      console.error(`[${errorTimestamp}] [CRITICAL] NEXT_PUBLIC_APP_URL not configured`);
      console.error(`[${errorTimestamp}] [DIAGNOSIS] Environment: ${process.env.NODE_ENV}`);
      console.error(`[${errorTimestamp}] [DIAGNOSIS] Available env vars: ${Object.keys(process.env).filter(k => k.startsWith('MERCADOPAGO') || k.startsWith('NEXT_PUBLIC')).join(', ') || 'none'}`);
      return NextResponse.json(
        { success: false, error: 'Configuração de URL ausente' },
        { status: 500 }
      );
    }
    console.log(`[${timestamp}] [CHECKOUT] ✓ NEXT_PUBLIC_APP_URL configured: ${process.env.NEXT_PUBLIC_APP_URL}`);
    
    // 1. Authenticate user
    const authTimestamp = new Date().toISOString();
    console.log(`[${authTimestamp}] [CHECKOUT] Step 2: Authenticating user...`);
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      const errorTimestamp = new Date().toISOString();
      console.error(`[${errorTimestamp}] [CHECKOUT] ✗ Authentication failed:`, authError);
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }
    console.log(`[${authTimestamp}] [CHECKOUT] ✓ User authenticated: ${user.id}`);
    
    // 2. Parse and validate request body
    const parseTimestamp = new Date().toISOString();
    console.log(`[${parseTimestamp}] [CHECKOUT] Step 3: Parsing request body...`);
    const body = await request.json();
    console.log(`[${parseTimestamp}] [CHECKOUT] ✓ Body parsed`);
    const { shippingInfo } = body;
    
    // Validate shipping info
    const validateTimestamp = new Date().toISOString();
    console.log(`[${validateTimestamp}] [CHECKOUT] Step 4: Validating shipping info...`);
    const validationResult = shippingFormSchema.safeParse(shippingInfo);
    if (!validationResult.success) {
      const errorTimestamp = new Date().toISOString();
      console.error(`[${errorTimestamp}] [CHECKOUT] ✗ Validation failed:`, validationResult.error.errors);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dados de entrega inválidos',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }
    console.log(`[${validateTimestamp}] [CHECKOUT] ✓ Shipping info validated`);
    
    const validatedShipping = validationResult.data;
    
    // 3. Create order with payment atomically (without preference_id yet)
    const orderTimestamp = new Date().toISOString();
    console.log(`[${orderTimestamp}] [CHECKOUT] Step 5: Creating order in database...`);
    const orderResult: any = await createOrderFromCart({
      supabase,
      userId: user.id,
      shipping: {
        shippingName: validatedShipping.shippingName,
        shippingAddress: validatedShipping.shippingAddress,
        shippingCity: validatedShipping.shippingCity,
        shippingState: validatedShipping.shippingState,
        shippingZip: validatedShipping.shippingZip,
        shippingPhone: validatedShipping.shippingPhone,
        shippingEmail: validatedShipping.shippingEmail,
      },
    });
    const rpcError = false;
    
    if (rpcError) {
      const errorTimestamp = new Date().toISOString();
      console.error(`[${errorTimestamp}] [CHECKOUT] ✗ RPC error:`, rpcError);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar pedido' },
        { status: 500 }
      );
    }
    console.log(`[${orderTimestamp}] [CHECKOUT] ✓ Order created in database`);
    
    // orderResult already set from createOrderFromCart
    
    if (!orderResult.success) {
      const createOrderError =
        'error' in orderResult ? orderResult.error : 'Erro ao criar pedido';
      const errorTimestamp = new Date().toISOString();
      console.error(`[${errorTimestamp}] [CHECKOUT] ✗ Order creation failed:`, orderResult.error);
      return NextResponse.json(
        { success: false, error: orderResult.error },
        { status: 400 }
      );
    }
    console.log(`[${orderTimestamp}] [CHECKOUT] ✓ Order ID: ${orderResult.order_id}`);
    
    // 4. Fetch order items for Mercado Pago preference
    const itemsTimestamp = new Date().toISOString();
    console.log(`[${itemsTimestamp}] [CHECKOUT] Step 6: Fetching order items...`);
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_name, quantity, product_price')
      .eq('order_id', orderResult.order_id);
    
    if (itemsError || !orderItems) {
      const errorTimestamp = new Date().toISOString();
      console.error(`[${errorTimestamp}] [CHECKOUT] ✗ Failed to fetch order items:`, itemsError);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar itens do pedido' },
        { status: 500 }
      );
    }
    console.log(`[${itemsTimestamp}] [CHECKOUT] ✓ Order items fetched: ${orderItems.length} items`);
    
    // 5. Build preference request
    const buildTimestamp = new Date().toISOString();
    console.log(`[${buildTimestamp}] [CHECKOUT] Step 7: Building Mercado Pago preference request...`);
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
    console.log(`[${buildTimestamp}] [CHECKOUT] ✓ Preference request built`);
    
    // 6. Create Mercado Pago preference
    const preferenceTimestamp = new Date().toISOString();
    console.log(`[${preferenceTimestamp}] [CHECKOUT] Step 8: Creating Mercado Pago preference...`);
    let preference;
    const startTime = Date.now(); // Declare outside try block so it's accessible in catch
    try {
      const createTimestamp = new Date().toISOString();
      console.log(`[${createTimestamp}] Creating Mercado Pago preference...`, {
        orderId: orderResult.order_id,
        itemCount: orderItems.length,
        totalAmount: orderResult.total_amount,
        timestamp: createTimestamp,
      });
      
      preference = await mercadoPagoService.createPreference(preferenceRequest);
      
      const duration = Date.now() - startTime;
      const successTimestamp = new Date().toISOString();
      console.log(`[${successTimestamp}] Preference created successfully:`, {
        preferenceId: preference.id,
        initPoint: preference.init_point,
        duration: `${duration}ms`,
      });
    } catch (mpError: any) {
      const errorTimestamp = new Date().toISOString();
      const errorDuration = Date.now() - startTime;
      console.error(`[${errorTimestamp}] [CHECKOUT] ✗ Mercado Pago error after ${errorDuration}ms:`, mpError);
      console.error(`[${errorTimestamp}] [CHECKOUT] Error details:`, {
        message: mpError.message,
        stack: mpError.stack,
        cause: mpError.cause,
        code: mpError.code,
        status: mpError.status,
        errno: mpError.errno,
        duration: `${errorDuration}ms`,
      });
      
      // Execute rollback before returning error
      const rollbackStartTime = Date.now();
      const rollbackTimestamp = new Date().toISOString();
      console.log(`[${rollbackTimestamp}] [CHECKOUT] Step 9: Rolling back order...`);
      
      try {
        let rollbackClient = supabase;
        try {
          rollbackClient = createAdminClient() as any;
        } catch {
          // Keep authenticated client when service role is unavailable.
        }

        // Rollback: delete order and payment
        await rollbackClient.from('payments').delete().eq('id', orderResult.payment_id);
        await rollbackClient.from('order_items').delete().eq('order_id', orderResult.order_id);
        await rollbackClient.from('orders').delete().eq('id', orderResult.order_id);
        
        const rollbackDuration = Date.now() - rollbackStartTime;
        const rollbackCompleteTimestamp = new Date().toISOString();
        console.log(`[${rollbackCompleteTimestamp}] [CHECKOUT] ✓ Order rolled back successfully in ${rollbackDuration}ms`);
      } catch (rollbackError: any) {
        const rollbackDuration = Date.now() - rollbackStartTime;
        const rollbackErrorTimestamp = new Date().toISOString();
        console.error(`[${rollbackErrorTimestamp}] [CHECKOUT] ✗ Rollback failed after ${rollbackDuration}ms:`, rollbackError);
        // Continue to return error to user even if rollback fails
      }
      
      // Determine appropriate error status based on error type
      let errorStatus = 500;
      let errorMessage = 'Erro ao criar preferência de pagamento';
      
      const diagnosisTimestamp = new Date().toISOString();
      
      // Check for timeout errors (SDK timeout, socket timeout, or explicit timeout messages)
      if (
        mpError.code === 'ETIMEDOUT' ||
        mpError.code === 'ESOCKETTIMEDOUT' ||
        mpError.code === 'ECONNABORTED' ||
        mpError.name === 'TimeoutError' ||
        mpError.message?.toLowerCase().includes('timeout') ||
        mpError.message?.toLowerCase().includes('timed out') ||
        mpError.message?.toLowerCase().includes('time out') ||
        (mpError.cause && (
          mpError.cause.code === 'ETIMEDOUT' ||
          mpError.cause.code === 'ESOCKETTIMEDOUT' ||
          mpError.cause.message?.toLowerCase().includes('timeout')
        ))
      ) {
        errorStatus = 504; // Gateway Timeout
        errorMessage = 'Timeout ao conectar com o serviço de pagamento. Por favor, tente novamente.';
        console.error(`[${diagnosisTimestamp}] Timeout error detected (duration: ${errorDuration}ms) - returning 504`);
      }
      // Check for network errors
      else if (
        mpError.code === 'ECONNREFUSED' ||
        mpError.code === 'ENOTFOUND' ||
        mpError.code === 'ECONNRESET' ||
        mpError.code === 'ENETUNREACH' ||
        mpError.code === 'EHOSTUNREACH' ||
        mpError.message?.toLowerCase().includes('network') ||
        mpError.message?.toLowerCase().includes('connect')
      ) {
        errorStatus = 503; // Service Unavailable
        errorMessage = 'Serviço de pagamento temporariamente indisponível. Por favor, tente novamente em alguns instantes.';
        console.error(`[${diagnosisTimestamp}] Network error detected - returning 503`);
      }
      // Check for API errors with status codes
      else if (mpError.status) {
        errorStatus = mpError.status >= 500 ? 500 : mpError.status;
        errorMessage = `Erro no serviço de pagamento: ${mpError.message}`;
        console.error(`[${diagnosisTimestamp}] API error with status ${mpError.status} - returning ${errorStatus}`);
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
    const updateTimestamp = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('payments')
      .update({ mercadopago_preference_id: preference.id })
      .eq('id', orderResult.payment_id);
    
    if (updateError) {
      console.error(`[${updateTimestamp}] Failed to update payment with preference_id:`, updateError);
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
    
    const successTimestamp = new Date().toISOString();
    console.log(`[${successTimestamp}] [CHECKOUT] ✓ Order created successfully:`, {
      orderId: response.orderId,
      preferenceId: response.preferenceId,
      totalAmount: response.totalAmount,
    });
    console.log('========================================');
    console.log(`[${successTimestamp}] [CHECKOUT] POST /api/checkout/create-order - SUCCESS`);
    console.log('========================================');
    
    return NextResponse.json(response, { status: 200 });
    
  } catch (error: any) {
    const errorTimestamp = new Date().toISOString();
    console.error('========================================');
    console.error(`[${errorTimestamp}] [CHECKOUT] ✗ Unexpected error in create-order:`, error);
    console.error(`[${errorTimestamp}] [CHECKOUT] Error stack:`, error.stack);
    console.error('========================================');
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
