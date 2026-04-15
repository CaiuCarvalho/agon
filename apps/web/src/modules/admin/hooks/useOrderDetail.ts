// useOrderDetail — fetch a single order with full details by id

import { useState, useEffect, useCallback } from 'react';
import type { OrderWithDetails } from '../types';

export function useOrderDetail(orderId: string | null) {
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/orders/${id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Falha ao carregar pedido');
      }
      const data = await res.json();
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      setError(null);
      return;
    }
    fetchOrder(orderId);
  }, [orderId, fetchOrder]);

  const refresh = useCallback(() => {
    if (orderId) fetchOrder(orderId);
  }, [orderId, fetchOrder]);

  return { order, loading, error, refresh };
}
