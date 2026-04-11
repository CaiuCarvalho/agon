/**
 * Example usage of useRealtimeOrders hook
 * 
 * This file demonstrates how to use the useRealtimeOrders hook
 * in a React component for the Admin Panel.
 */

"use client";

import { useRealtimeOrders } from './useRealtimeOrders';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { Order } from '@/modules/admin/types';

export function AdminOrdersPageExample() {
  const router = useRouter();
  
  // Setup real-time subscription with callbacks
  const { status, reconnect } = useRealtimeOrders({
    onInsert: (order: Order) => {
      console.log('New order received:', order);
      
      // Show toast notification
      toast.success('Novo Pedido Recebido!', {
        description: `Pedido de ${order.shippingName} - R$ ${order.totalAmount.toFixed(2)}`,
        action: {
          label: 'Ver Pedido',
          onClick: () => router.push(`/admin/orders/${order.id}`)
        },
        duration: 10000
      });
      
      // Play notification sound (if implemented)
      // playNotificationSound();
      
      // Show browser notification (if permission granted)
      // showBrowserNotification(order);
      
      // Update orders list in state
      // setOrders(prev => [order, ...prev]);
    },
    
    onUpdate: (order: Order, oldOrder?: Order) => {
      console.log('Order updated:', order);
      
      // Only notify if status changed to 'processing'
      if (order.status === 'processing' && oldOrder?.status !== 'processing') {
        toast.success('Pedido Aprovado!', {
          description: `Pedido #${order.id} - ${order.shippingName}`,
          action: {
            label: 'Ver Pedido',
            onClick: () => router.push(`/admin/orders/${order.id}`)
          },
          duration: 10000
        });
      }
      
      // Update order in list
      // setOrders(prev => prev.map(o => o.id === order.id ? order : o));
    },
    
    onError: (error: Error) => {
      console.error('Real-time subscription error:', error);
      
      toast.error('Erro na Conexão', {
        description: 'Falha ao conectar com atualizações em tempo real',
        action: {
          label: 'Tentar Novamente',
          onClick: reconnect
        }
      });
    }
  });
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        
        {/* Connection status indicator */}
        <div className="flex items-center gap-2">
          <div 
            className={`w-2 h-2 rounded-full ${
              status === 'connected' ? 'bg-green-500' : 
              status === 'error' ? 'bg-red-500' : 
              'bg-yellow-500'
            }`}
          />
          <span className="text-sm text-gray-600">
            {status === 'connected' ? 'Conectado' : 
             status === 'error' ? 'Erro' : 
             'Desconectado'}
          </span>
          
          {status === 'error' && (
            <button
              onClick={reconnect}
              className="ml-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reconectar
            </button>
          )}
        </div>
      </div>
      
      {/* Orders list would go here */}
      <div className="space-y-4">
        {/* Order items... */}
      </div>
    </div>
  );
}

/**
 * Example: Using the hook with custom reconnection logic
 */
export function AdminDashboardExample() {
  const { status, reconnect } = useRealtimeOrders({
    onInsert: (order) => {
      // Update dashboard statistics
      console.log('New order for dashboard:', order);
    },
    onUpdate: (order) => {
      // Update dashboard statistics
      console.log('Order updated for dashboard:', order);
    }
  });
  
  // Auto-reconnect on error after 5 seconds
  // useEffect(() => {
  //   if (status === 'error') {
  //     const timeout = setTimeout(reconnect, 5000);
  //     return () => clearTimeout(timeout);
  //   }
  // }, [status, reconnect]);
  
  return (
    <div>
      {/* Dashboard content */}
    </div>
  );
}

/**
 * Example: Minimal usage without callbacks
 */
export function MinimalExample() {
  // Just track connection status
  const { status } = useRealtimeOrders();
  
  return (
    <div>
      <p>Status: {status}</p>
    </div>
  );
}
