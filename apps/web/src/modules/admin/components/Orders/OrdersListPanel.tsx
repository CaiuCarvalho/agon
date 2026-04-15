'use client';

import { useEffect, useRef } from 'react';
import type { OrderWithDetails } from '../../types';
import type { OrdersListFilters } from '../../hooks/useOrdersList';
import { OrdersSearchBar } from './OrdersSearchBar';
import { OrderListItem } from './OrderListItem';

interface Props {
  orders: OrderWithDetails[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  filters: OrdersListFilters;
  setFilters: (next: OrdersListFilters) => void;
  clearFilters: () => void;
  loadMore: () => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function OrdersListPanel(props: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !props.hasMore) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) props.loadMore();
    }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [props.hasMore, props.loadMore]);

  const handleClear = () => {
    props.setSearch('');
    props.clearFilters();
  };

  return (
    <div className="border-r flex flex-col h-full overflow-hidden">
      <OrdersSearchBar
        search={props.search}
        onSearchChange={props.setSearch}
        filters={props.filters}
        onFiltersChange={props.setFilters}
        onClear={handleClear}
      />
      <div className="flex-1 overflow-y-auto">
        {props.error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border-b">{props.error}</div>
        )}
        {props.loading && props.orders.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : props.orders.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Nenhum pedido encontrado</div>
        ) : (
          <>
            {props.orders.map(o => (
              <OrderListItem
                key={o.id}
                order={o}
                selected={o.id === props.selectedId}
                onClick={() => props.onSelect(o.id)}
              />
            ))}
            {props.hasMore && (
              <div ref={sentinelRef} className="p-3 text-center text-xs text-muted-foreground">
                {props.loadingMore ? 'Carregando mais...' : ''}
              </div>
            )}
          </>
        )}
      </div>
      <div className="px-3 py-2 border-t text-xs text-muted-foreground">
        {props.orders.length} de {props.total}
      </div>
    </div>
  );
}
