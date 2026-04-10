// OrderFilters Component
// Provides payment and shipping status filters

import type { PaymentStatus, ShippingStatus } from '../../types';

interface OrderFiltersProps {
  paymentStatus?: PaymentStatus;
  shippingStatus?: ShippingStatus;
  onFilterChange: (filters: { paymentStatus?: PaymentStatus; shippingStatus?: ShippingStatus }) => void;
  onClear: () => void;
}

export function OrderFilters({ paymentStatus, shippingStatus, onFilterChange, onClear }: OrderFiltersProps) {
  const handlePaymentStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as PaymentStatus | '';
    onFilterChange({
      paymentStatus: value || undefined,
      shippingStatus,
    });
  };
  
  const handleShippingStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as ShippingStatus | '';
    onFilterChange({
      paymentStatus,
      shippingStatus: value || undefined,
    });
  };
  
  const hasFilters = paymentStatus || shippingStatus;
  
  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Filters</h3>
        {hasFilters && (
          <button
            onClick={onClear}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Clear all
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700 mb-1">
            Payment Status
          </label>
          <select
            id="paymentStatus"
            value={paymentStatus || ''}
            onChange={handlePaymentStatusChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
            <option value="in_process">In Process</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="shippingStatus" className="block text-sm font-medium text-gray-700 mb-1">
            Shipping Status
          </label>
          <select
            id="shippingStatus"
            value={shippingStatus || ''}
            onChange={handleShippingStatusChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>
    </div>
  );
}
