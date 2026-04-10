// ShippingStatusBadge Component
// Displays shipping status with color coding

import type { ShippingStatus } from '../../types';

interface ShippingStatusBadgeProps {
  status: ShippingStatus;
}

export function ShippingStatusBadge({ status }: ShippingStatusBadgeProps) {
  const styles: Record<ShippingStatus, string> = {
    pending: 'bg-gray-100 text-gray-800 border border-gray-200',
    processing: 'bg-blue-100 text-blue-800 border border-blue-200',
    shipped: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    delivered: 'bg-green-100 text-green-800 border border-green-200',
  };
  
  const labels: Record<ShippingStatus, string> = {
    pending: 'Pendente',
    processing: 'Processando',
    shipped: 'Enviado',
    delivered: 'Entregue',
  };
  
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
