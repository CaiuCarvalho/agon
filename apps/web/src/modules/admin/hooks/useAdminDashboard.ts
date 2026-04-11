// useAdminDashboard Hook
// Manages dashboard state and data fetching with real-time updates

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DashboardMetrics, OrderStatus } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useAdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/dashboard');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch dashboard metrics');
      }
      
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Update metrics when order changes
  const updateMetricsOnOrderChange = useCallback((
    payload: any,
    eventType: 'INSERT' | 'UPDATE'
  ) => {
    setMetrics((prevMetrics) => {
      if (!prevMetrics) return prevMetrics;
      
      const newMetrics = { ...prevMetrics };
      const order = payload.new;
      const oldOrder = eventType === 'UPDATE' ? payload.old : null;
      
      if (eventType === 'INSERT') {
        // New order created
        const status = order.status as OrderStatus;
        
        // Update order counts
        if (status in newMetrics.orderCounts) {
          newMetrics.orderCounts[status as keyof typeof newMetrics.orderCounts]++;
        }
        
        // Update total revenue if order is processing or beyond
        if (['processing', 'shipped', 'delivered'].includes(status)) {
          newMetrics.totalRevenue += order.total_amount || 0;
        }
        
        // Recalculate average order value
        const totalOrders = Object.values(newMetrics.orderCounts).reduce((sum, count) => sum + count, 0);
        if (totalOrders > 0) {
          newMetrics.averageOrderValue = newMetrics.totalRevenue / totalOrders;
        }
      } else if (eventType === 'UPDATE' && oldOrder) {
        // Order status changed
        const oldStatus = oldOrder.status as OrderStatus;
        const newStatus = order.status as OrderStatus;
        
        if (oldStatus !== newStatus) {
          // Decrement old status count
          if (oldStatus in newMetrics.orderCounts) {
            newMetrics.orderCounts[oldStatus as keyof typeof newMetrics.orderCounts]--;
          }
          
          // Increment new status count
          if (newStatus in newMetrics.orderCounts) {
            newMetrics.orderCounts[newStatus as keyof typeof newMetrics.orderCounts]++;
          }
          
          // Update revenue if status changed to/from processing/shipped/delivered
          const oldStatusCountsForRevenue = ['processing', 'shipped', 'delivered'].includes(oldStatus);
          const newStatusCountsForRevenue = ['processing', 'shipped', 'delivered'].includes(newStatus);
          
          if (!oldStatusCountsForRevenue && newStatusCountsForRevenue) {
            // Order moved to revenue-counting status
            newMetrics.totalRevenue += order.total_amount || 0;
          } else if (oldStatusCountsForRevenue && !newStatusCountsForRevenue) {
            // Order moved out of revenue-counting status
            newMetrics.totalRevenue -= order.total_amount || 0;
          }
          
          // Recalculate average order value
          const totalOrders = Object.values(newMetrics.orderCounts).reduce((sum, count) => sum + count, 0);
          if (totalOrders > 0) {
            newMetrics.averageOrderValue = newMetrics.totalRevenue / totalOrders;
          }
        }
      }
      
      return newMetrics;
    });
  }, []);
  
  // Set up real-time subscription
  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    
    const setupRealtimeSubscription = () => {
      const supabase = createClient();
      
      channel = supabase
        .channel('admin-dashboard-orders')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
          },
          (payload) => {
            console.log('[Dashboard] New order created:', payload);
            updateMetricsOnOrderChange(payload, 'INSERT');
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
          },
          (payload) => {
            console.log('[Dashboard] Order updated:', payload);
            updateMetricsOnOrderChange(payload, 'UPDATE');
          }
        )
        .subscribe((status) => {
          console.log('[Dashboard] Subscription status:', status);
        });
    };
    
    // Fetch initial data
    fetchMetrics();
    
    // Set up real-time subscription after initial fetch
    setupRealtimeSubscription();
    
    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [fetchMetrics, updateMetricsOnOrderChange]);
  
  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  };
}
