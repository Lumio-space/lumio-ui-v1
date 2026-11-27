'use client'

import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { useState, useRef, useEffect } from 'react'
import { useRouter }      from 'next/navigation'
import {
  MenuIcon, SearchIcon, BellIcon, LogOutIcon,
  UserIcon, SettingsIcon,
} from 'lucide-react'
import { Avatar }       from '@/components/shared/Avatar'
import { useAuthStore } from '@/stores/auth.store'
import { useLogout }    from '@/features/auth/hooks/useAuth'
import { CANONICAL_ROLE_LABELS } from '@/types/auth.types'
import { cn } from '@/lib/utils'

/* ── Inline Dropdown ──────────────────────────────────────── */
interface DropdownProps {
  trigger:       ReactNode
  children:      ReactNode
  menuClassName?: string
}

function Dropdown({ trigger, children, menuClassName }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', down)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('mousedown', down)
      document.removeEventListener('keydown', key)
    }
  }, [])

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu" aria-expanded={open} className="block">
        {trigger}
      </button>
      {open && (
        <div role="menu" onClick={() => setOpen(false)}
          className={cn(
            'absolute right-0 z-40 mt-2 min-w-48 overflow-hidden rounded-xl border border-slate-100 bg-white p-1.5 shadow-elevated',
            menuClassName
          )}>
          {children}
        </div>
      )}
    </div>
  )
}

interface DropdownItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?:    ReactNode
  danger?:  boolean
  children: ReactNode
}

function DropdownItem({ icon, danger, children, ...props }: DropdownItemProps) {
  return (
    <button type="button" role="menuitem"
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
        danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-100'
      )}
      {...props}>
      {icon && <span className="text-slate-400">{icon}</span>}
      {children}
    </button>
  )
}

function DropdownDivider() { return <div className="my-1 h-px bg-slate-100" /> }

/* ── Component ────────────────────────────────────────────── */
export function Topbar({ onMenuClickAction }: { onMenuClickAction: () => void }) {
  const router     = useRouter()
  const role       = useAuthStore((s) => s.role)
  const storeUser  = useAuthStore((s) => s.user)
  const { mutate: logout, isPending: isLoggingOut } = useLogout()
  const [query, setQuery] = useState('')

  const displayName  = storeUser?.name  ?? 'Administrator'
  const displayEmail = storeUser?.email ?? ''

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:px-6">
      <button onClick={onMenuClickAction} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Open navigation">
        <MenuIcon className="h-5 w-5" />
      </button>

      <div className="relative hidden max-w-md flex-1 sm:block">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} type="search"
          placeholder="Search students, teachers, classes…" aria-label="Global search"
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100" />
      </div>

      <div className="flex flex-1 items-center justify-end gap-1.5 sm:flex-none">
        <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:hidden" aria-label="Search">
          <SearchIcon className="h-5 w-5" />
        </button>

        {/* Authenticated Role Identity Badge */}
        <span className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 md:inline-flex">
          <span className="h-2 w-2 rounded-full bg-purple-500" />
          {CANONICAL_ROLE_LABELS[role] ?? 'Workspace'}
        </span>

        {/* Notifications */}
        <Dropdown
          menuClassName="w-80"
          trigger={
            <span
              aria-label="Notifications"
              className="relative inline-flex rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <BellIcon className="h-5 w-5" />
            </span>
          }
        >
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-sm font-bold text-slate-900">Notifications</p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
              Unavailable
            </span>
          </div>
          <div className="my-1 h-px bg-slate-100" />
          <div className="px-3 py-5 text-center">
            <BellIcon className="mx-auto mb-2 h-6 w-6 text-slate-300" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-700">
              Notifications are not available yet
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Live notification delivery is not yet supported by the backend service.
            </p>
          </div>
        </Dropdown>

        {/* Account */}
        <Dropdown
          trigger={
            <span className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 hover:bg-slate-100">
              <Avatar name={displayName} size="sm" />
              <span className="hidden text-left lg:block">
                <span className="block text-sm font-semibold leading-tight text-slate-800">{displayName}</span>
                <span className="block text-xs leading-tight text-slate-400">{CANONICAL_ROLE_LABELS[role]}</span>
              </span>
            </span>
          }
        >
          <div className="px-3 py-2">
            <p className="text-sm font-bold text-slate-900">{displayName}</p>
            {displayEmail && <p className="text-xs text-slate-500">{displayEmail}</p>}
          </div>
          <DropdownDivider />
          {role === 'admin' && (
            <>
              <DropdownItem icon={<UserIcon className="h-4 w-4" />} onClick={() => router.push('/settings')}>
                My profile
              </DropdownItem>
              <DropdownItem icon={<SettingsIcon className="h-4 w-4" />} onClick={() => router.push('/settings')}>
                Settings
              </DropdownItem>
              <DropdownDivider />
            </>
          )}
          <DropdownItem danger icon={<LogOutIcon className="h-4 w-4" />}
            onClick={() => logout()} disabled={isLoggingOut}>
            {isLoggingOut ? 'Signing out…' : 'Sign out'}
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  )
}
