'use client';

// Dashboard Page Component
// Main dashboard page with metrics and recent orders

import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { MetricsCard } from './MetricsCard';
import { RecentOrdersList } from './RecentOrdersList';
import { LoadingSkeleton } from './LoadingSkeleton';
import { RefreshCw } from 'lucide-react';

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
  
  const totalOrders = Object.values(metrics.orderCounts).reduce((sum, count) => sum + count, 0);
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600">Atualizações em tempo real ativas</span>
            </div>
          </div>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>
      
      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Receita Total"
          value={metrics.totalRevenue}
          format="currency"
          icon="revenue"
        />
        <MetricsCard
          title="Total de Pedidos"
          value={totalOrders}
          format="number"
          icon="cart"
        />
        <MetricsCard
          title="Pedidos Pendentes"
          value={metrics.orderCounts.pending}
          format="number"
          icon="pending"
        />
        <MetricsCard
          title="Ticket Médio"
          value={metrics.averageOrderValue}
          format="currency"
          icon="average"
        />
      </div>
      
      {/* Order Status Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo de Status dos Pedidos</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-gray-600 mb-1">Pendente</p>
            <p className="text-2xl font-bold text-yellow-600">{metrics.orderCounts.pending}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Processando</p>
            <p className="text-2xl font-bold text-blue-600">{metrics.orderCounts.processing}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-gray-600 mb-1">Enviado</p>
            <p className="text-2xl font-bold text-purple-600">{metrics.orderCounts.shipped}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600 mb-1">Entregue</p>
            <p className="text-2xl font-bold text-green-600">{metrics.orderCounts.delivered}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-gray-600 mb-1">Cancelado</p>
            <p className="text-2xl font-bold text-red-600">{metrics.orderCounts.cancelled}</p>
          </div>
        </div>
      </div>
      
      {/* Recent Orders */}
      <RecentOrdersList orders={metrics.recentOrders} />
    </div>
  );
}
