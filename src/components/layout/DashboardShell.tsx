'use client';

import type { ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';
import { useUIStore } from '@/stores/ui.store';

export function DashboardShell({ children }: { children: ReactNode }) {
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
        <Topbar onMenuClickAction ={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-350 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
