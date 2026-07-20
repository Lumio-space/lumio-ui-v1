/**
 * QueryClient factory
 *
 * Provides a consistent QueryClient configuration across the app and
 * in tests. Extracted here so QueryProvider stays thin.
 */

import { QueryClient } from '@tanstack/react-query';
import { QUERY_STALE_TIME, QUERY_CACHE_TIME } from '@/config/constants';

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime:           QUERY_STALE_TIME,
        gcTime:              QUERY_CACHE_TIME,
        retry:               1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

/** Browser singleton — reused across re-renders */
let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: always a fresh client to avoid sharing state across requests
    return makeQueryClient();
  }
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
