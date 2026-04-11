// Metrics Card Component
// Displays individual metric with formatting and icon

import { 
  DollarSign, 
  Clock, 
  Package, 
  TrendingUp,
  ShoppingCart,
  Truck,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: number;
  format: 'currency' | 'number';
  icon?: 'revenue' | 'pending' | 'processing' | 'average' | 'cart' | 'shipped' | 'delivered' | 'cancelled';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const iconMap = {
  revenue: DollarSign,
  pending: Clock,
  processing: Package,
  average: TrendingUp,
  cart: ShoppingCart,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

const iconColorMap = {
  revenue: 'text-green-600 bg-green-100',
  pending: 'text-yellow-600 bg-yellow-100',
  processing: 'text-blue-600 bg-blue-100',
  average: 'text-purple-600 bg-purple-100',
  cart: 'text-indigo-600 bg-indigo-100',
  shipped: 'text-cyan-600 bg-cyan-100',
  delivered: 'text-emerald-600 bg-emerald-100',
  cancelled: 'text-red-600 bg-red-100',
};

export function MetricsCard({ title, value, format, icon, trend }: MetricsCardProps) {
  const formattedValue = format === 'currency'
    ? new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value)
    : value.toLocaleString('pt-BR');
  
  const Icon = icon ? iconMap[icon] : null;
  const iconColorClass = icon ? iconColorMap[icon] : 'text-gray-600 bg-gray-100';
  
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {Icon && (
          <div className={`p-2 rounded-lg ${iconColorClass}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold text-gray-900">{formattedValue}</p>
        {trend && (
          <div className={`flex items-center text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <span>{trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
