// Fulfillment Service
// Handles shipping updates with business rule validation

import { isConfigurationError } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Order, ServiceResult, ShippingStatus } from '../types';
import type { ShippingUpdateInput } from '../schemas';
import { shippingUpdateSchema } from '../schemas';

/**
 * Updates shipping information for an order
 * Validates payment status, shipping progression, and tracking requirements
 */
export async function updateShipping(
  orderId: string,
  input: ShippingUpdateInput
): Promise<ServiceResult<Order>> {
  try {
    // Validate input
    const validation = shippingUpdateSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid shipping update data',
          details: validation.error.flatten().fieldErrors as Record<string, string[]>,
        },
      };
    }
    
    const { shippingStatus, trackingCode, carrier, forceOverride } = validation.data;
    
    const supabase = createAdminClient();
    
    // Fetch current order with payment status
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
        id,
        shipping_status,
        payments!inner(status)
      `)
      .eq('id', orderId)
      .single();
    
    if (fetchError || !currentOrder) {
      console.error('[Fulfillment Service] Order not found:', orderId);
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Order not found',
        },
      };
    }
    
    // Business Rule 1: Payment must be approved before shipping (unless force override is set)
    const paymentStatus = (currentOrder.payments as any).status;
    if (paymentStatus !== 'approved' && !forceOverride) {
      return {
        success: false,
        error: {
          code: 'PAYMENT_NOT_APPROVED',
          message: 'Cannot update shipping for unpaid order. Payment must be approved first.',
        },
      };
    }
    if (paymentStatus !== 'approved' && forceOverride) {
      console.warn('[Fulfillment Service] Shipping updated with payment override:', {
        orderId,
        paymentStatus,
        shippingStatus,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Business Rule 2: Validate shipping status progression (no regression)
    const currentShippingStatus = currentOrder.shipping_status as ShippingStatus;
    const statusOrder: ShippingStatus[] = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentShippingStatus);
    const newIndex = statusOrder.indexOf(shippingStatus);
    
    if (newIndex < currentIndex) {
      console.error('[Fulfillment Service] Invalid shipping status regression:', {
        orderId,
        currentStatus: currentShippingStatus,
        attemptedStatus: shippingStatus,
        timestamp: new Date().toISOString(),
      });
      return {
        success: false,
        error: {
          code: 'INVALID_STATUS_PROGRESSION',
          message: `Cannot regress shipping status from ${currentShippingStatus} to ${shippingStatus}`,
        },
      };
    }
    
    // Business Rule 3: Tracking code and carrier required when marking as shipped
    if ((shippingStatus === 'shipped' || shippingStatus === 'delivered') && (!trackingCode || !carrier)) {
      console.error('[Fulfillment Service] Missing tracking info:', {
        orderId,
        shippingStatus,
        timestamp: new Date().toISOString(),
      });
      return {
        success: false,
        error: {
          code: 'MISSING_TRACKING_INFO',
          message: 'Tracking code and carrier are required when marking order as shipped or delivered',
        },
      };
    }
    
    // Prepare update data
    const updateData: any = {
      shipping_status: shippingStatus,
    };
    
    // Set shipped_at timestamp when status changes to 'shipped'
    if (shippingStatus === 'shipped' && currentShippingStatus !== 'shipped') {
      updateData.shipped_at = new Date().toISOString();
    }
    
    // Update tracking info if provided
    if (trackingCode) {
      updateData.tracking_code = trackingCode;
    }
    if (carrier) {
      updateData.carrier = carrier;
    }
    
    // Update order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
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
        updated_at
      `)
      .single();
    
    if (updateError || !updatedOrder) {
      console.error('[Fulfillment Service] Update failed:', updateError);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update shipping information',
        },
      };
    }
    
    // Transform to Order type
    const order: Order = {
      id: updatedOrder.id,
      userId: updatedOrder.user_id,
      status: updatedOrder.status,
      totalAmount: updatedOrder.total_amount,
      shippingName: updatedOrder.shipping_name,
      shippingAddress: updatedOrder.shipping_address,
      shippingCity: updatedOrder.shipping_city,
      shippingState: updatedOrder.shipping_state,
      shippingZip: updatedOrder.shipping_zip,
      shippingPhone: updatedOrder.shipping_phone,
      shippingEmail: updatedOrder.shipping_email,
      paymentMethod: updatedOrder.payment_method,
      shippingStatus: updatedOrder.shipping_status,
      trackingCode: updatedOrder.tracking_code,
      carrier: updatedOrder.carrier,
      shippedAt: updatedOrder.shipped_at,
      createdAt: updatedOrder.created_at,
      updatedAt: updatedOrder.updated_at,
    };
    
    return {
      success: true,
      data: order,
    };
  } catch (error) {
    console.error('[Fulfillment Service] Error:', error);

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
