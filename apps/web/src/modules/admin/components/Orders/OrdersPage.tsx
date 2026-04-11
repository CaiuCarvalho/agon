'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications';
import { useSoundAlert } from '@/hooks/useSoundAlert';
import { useNotificationPreferences } from '@/components/admin/NotificationPreferences';
import { OrderTable } from './OrderTable';
import { OrderFilters } from './OrderFilters';
import { ShippingUpdateModal } from '../Fulfillment/ShippingUpdateModal';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import type { OrderWithDetails, Order } from '../../types';

export function OrdersPage() {
  const {
    orders,
    total,
    page,
    pageSize,
    loading,
    error,
    filters,
    fetchOrders,
    applyFilters,
    clearFilters,
    refresh,
  } = useAdminOrders();
  
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [localOrders, setLocalOrders] = useState<OrderWithDetails[]>(orders);
  
  // Notification hooks
  const preferences = useNotificationPreferences();
  const { notifyNewOrder, notifyOrderUpdate } = useOrderNotifications();
  const { notifyNewOrder: notifyBrowser } = useBrowserNotifications();
  const { playSound } = useSoundAlert();
  
  // Real-time subscription
  const { status: connectionStatus, reconnect } = useRealtimeOrders({
    onInsert: useCallback((order: Order) => {
      console.log('[OrdersPage] New order inserted:', order);
      
      // Refresh orders list to get full details
      refresh();
      
      // Show notifications based on preferences
      if (preferences.toast) {
        notifyNewOrder(order);
      }
      
      if (preferences.browser && order.status === 'processing') {
        notifyBrowser(order);
      }
      
      if (preferences.sound && order.status === 'processing') {
        playSound();
      }
    }, [preferences, notifyNewOrder, notifyBrowser, playSound, refresh]),
    
    onUpdate: useCallback((order: Order, oldOrder?: Order) => {
      console.log('[OrdersPage] Order updated:', order, 'Old:', oldOrder);
      
      // Refresh orders list to get full details
      refresh();
      
      // Only notify if status changed to processing (payment approved)
      if (order.status === 'processing' && oldOrder?.status !== 'processing') {
        if (preferences.toast) {
          notifyOrderUpdate(order, oldOrder?.status);
        }
        
        if (preferences.browser) {
          notifyBrowser(order);
        }
        
        if (preferences.sound) {
          playSound();
        }
      }
    }, [preferences, notifyOrderUpdate, notifyBrowser, playSound, refresh]),
    
    onError: useCallback((error: Error) => {
      console.error('[OrdersPage] Realtime error:', error);
    }, [])
  });
  
  // Update local orders when orders prop changes
  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);
  
  const handleUpdateShipping = (order: OrderWithDetails) => {
    setSelectedOrder(order);
  };
  
  const handleCloseModal = () => {
    setSelectedOrder(null);
  };
  
  const handleSuccess = () => {
    refresh();
  };
  
  const handleReconnect = () => {
    reconnect();
  };
  
  if (loading && localOrders.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          
          {/* Connection Status Indicator */}
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' ? (
              <div className="flex items-center gap-1.5 text-green-600">
                <Wifi className="w-4 h-4" />
                <span className="text-xs font-medium">Conectado</span>
              </div>
            ) : connectionStatus === 'error' ? (
              <div className="flex items-center gap-1.5 text-red-600">
                <WifiOff className="w-4 h-4" />
                <span className="text-xs font-medium">Desconectado</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-yellow-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-xs font-medium">Conectando...</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          {connectionStatus === 'error' && (
            <button
              onClick={handleReconnect}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reconectar
            </button>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      {connectionStatus === 'error' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            <strong>Conexão em tempo real perdida.</strong> As atualizações automáticas estão desabilitadas. 
            Clique em "Reconectar" para restaurar as notificações em tempo real.
          </p>
        </div>
      )}
      
      <OrderFilters
        paymentStatus={filters.paymentStatus}
        shippingStatus={filters.shippingStatus}
        onFilterChange={applyFilters}
        onClear={clearFilters}
      />
      
      <OrderTable orders={localOrders} onUpdateShipping={handleUpdateShipping} />
      
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-700">
          Mostrando {localOrders.length} de {total} pedidos
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => fetchOrders(page - 1)}
            disabled={page === 1 || loading}
            className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-50"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            Página {page}
          </span>
          <button
            onClick={() => fetchOrders(page + 1)}
            disabled={page * pageSize >= total || loading}
            className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-50"
          >
            Próxima
          </button>
        </div>
      </div>
      
      {selectedOrder && (
        <ShippingUpdateModal
          order={selectedOrder}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
