'use client';

import { useState } from 'react';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import { OrderTable } from './OrderTable';
import { OrderFilters } from './OrderFilters';
import { ShippingUpdateModal } from '../Fulfillment/ShippingUpdateModal';
import type { OrderWithDetails } from '../../types';

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
  
  const handleUpdateShipping = (order: OrderWithDetails) => {
    setSelectedOrder(order);
  };
  
  const handleCloseModal = () => {
    setSelectedOrder(null);
  };
  
  const handleSuccess = () => {
    refresh();
  };
  
  if (loading && orders.length === 0) {
    return <div className="p-6">Loading...</div>;
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <button
          onClick={refresh}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      <OrderFilters
        paymentStatus={filters.paymentStatus}
        shippingStatus={filters.shippingStatus}
        onFilterChange={applyFilters}
        onClear={clearFilters}
      />
      
      <OrderTable orders={orders} onUpdateShipping={handleUpdateShipping} />
      
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-700">
          Showing {orders.length} of {total} orders
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => fetchOrders(page - 1)}
            disabled={page === 1 || loading}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            Page {page}
          </span>
          <button
            onClick={() => fetchOrders(page + 1)}
            disabled={page * pageSize >= total || loading}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
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
