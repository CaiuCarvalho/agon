'use client';

import { useOrdersList } from '../../hooks/useOrdersList';
import { OrdersListPanel } from './OrdersListPanel';
import { OrderDetailPanel } from './OrderDetailPanel';

export function OrdersSplitView() {
  const list = useOrdersList();

  return (
    <div className="grid grid-cols-[380px_1fr] h-[calc(100vh-64px)]">
      <OrdersListPanel
        orders={list.orders}
        total={list.total}
        loading={list.loading}
        loadingMore={list.loadingMore}
        hasMore={list.hasMore}
        error={list.error}
        search={list.search}
        setSearch={list.setSearch}
        filters={list.filters}
        setFilters={list.setFilters}
        clearFilters={list.clearFilters}
        loadMore={list.loadMore}
        selectedId={list.selectedId}
        onSelect={list.select}
      />
      <OrderDetailPanel orderId={list.selectedId} onUpdated={list.refresh} />
    </div>
  );
}
