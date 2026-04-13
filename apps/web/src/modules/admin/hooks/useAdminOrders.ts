// useAdminOrders Hook
// Manages order state, filtering, and pagination

import { useState, useEffect, useCallback, useRef } from 'react';
import type { OrderWithDetails, PaymentStatus, ShippingStatus } from '../types';

interface OrderListData {
  orders: OrderWithDetails[];
  total: number;
  page: number;
  pageSize: number;
}

interface OrderFilters {
  paymentStatus?: PaymentStatus;
  shippingStatus?: ShippingStatus;
}

export function useAdminOrders() {
  const [data, setData] = useState<OrderListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<OrderFilters>({});

  // Refs hold the current page/filters so fetchOrders doesn't need them as deps
  const pageRef = useRef(1);
  const filtersRef = useRef<OrderFilters>({});

  // Stable function — uses refs for defaults, no closure over page/filters state
  const fetchOrders = useCallback(async (pageNum?: number, newFilters?: OrderFilters) => {
    const actualPage = pageNum ?? pageRef.current;
    const actualFilters = newFilters ?? filtersRef.current;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: actualPage.toString(),
      });

      if (actualFilters.paymentStatus) {
        params.append('paymentStatus', actualFilters.paymentStatus);
      }
      if (actualFilters.shippingStatus) {
        params.append('shippingStatus', actualFilters.shippingStatus);
      }

      const response = await fetch(`/api/admin/orders?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch orders');
      }

      const result = await response.json();
      setData(result);
      setPage(actualPage);
      setFilters(actualFilters);
      pageRef.current = actualPage;
      filtersRef.current = actualFilters;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []); // empty deps — stable reference throughout component lifetime

  const applyFilters = useCallback((newFilters: OrderFilters) => {
    fetchOrders(1, newFilters);
  }, [fetchOrders]);

  const clearFilters = useCallback(() => {
    fetchOrders(1, {});
  }, [fetchOrders]);

  // refresh() always uses the current page/filters from refs
  const refresh = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  return {
    orders: data?.orders || [],
    total: data?.total || 0,
    page,
    pageSize: data?.pageSize || 20,
    loading,
    error,
    filters,
    fetchOrders,
    applyFilters,
    clearFilters,
    refresh,
  };
}
