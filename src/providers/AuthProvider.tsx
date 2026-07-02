/**
 * AuthProvider
 *
 * Phase 1: Provides the role context from the Zustand auth store.
 * Phase 2: Will wrap with next-auth SessionProvider and populate
 *          the store from the real session.
 *
 * Kept as a Client Component so it can hydrate the Zustand store
 * and (later) forward session data from next-auth.
 */

'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';

interface AuthProviderProps {
  children: React.ReactNode;
  /**
   * Phase 2: pass the next-auth session here so the store stays
   * in sync. For now it's undefined and we rely on persisted role.
   */
  session?: {
    user?: {
      role?: string;
    };
  } | null;
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);

  useEffect(() => {
    // Phase 2: derive isAuthenticated from real session
    setAuthenticated(!!session?.user);
  }, [session, setAuthenticated]);

  return <>{children}</>;
}
