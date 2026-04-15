'use client';

import type { OrdersListFilters } from '../../hooks/useOrdersList';
import type { PaymentStatus, ShippingStatus } from '../../types';

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  filters: OrdersListFilters;
  onFiltersChange: (next: OrdersListFilters) => void;
  onClear: () => void;
}

const PAYMENT_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'pending', label: 'Pag. Pendente' },
  { value: 'approved', label: 'Pag. Aprovado' },
  { value: 'rejected', label: 'Pag. Rejeitado' },
  { value: 'cancelled', label: 'Pag. Cancelado' },
  { value: 'refunded', label: 'Pag. Reembolsado' },
  { value: 'in_process', label: 'Pag. Em processo' },
];

const SHIPPING_OPTIONS: { value: ShippingStatus; label: string }[] = [
  { value: 'pending', label: 'Env. Pendente' },
  { value: 'processing', label: 'Env. Processando' },
  { value: 'shipped', label: 'Env. Enviado' },
  { value: 'delivered', label: 'Env. Entregue' },
];

export function OrdersSearchBar({ search, onSearchChange, filters, onFiltersChange, onClear }: Props) {
  const hasAny = !!search || !!filters.paymentStatus || !!filters.shippingStatus;
  return (
    <div className="p-3 border-b space-y-2 bg-background sticky top-0 z-10">
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Buscar por nome ou ID..."
        className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <div className="flex gap-2">
        <select
          value={filters.paymentStatus ?? ''}
          onChange={(e) => onFiltersChange({ ...filters, paymentStatus: (e.target.value || undefined) as PaymentStatus | undefined })}
          className="flex-1 px-2 py-1.5 text-xs border rounded-md bg-background"
        >
          <option value="">Pagamento</option>
          {PAYMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={filters.shippingStatus ?? ''}
          onChange={(e) => onFiltersChange({ ...filters, shippingStatus: (e.target.value || undefined) as ShippingStatus | undefined })}
          className="flex-1 px-2 py-1.5 text-xs border rounded-md bg-background"
        >
          <option value="">Envio</option>
          {SHIPPING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {hasAny && (
        <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground underline">
          Limpar filtros
        </button>
      )}
    </div>
  );
}
