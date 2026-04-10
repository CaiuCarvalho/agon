// useAdminOrders Hook
// Manages order state, filtering, and pagination

import { useState, useEffect } from 'react';
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
  
  const fetchOrders = async (pageNum: number = page, newFilters: OrderFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
      });
      
      if (newFilters.paymentStatus) {
        params.append('paymentStatus', newFilters.paymentStatus);
      }
      if (newFilters.shippingStatus) {
        params.append('shippingStatus', newFilters.shippingStatus);
      }
      
      const response = await fetch(`/api/admin/orders?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch orders');
      }
      
      const result = await response.json();
      setData(result);
      setPage(pageNum);
      setFilters(newFilters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const applyFilters = (newFilters: OrderFilters) => {
    fetchOrders(1, newFilters);
  };
  
  const clearFilters = () => {
    fetchOrders(1, {});
  };
  
  const refresh = () => {
    fetchOrders(page, filters);
  };
  
  useEffect(() => {
    fetchOrders(1);
  }, []);
  
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
