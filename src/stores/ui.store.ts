/**
 * UI Store — Zustand
 *
 * Client-only state for UI concerns: sidebar, modals, toasts.
 * Never put server data (users, students, etc.) here — use TanStack Query.
 *
 * This replaces the useState(mobileOpen) that lived in DashboardLayout.tsx
 * in the original project. Zustand lets any component open/close the
 * sidebar without prop drilling.
 */

import { create } from 'zustand';

interface UIState {
  /** Whether the mobile sidebar drawer is open */
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  /** Global loading overlay (for page transitions etc.) */
  isGlobalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen:     false,
  setSidebarOpen:  (open) => set({ sidebarOpen: open }),
  toggleSidebar:   () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  isGlobalLoading:    false,
  setGlobalLoading:   (loading) => set({ isGlobalLoading: loading }),
}));
