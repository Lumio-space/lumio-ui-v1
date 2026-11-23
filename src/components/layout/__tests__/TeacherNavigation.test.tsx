import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuthStore } from '@/stores/auth.store';
import { useSchoolStore } from '@/stores/school.store';

let currentPathname = '/results';
const mockPush = vi.fn((url: string) => {
  currentPathname = url;
});
const mockReplace = vi.fn((url: string) => {
  currentPathname = url;
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
  }),
  usePathname: () => currentPathname,
  useSearchParams: () => new URLSearchParams(),
}));

describe('Teacher Navigation from Results to Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setUser({
      id: 'teacher-1',
      name: 'Jane Teacher',
      email: 'teacher@school.edu',
      role: 'TEACHER',
      schoolId: 'sch-1',
    });
    useSchoolStore.setState({
      schoolName: 'Greenwood High',
      logoDataUrl: null,
    });
  });

  it('renders Dashboard link and Results link for teacher when on /results', () => {
    currentPathname = '/results';
    const { rerender } = renderWithProviders(<Sidebar mobileOpen={false} onClose={vi.fn()} />);

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');

    const resultsLink = screen.getByRole('link', { name: /results/i });
    expect(resultsLink).toBeInTheDocument();
    expect(resultsLink).toHaveAttribute('href', '/results');

    // Simulate route change to /dashboard
    currentPathname = '/dashboard';
    rerender(<Sidebar mobileOpen={false} onClose={vi.fn()} />);

    const updatedDashboard = screen.getByRole('link', { name: /dashboard/i });
    expect(updatedDashboard).toHaveAttribute('href', '/dashboard');
  });

  it('handles mobile drawer open and close without duplicate key errors', async () => {
    currentPathname = '/results';
    const onClose = vi.fn();
    const { rerender } = renderWithProviders(<Sidebar mobileOpen={true} onClose={onClose} />);

    // When mobileOpen is true, both desktop and mobile drawer render links
    const dashboardLinks = screen.getAllByRole('link', { name: /dashboard/i });
    expect(dashboardLinks.length).toBe(2);

    // Click mobile close
    const closeButtons = screen.getAllByLabelText(/close navigation/i);
    fireEvent.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalled();

    // Close drawer
    rerender(<Sidebar mobileOpen={false} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getAllByRole('link', { name: /dashboard/i }).length).toBe(1);
    });
  });

  it('verifies that pointer-events-none is on the active background highlight', () => {
    currentPathname = '/results';
    const { container } = renderWithProviders(<Sidebar mobileOpen={false} onClose={vi.fn()} />);

    // The active item is Results
    const activeSpan = container.querySelector('.bg-purple-500');
    expect(activeSpan).toBeInTheDocument();
    expect(activeSpan).toHaveClass('pointer-events-none');
  });

  it('navigates cleanly through all teacher routes in sequence', () => {
    const teacherRoutes = [
      '/dashboard',
      '/my-classes',
      '/my-subjects',
      '/attendance',
      '/results',
      '/timetable',
      '/parents',
      '/announcements',
      '/settings',
    ];

    const { rerender, container } = renderWithProviders(
      <Sidebar mobileOpen={false} onClose={vi.fn()} />
    );

    for (const route of teacherRoutes) {
      currentPathname = route;
      rerender(<Sidebar mobileOpen={false} onClose={vi.fn()} />);

      const activeLink = container.querySelector('a.text-white');
      expect(activeLink).toBeInTheDocument();
      expect(activeLink).toHaveAttribute('href', route);
    }
  });

  it('renders expected bottom nav items for teacher', () => {
    currentPathname = '/results';
    renderWithProviders(<BottomNav />);

    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));

    // Teacher bottom nav items
    expect(hrefs).toContain('/dashboard');
    expect(hrefs).toContain('/attendance');
    expect(hrefs).toContain('/results');
    expect(hrefs).toContain('/announcements');
    // Admin-only items like Students must NOT be in teacher bottom nav
    expect(hrefs).not.toContain('/students');
  });

  it('does not invoke onClose when clicking desktop sidebar links', () => {
    currentPathname = '/results';
    const onClose = vi.fn();
    renderWithProviders(<Sidebar mobileOpen={false} onClose={onClose} />);

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    fireEvent(
      dashboardLink,
      new MouseEvent('click', { bubbles: true, cancelable: true })
    );

    // On desktop, onClose should not be called
    expect(onClose).not.toHaveBeenCalled();
  });

  it('invokes onClose when clicking mobile drawer links', () => {
    currentPathname = '/results';
    const onClose = vi.fn();
    renderWithProviders(<Sidebar mobileOpen={true} onClose={onClose} />);

    // In mobileOpen=true, the second link is the mobile drawer one
    const dashboardLinks = screen.getAllByRole('link', { name: /dashboard/i });
    const mobileDashboardLink = dashboardLinks[1];
    fireEvent(
      mobileDashboardLink,
      new MouseEvent('click', { bubbles: true, cancelable: true })
    );

    // On mobile drawer, onClose should be called to dismiss the drawer
    expect(onClose).toHaveBeenCalled();
  });
});
