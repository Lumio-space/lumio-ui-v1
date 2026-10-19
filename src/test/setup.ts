import '@testing-library/jest-dom';

// Browser API polyfills for jsdom

// Radix UI (react-use-size) calls ResizeObserver in useEffect.
// jsdom doesn't implement it, so we stub it out.
global.ResizeObserver = class ResizeObserver {
  observe()    {}
  unobserve()  {}
  disconnect() {}
};

// Polyfill scrollTo and scrollIntoView for jsdom (used by framer-motion and radix dialogs)
window.scrollTo = vi.fn();
if (typeof Element !== 'undefined') {
  Element.prototype.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
}

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
  const normalizeRole = (role?: string | null) => {
    if (!role) return null;
    const r = role.toLowerCase().replace(/[-_]/g, '');
    if (r === 'superadmin' || r === 'schooladmin' || r === 'admin') return 'admin';
    if (r === 'teacher') return 'teacher';
    if (r === 'parent') return 'parent';
    if (r === 'student') return 'student';
    return null;
  };

  const mockAuthState = {
    role: 'admin' as 'admin' | 'teacher' | 'parent' | 'student',
    isAuthenticated: false,
    setAuthenticated: vi.fn((v) => { mockAuthState.isAuthenticated = v; }),
    user: null as { id?: string; name: string; email: string; role?: string; schoolId?: string; classId?: string } | null,
    setUser: vi.fn((u) => {
      mockAuthState.user = u;
      mockAuthState.role = normalizeRole(u?.role) ?? 'admin';
      mockAuthState.isAuthenticated = !!u;
    }),
    clearUser: vi.fn(() => {
      mockAuthState.user = null;
      mockAuthState.role = 'admin';
      mockAuthState.isAuthenticated = false;
    }),
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

vi.mock('@/stores/school.store', () => {
  const mockSchoolState = {
    schoolName: null as string | null,
    logoDataUrl: null as string | null,
    setLogo: vi.fn((l) => { mockSchoolState.logoDataUrl = l; }),
    setSchoolName: vi.fn((n) => { mockSchoolState.schoolName = n; }),
    clearSchool: vi.fn(() => {
      mockSchoolState.schoolName = null;
      mockSchoolState.logoDataUrl = null;
    }),
  };

  return {
    useSchoolStore: Object.assign(
      (selector: (s: typeof mockSchoolState) => unknown) =>
        typeof selector === 'function' ? selector(mockSchoolState) : mockSchoolState,
      {
        getState: () => mockSchoolState,
        setState: (partial: Partial<typeof mockSchoolState>) => Object.assign(mockSchoolState, partial),
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
