'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

/**
 * React Query Provider
 * 
 * Wraps the application with QueryClientProvider to enable React Query hooks.
 * 
 * Configuration:
 * - defaultOptions.queries.staleTime: 5 minutes (300000ms) - data considered fresh for 5 minutes
 * - defaultOptions.queries.gcTime: 10 minutes (600000ms) - unused data kept in cache for 10 minutes
 * - defaultOptions.queries.retry: 1 - retry failed queries once
 * - defaultOptions.queries.retryDelay: 1 second (1000ms) - wait 1 second before retrying
 * - defaultOptions.queries.refetchOnWindowFocus: false - don't refetch on window focus (better UX)
 * - defaultOptions.queries.networkMode: 'offlineFirst' - better handling of network failures
 * - defaultOptions.queries.meta.timeout: 10 seconds (10000ms) - prevent infinite loading states
 * 
 * Note: We create QueryClient inside the component to ensure each request gets a fresh client
 * in server-side rendering scenarios.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            retry: 1,
            retryDelay: 1000, // 1 second - avoid immediate retry
            refetchOnWindowFocus: false,
            networkMode: 'offlineFirst', // Better handling of network failures
            // CRITICAL: Add timeout to prevent infinite loading
            meta: {
              timeout: 10000, // 10 seconds
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
