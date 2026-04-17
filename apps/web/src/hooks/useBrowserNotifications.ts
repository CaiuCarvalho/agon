"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Order } from '@/modules/admin/types';
import { formatBRL } from '@/lib/format';

/**
 * Hook for managing browser notifications
 * 
 * Features:
 * - Request notification permission on mount
 * - Display native browser notifications
 * - Only show when tab is not active
 * - Auto-close after 10 seconds
 * - Navigate to order on click
 * 
 * @example
 * ```tsx
 * const { permission, notifyNewOrder } = useBrowserNotifications();
 * 
 * if (permission === 'granted') {
 *   notifyNewOrder(order);
 * }
 * ```
 */
export function useBrowserNotifications() {
  const router = useRouter();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  
  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return;
    }
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }, []);
  
  /**
   * Display browser notification for new approved order
   */
  const notifyNewOrder = useCallback((order: Order) => {
    // Only show if permission granted and tab is not active
    if (permission !== 'granted' || !document.hidden) {
      return;
    }
    
    const amount = formatBRL(order.totalAmount);
    const orderNumber = order.id.slice(0, 8);
    
    try {
      const notification = new Notification('Novo Pedido Aprovado!', {
        body: `Pedido #${orderNumber} - ${amount}`,
        icon: '/images/ui/world-cup-trophy.jpg',
        tag: `order-${order.id}`,
        requireInteraction: false,
        data: { orderId: order.id }
      });
      
      // Handle click - focus window and navigate
      notification.onclick = () => {
        window.focus();
        router.push(`/admin/orders/${order.id}`);
        notification.close();
      };
      
      // Auto-close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }, [permission, router]);
  
  /**
   * Initialize - request permission on mount
   */
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      // Auto-request permission if not yet determined
      if (Notification.permission === 'default') {
        requestPermission();
      }
    }
  }, [requestPermission]);
  
  return {
    permission,
    requestPermission,
    notifyNewOrder
  };
}
