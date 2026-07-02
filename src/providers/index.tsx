/**
 * Providers — root composition
 *
 * Single import in app/layout.tsx. Add new providers here so
 * the root layout stays clean.
 *
 * Order matters:
 *  1. QueryProvider  — must wrap everything that uses useQuery
 *  2. AuthProvider   — may use QueryClient internally in Phase 2
 */

import { QueryProvider } from './QueryProvider';
import { AuthProvider } from './AuthProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryProvider>
  );
}
