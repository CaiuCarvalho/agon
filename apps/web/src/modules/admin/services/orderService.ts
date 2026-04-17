// Order Service
// Provides order listing and details for admin panel

import { createAdminClient } from '@/lib/supabase/admin';
import { isConfigurationError } from '@/lib/env';
import type { OrderWithDetails, ServiceResult } from '../types';
import type { OrderFiltersInput } from '../schemas';
import { orderFiltersSchema } from '../schemas';
import { PAGE_SIZE } from '../constants';

interface OrderListResult {
  orders: OrderWithDetails[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Lists orders with pagination and filtering
 */
export async function listOrders(filters: OrderFiltersInput): Promise<ServiceResult<OrderListResult>> {
  try {
    // Validate filters
    const validation = orderFiltersSchema.safeParse(filters);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid filters',
          details: validation.error.flatten().fieldErrors as Record<string, string[]>,
        },
      };
    }
    
    const { page, pageSize, paymentStatus, shippingStatus, search } = validation.data;
    const offset = (page - 1) * pageSize;
    
    // Use service role for admin panel reads.
    // Admin access is enforced at route layer via validateAdmin().
    const supabase = createAdminClient();
    
    // Build query
    let query = supabase
      .from('orders')
      .select(`
        id,
        user_id,
        status,
        total_amount,
        shipping_name,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_zip,
        shipping_phone,
        shipping_email,
        payment_method,
        shipping_status,
        tracking_code,
        carrier,
        shipped_at,
        created_at,
        updated_at,
        order_items!inner(
          id,
          product_id,
          product_name,
          product_price,
          quantity,
          size,
          subtotal
        ),
        payments!inner(
          id,
          mercadopago_payment_id,
          mercadopago_preference_id,
          status,
          payment_method,
          amount,
          created_at,
          updated_at
        )
      `, { count: 'exact' });
    
    // Apply filters
    if (paymentStatus) {
      query = query.eq('payments.status', paymentStatus);
    }
    if (shippingStatus) {
      query = query.eq('shipping_status', shippingStatus);
    }
    if (search) {
      // Whitelist: keep only alphanumerics, spaces, and hyphens to prevent
      // PostgREST operator injection. Zod already enforces max(200) upstream;
      // we additionally cap at 100 chars here as a defence-in-depth measure.
      const clean = search.replace(/[^\w\s-]/g, '').slice(0, 100);
      if (clean.length > 0) {
        query = query.or(`shipping_name.ilike.%${clean}%,id.ilike.${clean}%`);
      }
    }

