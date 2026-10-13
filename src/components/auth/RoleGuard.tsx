'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import type { UserRole } from '@/types/auth.types';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

/**
 * RoleGuard prevents unauthorized access to protected dashboard views.
 *
 * If the authenticated user's role is not within `allowedRoles`,
 * they are immediately redirected to `/dashboard`.
 */
export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof useAuthStore.persist?.onFinishHydration === 'function') {
      const unsub = useAuthStore.persist.onFinishHydration(() => {
        setHydrated(true);
      });
      if (useAuthStore.persist.hasHydrated()) {
        setHydrated(true);
      }
      return () => unsub();
    } else {
      setHydrated(true);
    }
  }, []);

  const isAllowed = allowedRoles.includes(role);

  useEffect(() => {
    if (hydrated && !isAllowed) {
      router.replace('/dashboard');
    }
  }, [hydrated, isAllowed, router]);

  if (!hydrated || !isAllowed) {
    return null;
  }

  return <>{children}</>;
}
