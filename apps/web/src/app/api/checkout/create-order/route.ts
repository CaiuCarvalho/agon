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
  try {
    // Environment validation (helps debug 502 errors in production)
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      console.error('[CHECKOUT] [CRITICAL] MERCADOPAGO_ACCESS_TOKEN not configured');
      return NextResponse.json(
        { success: false, error: 'Configuração de pagamento ausente' },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error('[CHECKOUT] [CRITICAL] NEXT_PUBLIC_APP_URL not configured');
      return NextResponse.json(
        { success: false, error: 'Configuração de URL ausente' },
        { status: 500 }
      );
    }

    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[CHECKOUT] ✗ Authentication failed:', authError);
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const { shippingInfo } = body;

    // Validate shipping info
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

    const validatedShipping = validationResult.data;

    // 3. Create order with payment atomically (without preference_id yet)
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

    if (!orderResult.success) {
      console.error('[CHECKOUT] ✗ Order creation failed:', orderResult.error);
      return NextResponse.json(
        { success: false, error: orderResult.error },
        { status: 400 }
      );
    }

    // 4. Fetch order items for Mercado Pago preference
    const adminClient = createAdminClient();
    const { data: orderItems, error: itemsError } = await adminClient
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

    // 5. Build preference request
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

    // 6. Create Mercado Pago preference
    let preference;
    const startTime = Date.now(); // Declare outside try block so it's accessible in catch
    try {
      preference = await mercadoPagoService.createPreference(preferenceRequest);
    } catch (mpError: any) {
      const errorDuration = Date.now() - startTime;
      console.error(`[CHECKOUT] ✗ Mercado Pago error after ${errorDuration}ms:`, {
        message: mpError.message,
        code: mpError.code,
        status: mpError.status,
        duration: `${errorDuration}ms`,
      });
      
      // Execute rollback before returning error
      const rollbackStartTime = Date.now();
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
      } catch (rollbackError: any) {
        const rollbackDuration = Date.now() - rollbackStartTime;
        console.error(`[CHECKOUT] ✗ Rollback failed after ${rollbackDuration}ms:`, rollbackError);
        // Continue to return error to user even if rollback fails
      }

      // Determine appropriate error status based on error type
      let errorStatus = 500;
      let errorMessage = 'Erro ao criar preferência de pagamento';
      
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
        console.error(`[CHECKOUT] Timeout error detected (duration: ${errorDuration}ms) - returning 504`);
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
        console.error(`[CHECKOUT] Network error detected - returning 503`);
      }
      // Check for API errors with status codes
      else if (mpError.status) {
        errorStatus = mpError.status >= 500 ? 500 : mpError.status;
        errorMessage = `Erro no serviço de pagamento: ${mpError.message}`;
        console.error(`[CHECKOUT] API error with status ${mpError.status} - returning ${errorStatus}`);
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
      console.error('[CHECKOUT] Failed to update payment with preference_id:', updateError);
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

    console.log('[CHECKOUT] Order created successfully:', {
      orderId: response.orderId,
      preferenceId: response.preferenceId,
      totalAmount: response.totalAmount,
    });

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('[CHECKOUT] ✗ Unexpected error in create-order:', error.message);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