    // Execute query with pagination
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);
    
    if (error) {
      console.error('[Order Service] List error:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch orders',
        },
      };
    }
    
    // Transform data
    const orders: OrderWithDetails[] = (data || []).map((order: any) => ({
      id: order.id,
      userId: order.user_id,
      status: order.status,
      totalAmount: order.total_amount,
      shippingName: order.shipping_name,
      shippingAddress: order.shipping_address,
      shippingCity: order.shipping_city,
      shippingState: order.shipping_state,
      shippingZip: order.shipping_zip,
      shippingPhone: order.shipping_phone,
      shippingEmail: order.shipping_email,
      paymentMethod: order.payment_method,
      shippingStatus: order.shipping_status,
      trackingCode: order.tracking_code,
      carrier: order.carrier,
      shippedAt: order.shipped_at,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: Array.isArray(order.order_items) ? order.order_items.map((item: any) => ({
        id: item.id,
        orderId: order.id,
        productId: item.product_id,
        productName: item.product_name,
        productPrice: item.product_price,
        quantity: item.quantity,
        size: item.size,
        subtotal: item.subtotal,
      })) : [],
      payment: {
        id: Array.isArray(order.payments) ? order.payments[0]?.id : order.payments?.id,
        orderId: order.id,
        mercadopagoPaymentId: Array.isArray(order.payments)
          ? order.payments[0]?.mercadopago_payment_id
          : order.payments?.mercadopago_payment_id,
        mercadopagoPreferenceId: Array.isArray(order.payments)
          ? order.payments[0]?.mercadopago_preference_id
          : order.payments?.mercadopago_preference_id,
        status: Array.isArray(order.payments)
          ? order.payments[0]?.status
          : order.payments?.status,
        paymentMethod: Array.isArray(order.payments)
          ? order.payments[0]?.payment_method
          : order.payments?.payment_method,
        amount: Array.isArray(order.payments)
          ? order.payments[0]?.amount
          : order.payments?.amount,
        createdAt: Array.isArray(order.payments)
          ? order.payments[0]?.created_at
          : order.payments?.created_at,
        updatedAt: Array.isArray(order.payments)
          ? order.payments[0]?.updated_at
          : order.payments?.updated_at,
      },
    }));
    
    return {
      success: true,
      data: {
        orders,
        total: count || 0,
        page,
        pageSize,
      },
    };
  } catch (error) {
    console.error('[Order Service] Error:', error);

    if (isConfigurationError(error)) {
      return {
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: error.message,
          details: { env: error.missingVars },
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Gets order details by ID
 */
export async function getOrderDetails(id: string): Promise<ServiceResult<OrderWithDetails>> {
  try {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        status,
        total_amount,
        shipping_name,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_zip,
        shipping_phone,
        shipping_email,
        payment_method,
        shipping_status,
        tracking_code,
        carrier,
        shipped_at,
        created_at,
        updated_at,
        order_items(
          id,
          product_id,
          product_name,
          product_price,
          quantity,
          size,
          subtotal
        ),
        payments(
          id,
          mercadopago_payment_id,
          mercadopago_preference_id,
          status,
          payment_method,
          amount,
          created_at,
          updated_at
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Order not found',
        },
      };
    }
    
    const order: OrderWithDetails = {
      id: data.id,
      userId: data.user_id,
      status: data.status,
      totalAmount: data.total_amount,
      shippingName: data.shipping_name,
      shippingAddress: data.shipping_address,
      shippingCity: data.shipping_city,
      shippingState: data.shipping_state,
      shippingZip: data.shipping_zip,
      shippingPhone: data.shipping_phone,
      shippingEmail: data.shipping_email,
      paymentMethod: data.payment_method,
      shippingStatus: data.shipping_status,
      trackingCode: data.tracking_code,
      carrier: data.carrier,
      shippedAt: data.shipped_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      items: ((data.order_items as any[]) || []).map(item => ({
        id: item.id,
        orderId: data.id,
        productId: item.product_id,
        productName: item.product_name,
        productPrice: item.product_price,
        quantity: item.quantity,
        size: item.size,
        subtotal: item.subtotal,
      })),
      payment: {
        id: Array.isArray(data.payments) ? data.payments[0]?.id : (data.payments as any)?.id,
        orderId: data.id,
        mercadopagoPaymentId: Array.isArray(data.payments)
          ? data.payments[0]?.mercadopago_payment_id
          : (data.payments as any)?.mercadopago_payment_id,
        mercadopagoPreferenceId: Array.isArray(data.payments)
          ? data.payments[0]?.mercadopago_preference_id
          : (data.payments as any)?.mercadopago_preference_id,
        status: Array.isArray(data.payments)
          ? data.payments[0]?.status
          : (data.payments as any)?.status,
        paymentMethod: Array.isArray(data.payments)
          ? data.payments[0]?.payment_method
          : (data.payments as any)?.payment_method,
        amount: Array.isArray(data.payments)
          ? data.payments[0]?.amount
          : (data.payments as any)?.amount,
        createdAt: Array.isArray(data.payments)
          ? data.payments[0]?.created_at
          : (data.payments as any)?.created_at,
        updatedAt: Array.isArray(data.payments)
          ? data.payments[0]?.updated_at
          : (data.payments as any)?.updated_at,
      },
    };
    
    return {
      success: true,
      data: order,
    };
  } catch (error) {
    console.error('[Order Service] Get details error:', error);

    if (isConfigurationError(error)) {
      return {
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: error.message,
          details: { env: error.missingVars },
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    };
  }
}
