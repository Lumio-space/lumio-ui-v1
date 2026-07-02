/**
 * Vitest global setup — runs before every test file.
 */

import '@testing-library/jest-dom';

// Mock next/navigation so components using usePathname / useRouter don't throw
vi.mock('next/navigation', () => ({
  useRouter:       () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname:     () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Zustand stores so tests start from a clean state
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (s: { role: string; setRole: () => void; isAuthenticated: boolean; setAuthenticated: () => void }) => unknown) =>
    selector({ role: 'admin', setRole: vi.fn(), isAuthenticated: false, setAuthenticated: vi.fn() }),
}));

vi.mock('@/stores/ui.store', () => ({
  useUIStore: (selector: (s: { sidebarOpen: boolean; setSidebarOpen: () => void; toggleSidebar: () => void }) => unknown) =>
    selector({ sidebarOpen: false, setSidebarOpen: vi.fn(), toggleSidebar: vi.fn() }),
}));
