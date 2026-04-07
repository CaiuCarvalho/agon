/**
 * Payment Service
 * 
 * Handles all payment-related database operations:
 * - CRUD operations for payments table
 * - Update payment status from webhooks
 * - Synchronize payment and order status
 * - Data transformation (snake_case ↔ camelCase)
 */

import { createClient } from '@/lib/supabase/client';
import type { Payment, UpdatePaymentStatusResponse } from '../types';

/**
 * Transform database row (snake_case) to Payment (camelCase)
 */
function transformPaymentRow(row: any): Payment {
  return {
    id: row.id,
    orderId: row.order_id,
    mercadopagoPaymentId: row.mercadopago_payment_id,
    mercadopagoPreferenceId: row.mercadopago_preference_id,
    status: row.status as Payment['status'],
    paymentMethod: row.payment_method,
    amount: parseFloat(row.amount),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    order: row.order ? {
      id: row.order.id,
      userId: row.order.user_id,
      status: row.order.status,
      totalAmount: parseFloat(row.order.total_amount),
      shippingName: row.order.shipping_name,
      shippingAddress: row.order.shipping_address,
      shippingCity: row.order.shipping_city,
      shippingState: row.order.shipping_state,
      shippingZip: row.order.shipping_zip,
      shippingPhone: row.order.shipping_phone,
      shippingEmail: row.order.shipping_email,
      paymentMethod: row.order.payment_method,
      createdAt: row.order.created_at,
      updatedAt: row.order.updated_at,
    } : undefined,
  };
}

export const paymentService = {
  /**
   * Get payment by order ID
   */
  async getPaymentByOrderId(orderId: string): Promise<Payment | null> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('payments')
      .select('*, order:orders(*)')
      .eq('order_id', orderId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return transformPaymentRow(data);
  },
  
  /**
   * Get payment by Mercado Pago payment ID
   */
  async getPaymentByMercadoPagoId(paymentId: string): Promise<Payment | null> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('payments')
      .select('*, order:orders(*)')
      .eq('mercadopago_payment_id', paymentId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return transformPaymentRow(data);
  },
  
  /**
   * Get payment by Mercado Pago preference ID
   */
  async getPaymentByPreferenceId(preferenceId: string): Promise<Payment | null> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('payments')
      .select('*, order:orders(*)')
      .eq('mercadopago_preference_id', preferenceId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return transformPaymentRow(data);
  },
  
  /**
   * Update payment status from webhook (server-side only)
   * Uses RPC function for atomic update of payment + order + cart
   */
  async updatePaymentFromWebhook(
    mercadopagoPaymentId: string,
    status: Payment['status'],
    paymentMethod: string
  ): Promise<UpdatePaymentStatusResponse> {
    const supabase = createClient();
    
    const { data, error } = await supabase.rpc('update_payment_from_webhook', {
      p_mercadopago_payment_id: mercadopagoPaymentId,
      p_status: status,
      p_payment_method: paymentMethod,
    });
    
    if (error) {
      console.error('Failed to update payment from webhook:', error);
      throw error;
    }
    
    const result = data as UpdatePaymentStatusResponse;
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update payment');
    }
    
    return result;
  },
  
  /**
   * Update payment with preference ID after creation
   */
  async updatePaymentPreferenceId(
    paymentId: string,
    preferenceId: string
  ): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('payments')
      .update({ mercadopago_preference_id: preferenceId })
      .eq('id', paymentId);
    
    if (error) throw error;
  },
  
  /**
   * Get user's payments (paginated)
   */
  async getUserPayments(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ payments: Payment[]; total: number }> {
    const supabase = createClient();
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data, error, count } = await supabase
      .from('payments')
      .select('*, order:orders!inner(*)', { count: 'exact' })
      .eq('order.user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    
    return {
      payments: (data || []).map(transformPaymentRow),
      total: count || 0,
    };
  },
};
