/**
 * useCart Hook
 * 
 * Manages cart data fetching, caching, and real-time synchronization.
 * 
 * Key features:
 * - Fetches cart from database (authenticated) or localStorage (guest)
 * - Subscribes to Supabase Realtime for cross-device sync
 * - Implements migration gate to prevent empty cart flash
 * - Handles reconnection with exponential backoff
 * - Provides polling fallback when Realtime fails
 * - Filters own events by client_id to prevent loops
 * - Calculates cart summary (totalItems, subtotal)
 * 
 * @module useCart
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { cartService } from '../services/cartService';
import { localStorageService } from '../services/localStorageService';
import { useMigrationStatus } from './useMigrationStatus';
import type { CartItem } from '../types';
import { transformCartItemRow } from '../utils/transformers';

// Generate unique client ID for this session to filter own events
const CLIENT_ID = crypto.randomUUID();

export function useCart() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const migrationStatus = useMigrationStatus();
  
  // Realtime reconnection state
  const reconnectAttempts = useRef(0);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const [reconnectTick, setReconnectTick] = useState(0);
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected' | 'idle'>('idle');

  /**
   * Stop polling fallback when Realtime reconnects
   */
  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  /**
   * Start polling fallback (30s interval) when Realtime fails
   */
  const startPolling = () => {
    if (pollingInterval.current || !user) return;

    // Set idle status when using polling fallback
    setRealtimeStatus('idle');

    pollingInterval.current = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['cart', user.id] });
    }, 30000); // Poll every 30s
  };

  /**
   * Handle Realtime reconnection with exponential backoff
   * Delays: 1s, 2s, 4s, 8s, max 30s
   */
  const handleReconnect = () => {
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
    reconnectAttempts.current++;

    // Start polling as fallback
    startPolling();

    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }

    reconnectTimeout.current = setTimeout(() => {
      setReconnectTick((prev) => prev + 1);
    }, delay);
  };
  
  // Fetch cart items (blocked until migration completes or errors)
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (user) {
        // Authenticated: fetch from database
        const items = await cartService.getCartItems(user.id);
        return items;
      } else {
        // Guest: fetch from localStorage and hydrate product data
        const localCart = localStorageService.getCart();
        if (localCart.items.length === 0) {
          return [];
        }

        const supabase = createClient();
        const productIds = Array.from(new Set(localCart.items.map((item) => item.productId)));
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds)
          .is('deleted_at', null);

        const productsById = new Map((products || []).map((product: any) => [product.id, product]));

        return localCart.items.map((item) => {
          const product = productsById.get(item.productId);

          return {
            id: `local:${item.productId}:${item.size}`,
            userId: '',
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            priceSnapshot: Number(product?.price || 0),
            productNameSnapshot: product?.name || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            product: product
              ? {
                  id: product.id,
                  name: product.name,
                  description: product.description,
                  price: Number(product.price || 0),
                  categoryId: product.category_id,
                  imageUrl: product.image_url,
                  stock: product.stock,
                  features: product.features || [],
                  rating: Number(product.rating || 0),
                  reviews: product.reviews || 0,
                  createdAt: product.created_at,
                  updatedAt: product.updated_at,
                  deletedAt: product.deleted_at,
                }
              : undefined,
          };
        }) as CartItem[];
      }
    },
    enabled: migrationStatus === 'complete' || migrationStatus === 'error', // Migration gate - allow queries even on error
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Subscribe to Realtime updates (authenticated users only)
  useEffect(() => {
    // Set idle status for guest users
    if (!user) {
      setRealtimeStatus('idle');
      return;
    }
    
    // Set idle status during migration
    if (migrationStatus !== 'complete' && migrationStatus !== 'error') {
      setRealtimeStatus('idle');
      return;
    }
    
    const supabase = createClient();
    
    // Use consistent channel name (no timestamp) to avoid duplicate channels
    const channelName = `cart:${user.id}`;
    
    // Remove any existing channel with the same name before creating a new one
    // Note: Supabase adds "realtime:" prefix, so we need to check if topic includes our channel name
    supabase.getChannels().forEach(ch => {
      if (ch.topic.includes(channelName)) {
        ch.unsubscribe();
        supabase.removeChannel(ch);
      }
    });
    
    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Cart realtime event:', payload);
          
          // Filter out events from this client to prevent loops
          if ((payload.new as any)?.client_id === CLIENT_ID) {
            return;
          }
          
          // Use setQueryData instead of invalidateQueries to apply deltas
          // This prevents refetch loops and provides instant updates
          queryClient.setQueryData(['cart', user.id], (old: CartItem[] = []) => {
            if (payload.eventType === 'INSERT') {
              // Add new item
              return [...old, transformCartItemRow(payload.new)];
            } else if (payload.eventType === 'UPDATE') {
              // Update existing item
              return old.map(item =>
                item.id === payload.new.id ? transformCartItemRow(payload.new) : item
              );
            } else if (payload.eventType === 'DELETE') {
              // Remove item
              return old.filter(item => item.id !== payload.old.id);
            }
            return old;
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
          reconnectAttempts.current = 0;
          if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
            reconnectTimeout.current = null;
          }
          stopPolling();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeStatus('disconnected');
          handleReconnect();
        }
      });
    
    return () => {
      // Properly unsubscribe and remove channel
      channel.unsubscribe();
      supabase.removeChannel(channel);
      stopPolling();
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
    };
  }, [user, queryClient, migrationStatus, reconnectTick]);
  
  // Calculate cart summary
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );
  
  // Show loading during migration
  if (migrationStatus === 'in_progress') {
    return {
      items: [],
      totalItems: 0,
      subtotal: 0,
      isLoading: true,
      error: null,
      realtimeStatus,
    };
  }
  
  return {
    items,
    totalItems,
    subtotal,
    isLoading,
    error,
    realtimeStatus,
  };
}
