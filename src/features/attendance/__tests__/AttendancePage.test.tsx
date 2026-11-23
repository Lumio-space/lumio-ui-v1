import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import AttendancePage from '@/app/(dashboard)/attendance/page';
import { useAuthStore } from '@/stores/auth.store';

const {
  mockUseClasses,
  mockUseClassAttendance,
  mockSaveMutateAsync,
} = vi.hoisted(() => ({
  mockUseClasses: vi.fn(),
  mockUseClassAttendance: vi.fn(),
  mockSaveMutateAsync: vi.fn(),
}));

vi.mock('@/features/classes/hooks', () => ({
  useClasses: () => mockUseClasses(),
}));

vi.mock('@/features/attendance/hooks/useAttendance', () => ({
  useClassAttendance: (classId: string, date: string) =>
    mockUseClassAttendance(classId, date),
  useSaveAttendance: () => ({
    mutateAsync: mockSaveMutateAsync,
    isPending: false,
  }),
  useUpdateAttendance: () => ({
    mutateAsync: mockSaveMutateAsync,
    isPending: false,
  }),
}));

// Mock Recharts ResponsiveContainer to avoid SVG measurement errors in jsdom
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  };
});

const MOCK_CLASSES = [
  {
    id: 'cls-1',
    grade: 'Grade 10',
    section: 'A',
    formTeacher: 'teacher-1',
  },
  {
    id: 'cls-2',
    grade: 'Grade 11',
    section: 'B',
  },
];

const MOCK_ATTENDANCE = {
  classId: 'cls-1',
  date: '2026-06-28',
  summary: {
    present: 15,
    absent: 2,
    late: 1,
    excused: 0,
    total: 18,
  },
  students: [
    {
      studentId: 's-1',
      name: 'Amelia Bennett',
      status: 'present',
      rollNo: '12',
    },
    {
      studentId: 's-2',
      name: 'Liam Carter',
      status: 'absent',
      rollNo: '5',
    },
  ],
};

