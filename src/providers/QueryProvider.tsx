/**
 * QueryProvider
 *
 * Wraps the app in TanStack Query's QueryClientProvider.
 * Must be a Client Component because QueryClient uses browser APIs.
 *
 * staleTime and gcTime are set to sensible defaults for a school
 * management app — data doesn't change every second.
 */

'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QUERY_STALE_TIME, QUERY_CACHE_TIME } from '@/config/constants';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME,
        gcTime:    QUERY_CACHE_TIME,
        retry:     1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

/** Singleton outside component to avoid re-creating on every render */
let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new client
    return makeQueryClient();
  }
  // Browser: reuse the same client across re-renders
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState prevents re-creating client on each render
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
