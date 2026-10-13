import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { NAV_ITEMS } from '@/config/navigation';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useAuthStore } from '@/stores/auth.store';
import { useSchoolStore } from '@/stores/school.store';
import { normalizeRole } from '@/types/auth.types';

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

describe('Role-based navigation, routing protection, and account state isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearUser();
    useSchoolStore.setState({
      schoolName: 'Greenfield College',
      logoDataUrl: null,
    });
  });

  describe('1. Canonical Role Normalization & State Derivation', () => {
    it('normalizes roles correctly without ambiguity', () => {
      expect(normalizeRole('SUPER_ADMIN')).toBe('admin');
      expect(normalizeRole('SCHOOL_ADMIN')).toBe('admin');
      expect(normalizeRole('admin')).toBe('admin');
      expect(normalizeRole('TEACHER')).toBe('teacher');
      expect(normalizeRole('teacher')).toBe('teacher');
      expect(normalizeRole('PARENT')).toBe('parent');
      expect(normalizeRole('STUDENT')).toBe('student');
      expect(normalizeRole('unknown_role')).toBeNull();
      expect(normalizeRole(null)).toBeNull();
    });

    it('sets canonical role automatically when setUser is called', () => {
      useAuthStore.getState().setUser({
        id: 'usr-1',
        name: 'Teacher One',
        email: 'teacher@school.edu',
        role: 'TEACHER',
      });
      expect(useAuthStore.getState().role).toBe('teacher');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      useAuthStore.getState().setUser({
        id: 'usr-2',
        name: 'Admin One',
        email: 'admin@school.edu',
        role: 'SCHOOL_ADMIN',
      });
      expect(useAuthStore.getState().role).toBe('admin');

      useAuthStore.getState().clearUser();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().role).toBe('admin');
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('2. Navigation Filtering based on Role', () => {
    it('provides admin-only items and excludes teacher-only items for admin', () => {
      const adminNav = NAV_ITEMS.filter((item) => item.roles.includes('admin'));
      const adminLabels = adminNav.map((i) => i.label);

      expect(adminLabels).toContain('Dashboard');
      expect(adminLabels).toContain('Students');
      expect(adminLabels).toContain('Teachers');
      expect(adminLabels).toContain('Classes');
      expect(adminLabels).toContain('Subjects');
      expect(adminLabels).toContain('Roles');

      // Teacher-only items must NOT be present
      expect(adminLabels).not.toContain('My Classes');
      expect(adminLabels).not.toContain('My Subjects');
    });

    it('provides teacher-only items and excludes admin management items for teacher', () => {
      const teacherNav = NAV_ITEMS.filter((item) => item.roles.includes('teacher'));
      const teacherLabels = teacherNav.map((i) => i.label);

      expect(teacherLabels).toContain('Dashboard');
      expect(teacherLabels).toContain('My Classes');
      expect(teacherLabels).toContain('My Subjects');
      expect(teacherLabels).toContain('Attendance');
      expect(teacherLabels).toContain('Results');
      expect(teacherLabels).toContain('Timetable');
      expect(teacherLabels).toContain('Parents');

      // Admin items must NOT be present for teacher
      expect(teacherLabels).not.toContain('Teachers');
      expect(teacherLabels).not.toContain('Classes');
      expect(teacherLabels).not.toContain('Subjects');
      expect(teacherLabels).not.toContain('Students');
      expect(teacherLabels).not.toContain('Roles');
    });

    it('renders the correct sidebar navigation links for an authenticated teacher', () => {
      useAuthStore.getState().setUser({
        id: 't-123',
        name: 'John Teacher',
        email: 'john.t@school.edu',
        role: 'TEACHER',
      });

      renderWithProviders(<Sidebar mobileOpen={false} onClose={vi.fn()} />);

      expect(screen.getByText('Teacher workspace')).toBeInTheDocument();
      expect(screen.getByText('My Classes')).toBeInTheDocument();
      expect(screen.getByText('My Subjects')).toBeInTheDocument();

      // Must NOT render Admin items
      expect(screen.queryByText('Teachers')).not.toBeInTheDocument();
      expect(screen.queryByText(/^Classes$/)).not.toBeInTheDocument();
      expect(screen.queryByText(/^Subjects$/)).not.toBeInTheDocument();
      expect(screen.queryByText('Students')).not.toBeInTheDocument();
      expect(screen.queryByText('Roles')).not.toBeInTheDocument();
    });

    it('renders the correct sidebar navigation links for an authenticated administrator', () => {
      useAuthStore.getState().setUser({
        id: 'a-123',
        name: 'Principal Skinner',
        email: 'principal@school.edu',
        role: 'SCHOOL_ADMIN',
      });

      renderWithProviders(<Sidebar mobileOpen={false} onClose={vi.fn()} />);

      expect(screen.getByText('Administrator workspace')).toBeInTheDocument();
      expect(screen.getByText('Teachers')).toBeInTheDocument();
      expect(screen.getByText('Classes')).toBeInTheDocument();
      expect(screen.getByText('Subjects')).toBeInTheDocument();
      expect(screen.getByText('Students')).toBeInTheDocument();
      expect(screen.getByText('Roles')).toBeInTheDocument();

      // Must NOT render Teacher-only items
      expect(screen.queryByText('My Classes')).not.toBeInTheDocument();
      expect(screen.queryByText('My Subjects')).not.toBeInTheDocument();
    });
  });

  describe('3. Route Protection via RoleGuard', () => {
    it('renders protected child component when authenticated user has allowed role', () => {
      useAuthStore.getState().setUser({
        id: 'a-1',
        name: 'Admin User',
        email: 'admin@school.edu',
        role: 'SCHOOL_ADMIN',
      });

      renderWithProviders(
        <RoleGuard allowedRoles={['admin']}>
          <div data-testid="admin-content">Admin Protected Area</div>
        </RoleGuard>
      );

      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('redirects unauthorized user to /dashboard and does not render protected content', () => {
      useAuthStore.getState().setUser({
        id: 't-1',
        name: 'Teacher User',
        email: 'teacher@school.edu',
        role: 'TEACHER',
      });

      renderWithProviders(
        <RoleGuard allowedRoles={['admin']}>
          <div data-testid="admin-content">Admin Protected Area</div>
        </RoleGuard>
      );

      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });

    it('redirects admin away from teacher-only routes to /dashboard', () => {
      useAuthStore.getState().setUser({
        id: 'a-1',
        name: 'Admin User',
        email: 'admin@school.edu',
        role: 'SCHOOL_ADMIN',
      });

      renderWithProviders(
        <RoleGuard allowedRoles={['teacher']}>
          <div data-testid="teacher-content">Teacher Only Area</div>
        </RoleGuard>
      );

      expect(screen.queryByTestId('teacher-content')).not.toBeInTheDocument();
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('4. Topbar Role Identity & Removal of Role Switcher', () => {
    it('renders read-only canonical role label and does not contain role-switching options', () => {
      useAuthStore.getState().setUser({
        id: 't-1',
        name: 'Sarah Connor',
        email: 'sarah@school.edu',
        role: 'TEACHER',
      });

      renderWithProviders(<Topbar onMenuClickAction={vi.fn()} />);

      // Shows user name and canonical role badge
      expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
      expect(screen.getAllByText('Teacher').length).toBeGreaterThanOrEqual(1);

      // No role switcher exists in the DOM
      expect(screen.queryByText(/view as role/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/switch role/i)).not.toBeInTheDocument();
    });
  });
});
