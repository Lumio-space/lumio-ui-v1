'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';

interface AuthProviderProps {
  children: ReactNode;
  session?: {
    user?: {
      role?: string;
    };
  } | null;
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);

  // If server session is explicitly provided, synchronize it
  useEffect(() => {
    if (session !== undefined) {
      setAuthenticated(!!session?.user);
    }
  }, [session, setAuthenticated]);

  return <>{children}</>;
}
