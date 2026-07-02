/**
 * DashboardShell — layout component
 *
 * Client Component wrapper for the dashboard layout.
 * Sits between the Server Component layout.tsx and the interactive
 * Sidebar / Topbar / BottomNav.
 *
 * Why this exists:
 *   Next.js layouts are Server Components by default. But the sidebar
 *   drawer requires useState/Zustand. Instead of marking the whole
 *   layout as 'use client', we isolate client behaviour here and keep
 *   (dashboard)/layout.tsx as a Server Component.
 *
 * The sidebar open/close state lives in the Zustand UIStore so any
 * component (e.g., a nav link) can close the drawer without prop drilling.
 */

'use client';

import { AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';
import { useUIStore } from '@/stores/ui.store';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-canvas">
      <AnimatePresence>
        <Sidebar
          key="sidebar"
          mobileOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </AnimatePresence>

      <div className="lg:pl-64">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-[1400px] px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
