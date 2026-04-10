// useAdminDashboard Hook
// Manages dashboard state and data fetching

import { useState, useEffect } from 'react';
import type { DashboardMetrics } from '../types';

export function useAdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchMetrics = async () => {
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
  };
  
  useEffect(() => {
    fetchMetrics();
  }, []);
  
  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  };
}
