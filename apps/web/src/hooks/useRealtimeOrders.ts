"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Order } from '@/modules/admin/types';

/**
 * Options for useRealtimeOrders hook
 */
export interface UseRealtimeOrdersOptions {
  /**
   * Callback fired when a new order is inserted
   */
  onInsert?: (order: Order) => void;
  
  /**
   * Callback fired when an order is updated
   * @param order - The updated order
   * @param oldOrder - The previous order state (if available)
   */
  onUpdate?: (order: Order, oldOrder?: Order) => void;
  
  /**
   * Callback fired when an error occurs
   */
  onError?: (error: Error) => void;
}

/**
 * Return value from useRealtimeOrders hook
 */
export interface UseRealtimeOrdersReturn {
  /**
   * Current connection status
   */
  status: 'connected' | 'disconnected' | 'error';
  
  /**
   * Manually trigger reconnection
   */
  reconnect: () => void;
}

/**
 * Hook for subscribing to real-time order updates from Supabase
 * 
 * Features:
 * - Subscribes to INSERT events on orders table
 * - Subscribes to UPDATE events where status changed to 'processing'
 * - Automatic reconnection with exponential backoff (5 attempts)
 * - Cleanup on component unmount
 * 
 * @param options - Configuration options with callbacks
 * @returns Connection status and reconnect function
 * 
 * @example
 * ```tsx
 * const { status, reconnect } = useRealtimeOrders({
 *   onInsert: (order) => {
 *     console.log('New order:', order);
 *     toast.success(`New order #${order.id}`);
 *   },
 *   onUpdate: (order) => {
 *     console.log('Order updated:', order);
 *   },
 *   onError: (error) => {
 *     console.error('Realtime error:', error);
 *   }
 * });
 * ```
 */
export function useRealtimeOrders(
  options: UseRealtimeOrdersOptions = {}
): UseRealtimeOrdersReturn {
  const { onInsert, onUpdate, onError } = options;

  // Keep latest callbacks in refs so subscription never needs to be rebuilt
  // when the parent re-renders and passes new callback references
  const onInsertRef = useRef(onInsert);
  const onUpdateRef = useRef(onUpdate);
  const onErrorRef = useRef(onError);

  useEffect(() => { onInsertRef.current = onInsert; }, [onInsert]);
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const [status, setStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;
  
  /**
   * Calculate exponential backoff delay
   * Delays: 1s, 2s, 4s, 8s, 16s
   */
  const getBackoffDelay = useCallback((attempt: number): number => {
    return Math.min(1000 * Math.pow(2, attempt), 16000);
  }, []);
  
  /**
   * Convert snake_case database row to camelCase Order object
   */
  const transformOrder = useCallback((row: any): Order => {
    return {
      id: row.id,
      userId: row.user_id,
      status: row.status,
      totalAmount: row.total_amount,
      shippingName: row.shipping_name,
      shippingAddress: row.shipping_address,
      shippingCity: row.shipping_city,
      shippingState: row.shipping_state,
      shippingZip: row.shipping_zip,
      shippingPhone: row.shipping_phone,
      shippingEmail: row.shipping_email,
      paymentMethod: row.payment_method,
      shippingStatus: row.shipping_status,
      trackingCode: row.tracking_code,
      carrier: row.carrier,
      shippedAt: row.shipped_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }, []);
  
  /**
   * Setup Supabase Realtime subscription.
   * Uses callback refs so the subscription is created once and never rebuilt
   * due to parent re-renders passing new callback references.
   */
  const setupSubscription = useCallback(() => {
    try {
      const supabase = createClient();

      // Create channel for admin orders
      const channel = supabase
        .channel('admin-orders')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders'
          },
          (payload) => {
            try {
              const newOrder = transformOrder(payload.new);
              onInsertRef.current?.(newOrder);
            } catch (error) {
              console.error('Error processing INSERT event:', error);
              onErrorRef.current?.(error instanceof Error ? error : new Error('Unknown error'));
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: 'status=eq.processing'
          },
          (payload) => {
            try {
              const updatedOrder = transformOrder(payload.new);
              const oldOrder = payload.old ? transformOrder(payload.old) : undefined;
              onUpdateRef.current?.(updatedOrder, oldOrder);
            } catch (error) {
              console.error('Error processing UPDATE event:', error);
              onErrorRef.current?.(error instanceof Error ? error : new Error('Unknown error'));
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setStatus('connected');
            reconnectAttemptsRef.current = 0; // Reset attempts on successful connection
            console.log('[useRealtimeOrders] Successfully subscribed to admin-orders channel');
          } else if (status === 'CHANNEL_ERROR') {
            setStatus('error');
            console.error('[useRealtimeOrders] Channel error');
            handleReconnect();
          } else if (status === 'TIMED_OUT') {
            setStatus('error');
            console.error('[useRealtimeOrders] Connection timed out');
            handleReconnect();
          } else if (status === 'CLOSED') {
            setStatus('disconnected');
            console.warn('[useRealtimeOrders] Channel closed');
          }
        });

      channelRef.current = channel;
    } catch (error) {
      console.error('[useRealtimeOrders] Error setting up subscription:', error);
      setStatus('error');
      onErrorRef.current?.(error instanceof Error ? error : new Error('Failed to setup subscription'));
      handleReconnect();
    }
  }, [transformOrder]); // removed onInsert/onUpdate/onError — accessed via stable refs
  
  /**
   * Handle reconnection with exponential backoff
   */
  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('[useRealtimeOrders] Max reconnection attempts reached');
      setStatus('error');
      const error = new Error('Failed to reconnect after maximum attempts');
      onErrorRef.current?.(error);
      return;
    }
    
    const delay = getBackoffDelay(reconnectAttemptsRef.current);
    reconnectAttemptsRef.current += 1;
    
    console.log(
      `[useRealtimeOrders] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
    );
    
    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      cleanup();
      setupSubscription();
    }, delay);
  }, [getBackoffDelay, setupSubscription]); // onError accessed via ref
  
  /**
   * Cleanup subscription and timeouts
   */
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      const supabase = createClient();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);
  
  /**
   * Manual reconnect function
   */
  const reconnect = useCallback(() => {
    console.log('[useRealtimeOrders] Manual reconnect triggered');
    reconnectAttemptsRef.current = 0; // Reset attempts on manual reconnect
    cleanup();
    setupSubscription();
  }, [cleanup, setupSubscription]);
  
  // Setup subscription on mount
  useEffect(() => {
    setupSubscription();
    
    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [setupSubscription, cleanup]);
  
  return {
    status,
    reconnect
  };
}
