// Dashboard Service
// Provides dashboard metrics calculation and data fetching

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { isConfigurationError } from '@/lib/env';
import type { DashboardMetrics, OrderSummary, ServiceResult } from '../types';

const paymentRowSchema = z.object({ amount: z.coerce.number() });

/**
 * Fetches dashboard metrics including revenue, order counts, and recent orders
 * 
 * Calculations:
 * - Total revenue: SUM(payments.amount) WHERE payments.status = 'approved'
 * - Order counts: COUNT(*) GROUP BY orders.status
 * - Average order value: total revenue / approved orders count
 * - Recent orders: 10 most recent orders sorted by created_at DESC
 * 
 * @returns ServiceResult with DashboardMetrics or error
 */
export async function getDashboardMetrics(): Promise<ServiceResult<DashboardMetrics>> {
  try {
    // Use service role for admin panel reads.
    // Admin access is enforced at route layer via validateAdmin().
    const supabase = createAdminClient();
    
    // Calculate total revenue from approved payments
    const { data: revenueData, error: revenueError } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'approved');
    
    if (revenueError) {
      console.error('[Dashboard Service] Revenue error:', revenueError);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to calculate revenue',
        },
      };
    }
    
    const totalRevenue = revenueData.reduce((sum, payment) => {
      const validated = paymentRowSchema.safeParse(payment);
      return sum + (validated.success ? validated.data.amount : 0);
    }, 0);
    const approvedOrdersCount = revenueData.length;
    
    // Calculate order counts by status
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('status');
    
    if (ordersError) {
      console.error('[Dashboard Service] Orders error:', ordersError);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch order counts',
        },
      };
    }
    
    const orderCounts = {
      pending: ordersData.filter(o => o.status === 'pending').length,
      processing: ordersData.filter(o => o.status === 'processing').length,
      shipped: ordersData.filter(o => o.status === 'shipped').length,
      delivered: ordersData.filter(o => o.status === 'delivered').length,
      cancelled: ordersData.filter(o => o.status === 'cancelled').length,
    };
    
    // Calculate average order value
    const averageOrderValue = approvedOrdersCount > 0 
      ? totalRevenue / approvedOrdersCount 
      : 0;
    
    // Fetch 10 most recent orders with payment info
    const { data: recentOrdersData, error: recentOrdersError } = await supabase
      .from('orders')
      .select(`
        id,
        shipping_name,
        total_amount,
        shipping_status,
        created_at,
        payments!inner(status)
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (recentOrdersError) {
      console.error('[Dashboard Service] Recent orders error:', recentOrdersError);
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch recent orders',
        },
      };
    }
    
    const recentOrders: OrderSummary[] = recentOrdersData.map(order => ({
      id: order.id,
      customerName: order.shipping_name,
      totalAmount: order.total_amount,
      paymentStatus: Array.isArray(order.payments)
        ? (order.payments[0]?.status || 'pending')
        : ((order.payments as any)?.status || 'pending'),
      shippingStatus: order.shipping_status,
      createdAt: order.created_at,
    }));
    
    return {
      success: true,
      data: {
        totalRevenue,
        orderCounts,
        averageOrderValue,
        recentOrders,
      },
    };
  } catch (error) {
    console.error('[Dashboard Service] Error:', error);

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
