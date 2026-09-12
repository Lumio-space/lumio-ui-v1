import '@testing-library/jest-dom';

// Browser API polyfills for jsdom

// Radix UI (react-use-size) calls ResizeObserver in useEffect.
// jsdom doesn't implement it, so we stub it out.
global.ResizeObserver = class ResizeObserver {
  observe()    {}
  unobserve()  {}
  disconnect() {}
};

// Radix Checkbox also touches window.matchMedia in some paths
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Next.js mocks

vi.mock('next/navigation', () => ({
  useRouter:       () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname:     () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Zustand store mocks

vi.mock('@/stores/auth.store', () => {
  const mockAuthState = {
    role: 'admin',
    setRole: vi.fn(),
    isAuthenticated: false,
    setAuthenticated: vi.fn((v) => { mockAuthState.isAuthenticated = v; }),
    user: null as { name: string; email: string; role?: string; schoolId?: string } | null,
    setUser: vi.fn((u) => { mockAuthState.user = u; }),
    clearUser: vi.fn(() => { mockAuthState.user = null; }),
  };

  return {
    useAuthStore: Object.assign(
      (selector: (s: typeof mockAuthState) => unknown) =>
        typeof selector === 'function' ? selector(mockAuthState) : mockAuthState,
      {
        getState: () => mockAuthState,
        setState: (partial: Partial<typeof mockAuthState>) => Object.assign(mockAuthState, partial),
      }
    ),
  };
});

vi.mock('@/stores/ui.store', () => ({
  useUIStore: (
    selector: (s: {
      sidebarOpen: boolean; setSidebarOpen: () => void; toggleSidebar: () => void;
    }) => unknown
  ) => selector({
    sidebarOpen: false, setSidebarOpen: vi.fn(), toggleSidebar: vi.fn(),
  }),
}));
