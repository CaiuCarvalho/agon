import type { SupabaseClient } from '@supabase/supabase-js';

type ShippingInput = {
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingPhone: string;
  shippingEmail: string;
};

type RpcOrderResult = {
  success: boolean;
  order_id?: string;
  payment_id?: string;
  total_amount?: number;
  item_count?: number;
  error?: string;
};

type CreateOrderResult =
  | {
      success: true;
      order_id: string;
      payment_id: string;
      total_amount: number;
      item_count: number;
      rpcUsed: 'create_order_with_payment_atomic' | 'create_order_atomic';
    }
  | {
      success: false;
      error: string;
      rpcUsed?: 'create_order_with_payment_atomic' | 'create_order_atomic';
      details?: unknown;
    };

function isMissingRpcFunctionError(error: unknown): boolean {
  const message = String((error as { message?: string })?.message || '').toLowerCase();
  const code = String((error as { code?: string })?.code || '').toLowerCase();
  return code === 'pgrst202' || message.includes('could not find the function');
}

function isRpcSuccessResult(result: RpcOrderResult): result is Required<Pick<RpcOrderResult, 'order_id' | 'total_amount' | 'item_count'>> & RpcOrderResult {
  return !!result.order_id && typeof result.total_amount !== 'undefined' && typeof result.item_count !== 'undefined';
}

export async function createOrderFromCart(params: {
  supabase: SupabaseClient;
  userId: string;
  shipping: ShippingInput;
}): Promise<CreateOrderResult> {
  const { supabase, userId, shipping } = params;

  const withPaymentArgs = {
    p_user_id: userId,
    p_shipping_name: shipping.shippingName,
    p_shipping_address: shipping.shippingAddress,
    p_shipping_city: shipping.shippingCity,
    p_shipping_state: shipping.shippingState,
    p_shipping_zip: shipping.shippingZip,
    p_shipping_phone: shipping.shippingPhone,
    p_shipping_email: shipping.shippingEmail,
    p_payment_method: 'mercadopago_credit_card',
    p_mercadopago_preference_id: 'temp',
  };

  const { data: withPaymentData, error: withPaymentError } = await supabase.rpc(
    'create_order_with_payment_atomic',
    withPaymentArgs
  );

  if (!withPaymentError) {
    const result = withPaymentData as RpcOrderResult;
    if (!result?.success) {
      return {
        success: false,
        error: result?.error || 'Erro ao criar pedido',
        rpcUsed: 'create_order_with_payment_atomic',
      };
    }

    if (!result.payment_id || !isRpcSuccessResult(result)) {
      return {
        success: false,
        error: 'RPC create_order_with_payment_atomic retornou dados incompletos',
        rpcUsed: 'create_order_with_payment_atomic',
        details: result,
      };
    }

    return {
      success: true,
      order_id: result.order_id,
      payment_id: result.payment_id,
      total_amount: Number(result.total_amount),
      item_count: Number(result.item_count),
      rpcUsed: 'create_order_with_payment_atomic',
    };
  }

  if (!isMissingRpcFunctionError(withPaymentError)) {
    return {
      success: false,
      error: 'Erro ao criar pedido',
      rpcUsed: 'create_order_with_payment_atomic',
      details: withPaymentError,
    };
  }

  const { data: atomicData, error: atomicError } = await supabase.rpc('create_order_atomic', {
    p_user_id: userId,
    p_shipping_name: shipping.shippingName,
    p_shipping_address: shipping.shippingAddress,
    p_shipping_city: shipping.shippingCity,
    p_shipping_state: shipping.shippingState,
    p_shipping_zip: shipping.shippingZip,
    p_shipping_phone: shipping.shippingPhone,
    p_shipping_email: shipping.shippingEmail,
    p_payment_method: 'mercadopago_credit_card',
  });

  if (atomicError) {
    return {
      success: false,
      error: 'Erro ao criar pedido',
      rpcUsed: 'create_order_atomic',
      details: atomicError,
    };
  }

  const atomicResult = atomicData as RpcOrderResult;

  if (!atomicResult?.success || !isRpcSuccessResult(atomicResult)) {
    return {
      success: false,
      error: atomicResult?.error || 'Erro ao criar pedido',
      rpcUsed: 'create_order_atomic',
      details: atomicResult,
    };
  }

  const { data: paymentRow, error: paymentError } = await supabase
    .from('payments')
    .insert({
      order_id: atomicResult.order_id,
      mercadopago_preference_id: 'temp',
      status: 'pending',
      amount: atomicResult.total_amount,
    })
    .select('id')
    .single();

  if (paymentError || !paymentRow?.id) {
    return {
      success: false,
      error: 'Pedido criado, mas não foi possível criar o pagamento',
      rpcUsed: 'create_order_atomic',
      details: paymentError,
    };
  }

  return {
    success: true,
    order_id: atomicResult.order_id,
    payment_id: paymentRow.id,
    total_amount: Number(atomicResult.total_amount),
    item_count: Number(atomicResult.item_count),
    rpcUsed: 'create_order_atomic',
  };
}
