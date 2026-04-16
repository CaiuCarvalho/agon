"use client";

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Order } from '@/modules/admin/types';
import { formatBRL } from '@/lib/format';

/**
 * Hook for displaying order notifications using Sonner toast
 * 
 * Features:
 * - Toast notifications with order details
 * - Action button to view order
 * - Color coding by status
 * - 10 second duration
 * 
 * @example
 * ```tsx
 * const { notifyNewOrder, notifyOrderUpdate } = useOrderNotifications();
 * 
 * notifyNewOrder(order);
 * notifyOrderUpdate(order, 'pending');
 * ```
 */
export function useOrderNotifications() {
  const router = useRouter();
  
  /**
   * Get payment method label in Portuguese
   */
  const getPaymentMethodLabel = (method: string): string => {
    const labels: Record<string, string> = {
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      pix: 'PIX',
      boleto: 'Boleto Bancário',
      account_money: 'Saldo Mercado Pago'
    };
    
    return labels[method] || method;
  };
  
  /**
   * Navigate to order details page
   */
  const viewOrder = (orderId: string) => {
    router.push(`/admin/orders/${orderId}`);
  };
  
  /**
   * Display notification for new order
   */
  const notifyNewOrder = (order: Order) => {
    const amount = formatBRL(order.totalAmount);
    const paymentMethod = getPaymentMethodLabel(order.paymentMethod);
    
    toast.success('Novo Pedido Criado!', {
      description: `Pedido #${order.id.slice(0, 8)} - ${order.shippingName} - ${amount} (${paymentMethod})`,
      duration: 10000,
      action: {
        label: 'Ver Pedido',
        onClick: () => viewOrder(order.id)
      }
    });
  };
  
  /**
   * Display notification for order status update
   */
  const notifyOrderUpdate = (order: Order, oldStatus?: string) => {
    const amount = formatBRL(order.totalAmount);
    
    // Only notify when status changes to processing (payment approved)
    if (order.status === 'processing') {
      toast.success('Pedido Aprovado!', {
        description: `Pedido #${order.id.slice(0, 8)} - ${order.shippingName} - ${amount}`,
        duration: 10000,
        action: {
          label: 'Ver Pedido',
          onClick: () => viewOrder(order.id)
        }
      });
    } else if (order.status === 'cancelled') {
      toast.error('Pedido Cancelado', {
        description: `Pedido #${order.id.slice(0, 8)} - ${order.shippingName}`,
        duration: 10000,
        action: {
          label: 'Ver Pedido',
          onClick: () => viewOrder(order.id)
        }
      });
    }
  };
  
  return {
    notifyNewOrder,
    notifyOrderUpdate
  };
}
