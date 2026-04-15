// useOrdersList — list management for the split-view orders page
// Infinite scroll + search + filters + realtime updates

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { OrderWithDetails, PaymentStatus, ShippingStatus } from '../types';

export interface OrdersListFilters {
  paymentStatus?: PaymentStatus;
  shippingStatus?: ShippingStatus;
}

interface FetchResponse {
  orders: OrderWithDetails[];
  total: number;
  page: number;
  pageSize: number;
}

const SEARCH_DEBOUNCE_MS = 300;

export function useOrdersList() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearchState] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<OrdersListFilters>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch a page of orders
  const fetchPage = useCallback(async (pageNum: number, currentSearch: string, currentFilters: OrdersListFilters, append: boolean) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      const params = new URLSearchParams({ page: pageNum.toString() });
      if (currentFilters.paymentStatus) params.append('paymentStatus', currentFilters.paymentStatus);
      if (currentFilters.shippingStatus) params.append('shippingStatus', currentFilters.shippingStatus);
      if (currentSearch) params.append('search', currentSearch);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Falha ao carregar pedidos');
      }
      const data: FetchResponse = await res.json();

      setTotal(data.total);
      setPageSize(data.pageSize);
      setPage(pageNum);
      setOrders(prev => append ? [...prev, ...data.orders] : data.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Reset + fetch when search or filters change
  useEffect(() => {
    fetchPage(1, debouncedSearch, filters, false);
  }, [debouncedSearch, filters, fetchPage]);

  const loadMore = useCallback(() => {
    if (loadingMore || loading) return;
    if (orders.length >= total) return;
    fetchPage(page + 1, debouncedSearch, filters, true);
  }, [loadingMore, loading, orders.length, total, page, debouncedSearch, filters, fetchPage]);

  const refresh = useCallback(() => {
    fetchPage(1, debouncedSearch, filters, false);
  }, [debouncedSearch, filters, fetchPage]);

  const setSearch = useCallback((value: string) => setSearchState(value), []);
  const updateFilters = useCallback((next: OrdersListFilters) => setFilters(next), []);
  const clearFilters = useCallback(() => setFilters({}), []);
  const select = useCallback((id: string | null) => setSelectedId(id), []);

  // Realtime: subscribe to orders INSERT/UPDATE to keep the list fresh
  const ordersRef = useRef(orders);
  ordersRef.current = orders;

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('admin-orders-list')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        const updated = payload.new as any;
        setOrders(prev => prev.map(o => o.id === updated.id ? {
          ...o,
          status: updated.status,
          shippingStatus: updated.shipping_status,
          trackingCode: updated.tracking_code,
          carrier: updated.carrier,
          shippedAt: updated.shipped_at,
          updatedAt: updated.updated_at,
        } : o));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        // New order arrived — refetch first page to get full joined data
        fetchPage(1, debouncedSearch, filters, false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [debouncedSearch, filters, fetchPage]);

  return {
    orders,
    total,
    page,
    pageSize,
    hasMore: orders.length < total,
    loading,
    loadingMore,
    error,
    search,
    setSearch,
    filters,
    setFilters: updateFilters,
    clearFilters,
    loadMore,
    refresh,
    selectedId,
    select,
  };
}
