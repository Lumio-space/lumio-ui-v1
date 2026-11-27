import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Topbar } from '../Topbar';
import { useAuthStore } from '@/stores/auth.store';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe('Topbar notifications state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'u-1',
        name: 'Principal Admin',
        email: 'admin@school.edu',
        role: 'SCHOOL_ADMIN',
        schoolId: 'sch-1',
      },
      isAuthenticated: true,
      role: 'admin',
    });
  });

  it('does not render fabricated mock notifications or static unread count and shows honest unavailable state', () => {
    const { container } = renderWithProviders(
      <Topbar onMenuClickAction={vi.fn()} />
    );

    // No pulsing unread indicator dot
    expect(container.querySelector('.animate-ping')).not.toBeInTheDocument();
    expect(screen.queryByText('3 new')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Notifications'));

    expect(
      screen.getByText('Notifications are not available yet')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('New admission request')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Attendance submitted')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Results published')
    ).not.toBeInTheDocument();
  });
});