describe('AttendancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      role: 'admin',
      user: {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'SCHOOL_ADMIN',
      },
    });
    mockUseClasses.mockReturnValue({
      data: MOCK_CLASSES,
      isLoading: false,
    });
    mockUseClassAttendance.mockReturnValue({
      data: MOCK_ATTENDANCE,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it('renders attendance page header, class selector, and summary cards in admin view', () => {
    renderWithProviders(<AttendancePage />);

    expect(screen.getByRole('heading', { name: 'Attendance' })).toBeInTheDocument();
    expect(screen.getByLabelText('Select class')).toBeInTheDocument();

    // Summary counts
    expect(screen.getAllByText('Present').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Absent').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Late')).toBeInTheDocument();
  });

  it('enforces read-only attendance view for administrators (no mark or save controls)', () => {
    renderWithProviders(<AttendancePage />);

    // Admin view banner is shown
    expect(screen.getByText(/Administrator View \(Read-Only\)/i)).toBeInTheDocument();

    // Roster shows read-only view badge
    expect(screen.getByText('Read-only view')).toBeInTheDocument();

    // Interactive marking and save controls are NOT rendered for Admin
    expect(screen.queryByText('Mark all present')).not.toBeInTheDocument();
    expect(screen.queryByText('Save register')).not.toBeInTheDocument();

    // Student names and their read-only attendance status badges are visible
    expect(screen.getByText('Amelia Bennett')).toBeInTheDocument();
    expect(screen.getByText('Liam Carter')).toBeInTheDocument();
  });

  it('allows appointed Form Teachers to mark and save attendance', async () => {
    // Set authenticated user to the designated form teacher of cls-1
    useAuthStore.setState({
      role: 'teacher',
      user: {
        id: 'teacher-1',
        name: 'Form Teacher',
        email: 'teacher@example.com',
        role: 'TEACHER',
      },
    });

    renderWithProviders(<AttendancePage />);

    // Form teacher authorized banner is displayed
    expect(
      screen.getByText(/You are the designated Form Teacher for Grade 10 A/i)
    ).toBeInTheDocument();

    // Marking and save buttons are accessible
    const markAllBtn = screen.getByText('Mark all present');
    const saveBtn = screen.getByText('Save register');
    expect(markAllBtn).toBeInTheDocument();
    expect(saveBtn).toBeInTheDocument();

    // Click Save register to submit attendance
    await act(async () => {
      fireEvent.click(saveBtn);
    });
    expect(mockSaveMutateAsync).toHaveBeenCalled();
  });

  it('enforces read-only view for teachers who are not the appointed Form Teacher', () => {
    // Teacher who is NOT the form teacher of cls-1
    useAuthStore.setState({
      role: 'teacher',
      user: {
        id: 'other-teacher-99',
        name: 'Subject Teacher',
        email: 'other@example.com',
        role: 'TEACHER',
      },
    });

    renderWithProviders(<AttendancePage />);

    // Non-form teacher notice is shown
    expect(
      screen.getByText(/Read-Only Register — Only the appointed Form Teacher/i)
    ).toBeInTheDocument();

    // Save and mark-all buttons are NOT present
    expect(screen.queryByText('Mark all present')).not.toBeInTheDocument();
    expect(screen.queryByText('Save register')).not.toBeInTheDocument();
  });

  it('renders calendar month grid and monthly trend chart', () => {
    renderWithProviders(<AttendancePage />);

    expect(screen.getByText('Monthly trend')).toBeInTheDocument();
    expect(screen.getByText('≥95%')).toBeInTheDocument();
    expect(screen.getByText('85–94%')).toBeInTheDocument();
    expect(screen.getByText('<85%')).toBeInTheDocument();
  });

  it('handles 403 Forbidden gracefully with non-blocking Form Teacher notice', () => {
    mockUseClassAttendance.mockReturnValue({
      data: null,
      isLoading: false,
      error: { status: 403, response: { status: 403 } },
      refetch: vi.fn(),
    });

    renderWithProviders(<AttendancePage />);

    expect(screen.getByText('Form Teacher Access Required')).toBeInTheDocument();
    expect(screen.getByText('Roster Locked')).toBeInTheDocument();
    // Trend chart remains accessible
    expect(screen.getByText('Monthly trend')).toBeInTheDocument();
  });

  it('allows Form Teacher matched by name or classId to mark attendance', async () => {
    useAuthStore.setState({
      role: 'teacher',
      user: {
        id: 'different-id-99',
        name: 'teacher-1',
        email: 't1@example.com',
        role: 'TEACHER',
      },
    });

    renderWithProviders(<AttendancePage />);

    expect(
      screen.getByText(/You are the designated Form Teacher for Grade 10 A/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Mark all present')).toBeInTheDocument();
    expect(screen.getByText('Save register')).toBeInTheDocument();
  });

  it('allows Form Teacher matched via user.fullName when user.name is omitted', async () => {
    // Backend auth returns users.full_name as fullName
    mockUseClasses.mockReturnValue({
      data: [
        {
          id: 'cls-1',
          grade: 'Grade 10',
          section: 'A',
          formTeacher: 't-uuid-999',
          formTeacherName: 'Mrs. Angela Vance',
        },
      ],
      isLoading: false,
    });

    useAuthStore.setState({
      role: 'teacher',
      user: {
        id: 'different-uuid-888',
        name: '',
        fullName: 'Mrs. Angela Vance',
        email: 'angela@school.edu',
        role: 'TEACHER',
      },
    });

    renderWithProviders(<AttendancePage />);

    expect(
      screen.getByText(/You are the designated Form Teacher for Grade 10 A/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Mark all present')).toBeInTheDocument();
    expect(screen.getByText('Save register')).toBeInTheDocument();
  });

  it('preserves KPI summary cards and calendar metrics in admin read-only mode', () => {
    useAuthStore.setState({
      role: 'admin',
      user: {
        id: 'adm-999',
        name: 'Head Principal',
        email: 'principal@school.edu',
        role: 'SCHOOL_ADMIN',
      },
    });

    renderWithProviders(<AttendancePage />);

    // KPI cards are visible with correct data
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Today’s rate")).toBeInTheDocument();

    // Roster is read-only
    expect(screen.getByText('Read-only view')).toBeInTheDocument();
    expect(screen.queryByText('Mark all present')).not.toBeInTheDocument();
    expect(screen.queryByText('Save register')).not.toBeInTheDocument();
  });

  it('renders dedicated Ward Attendance view when role is parent', () => {
    useAuthStore.setState({
      role: 'parent',
      user: {
        id: 'p-1',
        name: 'Sarah Bennett',
        email: 'sarah@example.com',
        role: 'PARENT',
        children: [
          {
            id: 'c-1',
            studentId: 'c-1',
            name: 'Amelia Bennett',
            grade: 'Primary 5',
            section: 'A',
            attendance: 94,
          },
        ],
      },
    });

    renderWithProviders(<AttendancePage />);

    expect(screen.getByRole('heading', { name: 'Ward Attendance' })).toBeInTheDocument();
    expect(screen.getByText(/Review your child's daily presence and monthly attendance rate\./i)).toBeInTheDocument();
    expect(screen.getByText('Amelia Bennett')).toBeInTheDocument();
    expect(screen.queryByLabelText('Select class')).not.toBeInTheDocument();
  });
});
