import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
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

  it('renders attendance page header, class selector, and summary cards', () => {
    renderWithProviders(<AttendancePage />);

    expect(screen.getByRole('heading', { name: 'Attendance' })).toBeInTheDocument();
    expect(screen.getByLabelText('Select class')).toBeInTheDocument();

    // Summary counts
    expect(screen.getByText('Present')).toBeInTheDocument();
    expect(screen.getByText('Absent')).toBeInTheDocument();
    expect(screen.getByText('Late')).toBeInTheDocument();
  });

  it('renders student roster rows with presence controls', () => {
    renderWithProviders(<AttendancePage />);

    expect(screen.getByText('Amelia Bennett')).toBeInTheDocument();
    expect(screen.getByText('Liam Carter')).toBeInTheDocument();
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
