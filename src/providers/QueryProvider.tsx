/**
 * QueryProvider
 *
 * Wraps the app in TanStack Query's QueryClientProvider.
 * Also bootstraps Axios interceptors (draft-token + error normalisation)
 * so they are active for the lifetime of the app.
 *
 * Must be a Client Component because QueryClient uses browser APIs.
 */

'use client';

import type { ReactNode } from 'react';
import { useState }       from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient }      from '@/lib/api/query-client';

// Side-effect import — attaches interceptors to the shared apiClient once.
import '@/lib/api/interceptors';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
