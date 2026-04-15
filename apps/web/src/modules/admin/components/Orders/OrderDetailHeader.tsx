'use client';

import type { OrderWithDetails } from '../../types';
import { ShippingStatusBadge } from '../Fulfillment/ShippingStatusBadge';

const PAYMENT_LABEL: Record<string, string> = {
  pending: 'Pagamento Pendente',
  approved: 'Pagamento Aprovado',
  rejected: 'Pagamento Rejeitado',
  cancelled: 'Pagamento Cancelado',
  refunded: 'Reembolsado',
  in_process: 'Em Processo',
};

const PAYMENT_CLASS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
  refunded: 'bg-purple-100 text-purple-800 border-purple-200',
  in_process: 'bg-blue-100 text-blue-800 border-blue-200',
};

export function OrderDetailHeader({ order }: { order: OrderWithDetails }) {
  const created = new Date(order.createdAt).toLocaleString('pt-BR');
  return (
    <div className="px-5 py-4 border-b flex items-start justify-between gap-4">
      <div>
        <div className="text-xs text-muted-foreground">Pedido</div>
        <div className="font-mono text-sm font-semibold">#{order.id.slice(0, 8)}</div>
        <div className="text-xs text-muted-foreground mt-1">{created}</div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${PAYMENT_CLASS[order.payment.status] ?? ''}`}>
          {PAYMENT_LABEL[order.payment.status] ?? order.payment.status}
        </span>
        <ShippingStatusBadge status={order.shippingStatus} />
      </div>
    </div>
  );
}
