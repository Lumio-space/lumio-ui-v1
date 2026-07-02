/**
 * BottomNav — layout component
 *
 * Mobile bottom navigation bar.
 * Migrated from components/layout/BottomNav.tsx.
 *
 * Key changes:
 *   - NavLink → Link + usePathname() for active detection
 *   - Role from Zustand auth store
 *   - 'use client' required: usePathname + useAuthStore
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BOTTOM_NAV_ITEMS } from '@/config/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();
  const role     = useAuthStore((s) => s.role);
  const items    = BOTTOM_NAV_ITEMS.filter((i) => i.roles.includes(role));

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-slate-200 bg-white/95 backdrop-blur-md lg:hidden"
      aria-label="Primary"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
              active ? 'text-purple-600' : 'text-slate-400'
            )}
          >
            <item.icon className={cn('h-5 w-5', active && 'stroke-[2.4]')} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
