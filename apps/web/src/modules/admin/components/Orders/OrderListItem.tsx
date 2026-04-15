'use client';

import type { OrderWithDetails, ShippingStatus } from '../../types';

interface Props {
  order: OrderWithDetails;
  selected: boolean;
  onClick: () => void;
}

const DOT_COLOR: Record<ShippingStatus, string> = {
  pending: 'text-gray-400',
  processing: 'text-blue-500',
  shipped: 'text-indigo-500',
  delivered: 'text-green-500',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function formatBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export function OrderListItem({ order, selected, onClick }: Props) {
  const paymentPending = order.payment.status === 'pending';
  const ageMs = Date.now() - new Date(order.createdAt).getTime();
  const overdue = paymentPending && ageMs > 24 * 60 * 60 * 1000;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 border-b transition-colors ${
        selected ? 'bg-muted' : 'hover:bg-muted/50'
      } ${overdue ? 'border-l-4 border-l-orange-500' : ''}`}
    >
      <div className="flex items-start gap-2">
        <span className={`text-lg leading-none ${DOT_COLOR[order.shippingStatus]}`}>●</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-medium text-sm truncate">{order.shippingName}</span>
            <span className="text-xs text-muted-foreground shrink-0">{timeAgo(order.createdAt)}</span>
          </div>
          <div className="flex items-baseline justify-between gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground truncate">
              {order.shippingCity} · #{order.id.slice(0, 8)}
            </span>
            <span className="text-xs font-semibold shrink-0">{formatBRL(order.totalAmount)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
