import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { DashboardView } from '@/features/dashboard';
import { useAuthStore } from '@/stores/auth.store';
import { useSchoolStore } from '@/stores/school.store';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/dashboard',
}));

describe('DashboardView role-based routing and membership states', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      isAuthenticated: true,
      role: 'admin',
    });
    useSchoolStore.setState({
      schoolName: null,
      logoDataUrl: null,
    });
  });

  it('renders NoSchoolMembershipView when authenticated user has no active school', () => {
    useAuthStore.setState({
      user: {
        name: 'Unassigned User',
        email: 'user@example.com',
        role: 'TEACHER',
        // schoolId is undefined
      },
      isAuthenticated: true,
      role: 'teacher',
    });

    renderWithProviders(<DashboardView />);

    expect(screen.getByText('No Active School Membership')).toBeInTheDocument();
    expect(screen.getByText(/your lumio account is active, but you are not currently attached to any school workspace/i)).toBeInTheDocument();
    expect(screen.getByText(/have an invitation token\?/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/paste invitation token or url/i)).toBeInTheDocument();

    // Must NOT render teacher workspace with missing school data
    expect(screen.queryByText(/teacher workspace/i)).not.toBeInTheDocument();
  });

  it('renders TeacherDashboardView when user has teacher role and active school', () => {
    useAuthStore.setState({
      user: {
        name: 'Sarah Connor',
        email: 'sarah.c@school.edu',
        role: 'TEACHER',
        schoolId: 'sch-123',
      },
      isAuthenticated: true,
      role: 'teacher',
    });
    useSchoolStore.setState({
      schoolName: 'Greenfield College',
      logoDataUrl: null,
    });

    renderWithProviders(<DashboardView />);

    expect(screen.getByText(/welcome back, sarah/i)).toBeInTheDocument();
    expect(screen.getByText(/teacher workspace — greenfield college/i)).toBeInTheDocument();
    expect(screen.getAllByText('My Subjects').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('My Classes').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('My Students')).toBeInTheDocument();

    // Must NOT render admin workspace
    expect(screen.queryByText(/administrator workspace/i)).not.toBeInTheDocument();
  });

  it('renders Admin Dashboard when user has admin role and active school', () => {
    useAuthStore.setState({
      user: {
        name: 'Principal Skinner',
        email: 'principal@school.edu',
        role: 'SCHOOL_ADMIN',
        schoolId: 'sch-123',
      },
      isAuthenticated: true,
      role: 'admin',
    });
    useSchoolStore.setState({
      schoolName: 'Springfield Elementary',
      logoDataUrl: null,
    });

    renderWithProviders(<DashboardView />);

    expect(screen.getByText(/administrator workspace — springfield elementary/i)).toBeInTheDocument();
    expect(screen.getByText('Total Teachers')).toBeInTheDocument();
    expect(screen.getAllByText('Active Classes').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Total Subjects')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.queryByText(/teacher workspace/i)).not.toBeInTheDocument();
  });

  it('renders ParentDashboardView when user has parent role and active school', () => {
    useAuthStore.setState({
      user: {
        name: 'Jane Doe',
        email: 'parent@example.com',
        role: 'PARENT',
        schoolId: 'sch-123',
      },
      isAuthenticated: true,
      role: 'parent',
    });
    useSchoolStore.setState({
      schoolName: 'Greenfield College',
      logoDataUrl: null,
    });

    renderWithProviders(<DashboardView />);

    expect(screen.getByText(/parent workspace — greenfield college/i)).toBeInTheDocument();
    expect(screen.getByText('Parent portal active')).toBeInTheDocument();
    expect(screen.queryByText(/administrator workspace/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/teacher workspace/i)).not.toBeInTheDocument();
  });

  it('renders StudentDashboardView when user has student role and active school', () => {
    useAuthStore.setState({
      user: {
        name: 'Alex Hunter',
        email: 'student@example.com',
        role: 'STUDENT',
        schoolId: 'sch-123',
      },
      isAuthenticated: true,
      role: 'student',
    });
    useSchoolStore.setState({
      schoolName: 'Greenfield College',
      logoDataUrl: null,
    });

    renderWithProviders(<DashboardView />);

    expect(screen.getByText(/student workspace — greenfield college/i)).toBeInTheDocument();
    expect(screen.getByText('Student portal active')).toBeInTheDocument();
    expect(screen.queryByText(/administrator workspace/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/teacher workspace/i)).not.toBeInTheDocument();
  });
});
