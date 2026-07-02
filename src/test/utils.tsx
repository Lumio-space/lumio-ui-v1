/**
 * Custom render utility for React Testing Library
 *
 * Wraps components in all providers so tests get the same context
 * as production. Import renderWithProviders instead of RTL's render.
 */

import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function makeTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries:   { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

function AllProviders({ children }: { children: React.ReactNode }) {
  const queryClient = makeTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from RTL so tests only need one import
export * from '@testing-library/react';
export { userEvent };
