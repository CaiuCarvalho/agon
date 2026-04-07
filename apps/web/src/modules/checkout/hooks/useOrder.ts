"use client";

import { useQuery } from '@tanstack/react-query';
import { orderService, OrderWithItems } from '../services/orderService';

/**
 * Hook for fetching a single order by ID
 * Implements caching with 5-minute stale time
 * RLS policies ensure users can only access their own orders
 */
export function useOrder(orderId: string | null) {
  return useQuery<OrderWithItems | null>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) {
        return null;
      }
      return await orderService.getOrderById(orderId);
    },
    enabled: !!orderId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook for fetching user's orders with pagination
 */
export function useUserOrders(page: number = 1, pageSize: number = 10) {
  return useQuery({
    queryKey: ['orders', 'user', page, pageSize],
    queryFn: async () => {
      return await orderService.getUserOrders(page, pageSize);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
