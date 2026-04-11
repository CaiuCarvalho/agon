import { cn } from '@/lib/utils';

export type OrderStatus = 
  | 'pending' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const statusConfig: Record<OrderStatus, { label: string; colorClass: string }> = {
  pending: {
    label: 'Pendente',
    colorClass: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  processing: {
    label: 'Processando',
    colorClass: 'bg-green-100 text-green-800 border-green-200'
  },
  shipped: {
    label: 'Enviado',
    colorClass: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  delivered: {
    label: 'Entregue',
    colorClass: 'bg-gray-100 text-gray-800 border-gray-200'
  },
  cancelled: {
    label: 'Cancelado',
    colorClass: 'bg-red-100 text-red-800 border-red-200'
  }
};

/**
 * Badge component for displaying order status with color coding
 * 
 * @param status - Current order status
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <OrderStatusBadge status="processing" />
 * ```
 */
export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.colorClass,
        className
      )}
      role="status"
      aria-label={`Status do pedido: ${config.label}`}
    >
      {config.label}
    </span>
  );
}
