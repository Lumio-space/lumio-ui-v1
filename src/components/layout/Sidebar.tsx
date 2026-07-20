'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { XIcon, SparklesIcon } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { NAV_ITEMS } from '@/config/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useSchoolStore } from '@/stores/school.store';
import { LEGACY_ROLE_LABELS } from '@/types/auth.types';
import { cn } from '@/lib/utils';

interface SidebarProps {
  mobileOpen: boolean;
  onClose:    () => void;
}

function getInitials(name: string | null): string {
  if (!name) return 'SC';
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname   = usePathname();
  const role       = useAuthStore((s) => s.role);
  const logoDataUrl = useSchoolStore((s) => s.logoDataUrl);
  const schoolName  = useSchoolStore((s) => s.schoolName);
  const items      = NAV_ITEMS.filter((i) => i.roles.includes(role));

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const displayName = schoolName ?? 'Your School';
  const initials    = getInitials(schoolName);

  const content = (
    <div className="flex h-full flex-col bg-indigo-900">
      {/* App logo header — always the Lumio product logo */}
      <div className="flex items-center justify-between px-5 pb-5 pt-6">
        <Logo variant="light" />
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-indigo-200 hover:bg-indigo-800 lg:hidden"
          aria-label="Close navigation"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      {/* School chip — shows uploaded logo or initials, never Lumio logo */}
      <div className="mx-3 mb-4 flex items-center gap-3 rounded-xl bg-indigo-800/60 px-3 py-2.5 ring-1 ring-inset ring-indigo-700/50">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg">
          {logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoDataUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gold-400 font-display text-sm font-extrabold text-indigo-900">
              {initials}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{displayName}</p>
          <p className="text-xs text-indigo-300">{LEGACY_ROLE_LABELS[role]} workspace</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4" aria-label="Main navigation">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'text-white'
                  : 'text-indigo-200 hover:bg-indigo-800/60 hover:text-white'
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl bg-purple-500 shadow-soft"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <item.icon className="relative h-5 w-5 shrink-0" />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Upsell */}
      <div className="m-3 rounded-2xl bg-indigo-800/70 p-4 ring-1 ring-inset ring-indigo-700/50">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-400/20 text-gold-300">
          <SparklesIcon className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm font-semibold text-white">Lumio Enterprise</p>
        <p className="mt-1 text-xs leading-relaxed text-indigo-300">
          Unlock advanced analytics, SSO and unlimited campuses.
        </p>
        <button className="mt-3 w-full rounded-lg bg-gold-400 py-2 text-xs font-bold text-indigo-900 transition-colors hover:bg-gold-300">
          Upgrade plan
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:block lg:w-64 lg:shrink-0">
        <div className="fixed inset-y-0 left-0 w-64">{content}</div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            className="absolute inset-0 bg-slate-900/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ x: -288 }}
            animate={{ x: 0 }}
            exit={{ x: -288 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="absolute inset-y-0 left-0 w-72"
          >
            {content}
          </motion.div>
        </div>
      )}
    </>
  );
}
