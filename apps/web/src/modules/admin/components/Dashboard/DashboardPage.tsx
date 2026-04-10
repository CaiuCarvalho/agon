'use client';

// Dashboard Page Component
// Main dashboard page with metrics and recent orders

import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { MetricsCard } from './MetricsCard';
import { RecentOrdersList } from './RecentOrdersList';
import { LoadingSkeleton } from './LoadingSkeleton';

export function DashboardPage() {
  const { metrics, loading, error, refetch } = useAdminDashboard();
  
  if (loading) {
    return <LoadingSkeleton />;
  }
  
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error loading dashboard</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            onClick={refetch}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  if (!metrics) {
    return null;
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={refetch}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          Refresh
        </button>
      </div>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Total Revenue"
          value={metrics.totalRevenue}
          format="currency"
        />
        <MetricsCard
          title="Pending Orders"
          value={metrics.orderCounts.pending}
          format="number"
        />
        <MetricsCard
          title="Processing Orders"
          value={metrics.orderCounts.processing}
          format="number"
        />
        <MetricsCard
          title="Average Order Value"
          value={metrics.averageOrderValue}
          format="currency"
        />
      </div>
      
      {/* Order Status Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{metrics.orderCounts.pending}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Processing</p>
            <p className="text-2xl font-bold text-blue-600">{metrics.orderCounts.processing}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Shipped</p>
            <p className="text-2xl font-bold text-purple-600">{metrics.orderCounts.shipped}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Delivered</p>
            <p className="text-2xl font-bold text-green-600">{metrics.orderCounts.delivered}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Cancelled</p>
            <p className="text-2xl font-bold text-red-600">{metrics.orderCounts.cancelled}</p>
          </div>
        </div>
      </div>
      
      {/* Recent Orders */}
      <RecentOrdersList orders={metrics.recentOrders} />
    </div>
  );
}
