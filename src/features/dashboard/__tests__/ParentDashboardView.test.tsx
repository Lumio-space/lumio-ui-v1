import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { ParentDashboardView } from '../components/ParentDashboardView';
import { useAuthStore } from '@/stores/auth.store';
import { useSchoolStore } from '@/stores/school.store';
import * as parentHooks from '@/features/parents/hooks';
import * as announcementHooks from '@/features/announcements/hooks';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/dashboard',
}));

describe('ParentDashboardView', () => {
  const mockChild1 = {
    id: 'student-1',
    studentId: 'student-1',
    name: 'Amelia Bennett',
    admissionNo: 'ADM-2024-001',
    rollNo: 12,
    grade: 'Primary 5',
    section: 'A',
    className: 'Primary 5 · A',
    status: 'Active',
    attendance: 94,
    average: 0,
    avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
    formTeacher: {
      id: 't-1',
      name: 'Mrs. Angela Vance',
      email: 'angela.vance@school.edu',
    },
    results: undefined,
    schedule: [
      { time: '08:30 - 09:30', subject: 'Mathematics', room: 'Room 101' },
      { time: '09:30 - 10:30', subject: 'English', room: 'Room 101' },
    ],
  };

  const mockChild2 = {
    id: 'student-2',
    studentId: 'student-2',
    name: 'Lucas Bennett',
    admissionNo: 'ADM-2024-002',
    rollNo: 5,
    grade: 'Primary 2',
    section: 'B',
    className: 'Primary 2 · B',
    status: 'Active',
    attendance: 98,
    average: 0,
    avatar: undefined,
    formTeacher: {
      id: 't-2',
      name: 'Mr. David Cole',
      email: 'david.cole@school.edu',
    },
    results: undefined,
    schedule: [
      { time: '08:30 - 09:30', subject: 'Reading', room: 'Room 202' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'parent-1',
        name: 'Sarah Bennett',
        email: 'sarah.bennett@example.com',
        role: 'PARENT',
        schoolId: 'sch-1',
      },
      isAuthenticated: true,
      role: 'parent',
    });
    useSchoolStore.setState({
      schoolName: 'Greenfield Academy',
      logoDataUrl: null,
    });
    vi.spyOn(announcementHooks, 'useAnnouncements').mockReturnValue({
      data: {
        data: [
          {
            id: 'ann-1',
            title: 'Term Resumption Notice',
            message: 'Classes begin Monday at 8:00 AM.',
            audiences: ['parent'],
            createdAt: '2026-09-01T08:00:00.000Z',
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 3,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof announcementHooks.useAnnouncements>);
  });

  it('renders welcome banner and ward profile with attendance ring and form teacher info', () => {
    vi.spyOn(parentHooks, 'useParentChildren').mockReturnValue({
      children: [mockChild1],
      selectedChild: mockChild1,
      selectedChildId: mockChild1.id,
      setSelectedChildId: vi.fn(),
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<ParentDashboardView />);

    expect(screen.getByText(/welcome back, sarah/i)).toBeInTheDocument();
    expect(screen.getByText(/parent workspace — greenfield academy/i)).toBeInTheDocument();
    expect(screen.getByText('Amelia Bennett')).toBeInTheDocument();
    expect(screen.getByText(/primary 5 · section a · roll #12 · adm-2024-001/i)).toBeInTheDocument();
    expect(screen.getByText('Mrs. Angela Vance')).toBeInTheDocument();
    expect(screen.getByText('94%')).toBeInTheDocument();
  });

  it('renders honest unavailable state for academic results instead of fabricated scores', () => {
    vi.spyOn(parentHooks, 'useParentChildren').mockReturnValue({
      children: [mockChild1],
      selectedChild: mockChild1,
      selectedChildId: mockChild1.id,
      setSelectedChildId: vi.fn(),
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<ParentDashboardView />);

    expect(screen.getByText('Academic results')).toBeInTheDocument();
    expect(screen.getByText('Parent results viewing is not yet available')).toBeInTheDocument();
    expect(screen.queryByText('92%')).not.toBeInTheDocument();
    expect(screen.queryByText('A+')).not.toBeInTheDocument();
  });

  it('renders today schedule, attendance trend, and real school announcements', () => {
    vi.spyOn(parentHooks, 'useParentChildren').mockReturnValue({
      children: [mockChild1],
      selectedChild: mockChild1,
      selectedChildId: mockChild1.id,
      setSelectedChildId: vi.fn(),
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<ParentDashboardView />);

    expect(screen.getByText(/today['’]s classes/i)).toBeInTheDocument();
    expect(screen.getByText('Attendance trend')).toBeInTheDocument();
    expect(screen.getByText('Term Resumption Notice')).toBeInTheDocument();
    expect(screen.queryByText('Upcoming Parent-Teacher Meeting')).not.toBeInTheDocument();
  });

  it('renders genuine announcement API error on parent dashboard without fake notices', () => {
    vi.spyOn(announcementHooks, 'useAnnouncements').mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('syntax error at or near "ANY"'),
    } as unknown as ReturnType<typeof announcementHooks.useAnnouncements>);

    vi.spyOn(parentHooks, 'useParentChildren').mockReturnValue({
      children: [mockChild1],
      selectedChild: mockChild1,
      selectedChildId: mockChild1.id,
      setSelectedChildId: vi.fn(),
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<ParentDashboardView />);

    expect(screen.getByRole('alert')).toHaveTextContent('syntax error at or near "ANY"');
  });

  it('renders child switcher when multiple wards exist and allows switching', () => {
    const setSelectedChildId = vi.fn();
    vi.spyOn(parentHooks, 'useParentChildren').mockReturnValue({
      children: [mockChild1, mockChild2],
      selectedChild: mockChild1,
      selectedChildId: mockChild1.id,
      setSelectedChildId,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<ParentDashboardView />);

    expect(screen.getByText(/select ward:/i)).toBeInTheDocument();
    expect(screen.getAllByText('Amelia Bennett').length).toBeGreaterThan(0);
    const lucasBtn = screen.getByRole('button', { name: /lucas bennett/i });
    expect(lucasBtn).toBeInTheDocument();

    fireEvent.click(lucasBtn);
    expect(setSelectedChildId).toHaveBeenCalledWith('student-2');
  });

  it('opens MessageTeacherModal when Message teacher button is clicked', () => {
    vi.spyOn(parentHooks, 'useParentChildren').mockReturnValue({
      children: [mockChild1],
      selectedChild: mockChild1,
      selectedChildId: mockChild1.id,
      setSelectedChildId: vi.fn(),
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<ParentDashboardView />);

    const messageBtn = screen.getByRole('button', { name: /message teacher/i });
    fireEvent.click(messageBtn);

    expect(screen.getByText('Message Mrs. Angela Vance')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Inquiry regarding Amelia Bennett')).toBeInTheDocument();
  });

  it('renders empty state when no wards are linked', () => {
    vi.spyOn(parentHooks, 'useParentChildren').mockReturnValue({
      children: [],
      selectedChild: null,
      selectedChildId: '',
      setSelectedChildId: vi.fn(),
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<ParentDashboardView />);

    expect(screen.getByText('No Linked Students Found')).toBeInTheDocument();
  });
});
