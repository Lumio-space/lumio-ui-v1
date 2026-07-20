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
  const setAuthenticated = useAuthStore((s: { setAuthenticated: (v: boolean) => void }) => s.setAuthenticated);

  useEffect(() => {
   
    setAuthenticated(!!session?.user);
  }, [session, setAuthenticated]);

  return <>{children}</>;
}
