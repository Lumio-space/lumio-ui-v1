'use client'

import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { useState, useRef, useEffect } from 'react'
import { useRouter }      from 'next/navigation'
import {
  MenuIcon, SearchIcon, BellIcon, LogOutIcon,
  UserIcon, SettingsIcon, ChevronDownIcon, CheckIcon,
} from 'lucide-react'
import { Avatar }       from '@/components/shared/Avatar'
import { useAuthStore } from '@/stores/auth.store'
import { useLogout }    from '@/features/auth/hooks/useAuth'
import { LEGACY_ROLE_LABELS, type LegacyRole } from '@/types/auth.types'
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
function DropdownLabel({ children }: { children: ReactNode }) {
  return <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{children}</div>
}

/* ── Notifications mock ───────────────────────────────────── */
const NOTIFICATIONS = [
  { id: 1, title: 'New admission request', desc: 'Grade 9 — pending review',  tone: 'gold'   as const, time: '5m' },
  { id: 2, title: 'Attendance submitted',  desc: 'Grade 10-A by Dr. Hughes',  tone: 'purple' as const, time: '1h' },
  { id: 3, title: 'Results published',     desc: 'Mid-term Grade 11-C',       tone: 'green'  as const, time: '3h' },
]

/* ── Component ────────────────────────────────────────────── */
export function Topbar({ onMenuClickAction }: { onMenuClickAction: () => void }) {
  const router     = useRouter()
  const role       = useAuthStore((s) => s.role)
  const setRole    = useAuthStore((s) => s.setRole)
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

        {/* Role switcher */}
        <Dropdown
          trigger={
            <span className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 md:inline-flex">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              {LEGACY_ROLE_LABELS[role]}
              <ChevronDownIcon className="h-4 w-4 text-slate-400" />
            </span>
          }
        >
          <DropdownLabel>View as role</DropdownLabel>
          {(Object.keys(LEGACY_ROLE_LABELS) as LegacyRole[]).map((r) => (
            <DropdownItem key={r} onClick={() => setRole(r)} danger={false}
              icon={role === r ? <CheckIcon className="h-4 w-4 text-purple-500" /> : <span className="h-4 w-4" />}>
              {LEGACY_ROLE_LABELS[r]}
            </DropdownItem>
          ))}
        </Dropdown>

        {/* Notifications */}
        <Dropdown
          menuClassName="w-80"
          trigger={
            <span className="relative inline-flex rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <BellIcon className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold-400 ring-2 ring-white" />
              </span>
            </span>
          }
        >
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-sm font-bold text-slate-900">Notifications</p>
            <span className="rounded-full bg-gold-100 px-2 py-0.5 text-xs font-bold text-gold-600">3 new</span>
          </div>
          <div className="my-1 h-px bg-slate-100" />
          {NOTIFICATIONS.map((n) => (
            <button key={n.id} className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50">
              <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full',
                n.tone === 'gold'   && 'bg-gold-400',
                n.tone === 'purple' && 'bg-purple-500',
                n.tone === 'green'  && 'bg-emerald-500')} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-800">{n.title}</span>
                <span className="block truncate text-xs text-slate-500">{n.desc}</span>
              </span>
              <span className="ml-auto text-xs text-slate-400">{n.time}</span>
            </button>
          ))}
        </Dropdown>

        {/* Account */}
        <Dropdown
          trigger={
            <span className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 hover:bg-slate-100">
              <Avatar name={displayName} size="sm" />
              <span className="hidden text-left lg:block">
                <span className="block text-sm font-semibold leading-tight text-slate-800">{displayName}</span>
                <span className="block text-xs leading-tight text-slate-400">{LEGACY_ROLE_LABELS[role]}</span>
              </span>
            </span>
          }
        >
          <div className="px-3 py-2">
            <p className="text-sm font-bold text-slate-900">{displayName}</p>
            {displayEmail && <p className="text-xs text-slate-500">{displayEmail}</p>}
          </div>
          <DropdownDivider />
          <DropdownItem icon={<UserIcon className="h-4 w-4" />}>My profile</DropdownItem>
          <DropdownItem icon={<SettingsIcon className="h-4 w-4" />} onClick={() => router.push('/settings')}>
            Settings
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem danger icon={<LogOutIcon className="h-4 w-4" />}
            onClick={() => logout()} disabled={isLoggingOut}>
            {isLoggingOut ? 'Signing out…' : 'Sign out'}
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  )
}
