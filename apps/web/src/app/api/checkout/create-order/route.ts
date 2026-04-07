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
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
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
      console.error('RPC error:', rpcError);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar pedido' },
        { status: 500 }
      );
    }
    
    const orderResult = rpcResult as any;
    
    if (!orderResult.success) {
      return NextResponse.json(
        { success: false, error: orderResult.error },
        { status: 400 }
      );
    }
    
    // 4. Fetch order items for Mercado Pago preference
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_name, quantity, product_price')
      .eq('order_id', orderResult.order_id);
    
    if (itemsError || !orderItems) {
      console.error('Failed to fetch order items:', itemsError);
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
    try {
      console.log('Creating Mercado Pago preference...', {
        orderId: orderResult.order_id,
        itemCount: orderItems.length,
        totalAmount: orderResult.total_amount,
      });
      
      preference = await mercadoPagoService.createPreference(preferenceRequest);
      
      console.log('Preference created successfully:', {
        preferenceId: preference.id,
        initPoint: preference.init_point,
      });
    } catch (mpError: any) {
      console.error('Mercado Pago error:', mpError);
      console.error('Error details:', {
        message: mpError.message,
        stack: mpError.stack,
        cause: mpError.cause,
      });
      
      // Rollback: delete order and payment
      await supabase.from('payments').delete().eq('id', orderResult.payment_id);
      await supabase.from('order_items').delete().eq('order_id', orderResult.order_id);
      await supabase.from('orders').delete().eq('id', orderResult.order_id);
      
      return NextResponse.json(
        { success: false, error: `Erro ao criar preferência de pagamento: ${mpError.message}` },
        { status: 500 }
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
    
    console.log('Order created successfully:', {
      orderId: response.orderId,
      preferenceId: response.preferenceId,
      totalAmount: response.totalAmount,
    });
    
    return NextResponse.json(response, { status: 200 });
    
  } catch (error: any) {
    console.error('Unexpected error in create-order:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
