import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { AdminDashboardView } from '../components/AdminDashboardView';
import { useAuthStore } from '@/stores/auth.store';
import { useSchoolStore } from '@/stores/school.store';

const mockOverview = vi.fn();
const mockAttendanceOverview = vi.fn();
const mockEnrollmentByGrade = vi.fn();

vi.mock('../hooks/useAdminDashboard', () => ({
  useAdminDashboardOverview: () => mockOverview(),
  useAdminAttendanceOverview: (from: string, to: string) => mockAttendanceOverview(from, to),
  useAdminEnrollmentByGrade: () => mockEnrollmentByGrade(),
}));

vi.mock('@/features/teachers/hooks', () => ({
  useTeachers: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/features/classes/hooks', () => ({
  useClasses: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/features/subjects/hooks', () => ({
  useSubjects: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/features/students/hooks', () => ({
  useStudents: () => ({ data: { data: [], total: 0 }, isLoading: false }),
}));

vi.mock('@/features/parents/hooks', () => ({
  useParents: () => ({ data: [], isLoading: false }),
}));

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  };
});

describe('AdminDashboardView (API Integration & Empty States)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        name: 'Dr. Admin',
        email: 'admin@school.edu',
        role: 'SCHOOL_ADMIN',
      },
      isAuthenticated: true,
      role: 'admin',
    });
    useSchoolStore.setState({
      schoolName: 'Apex International',
      logoDataUrl: null,
    });
  });

  it('renders live metrics from backend overview response without mock data', () => {
    mockOverview.mockReturnValue({
      data: {
        totalStudents: 342,
        totalTeachers: 28,
        totalClasses: 14,
        averageAttendance: 96,
      },
      isLoading: false,
      isError: false,
    });

    mockAttendanceOverview.mockReturnValue({
      data: [
        { month: '2026-01', presentRate: 92 },
        { month: '2026-02', presentRate: 95 },
      ],
      isLoading: false,
      isError: false,
    });

    mockEnrollmentByGrade.mockReturnValue({
      data: [
        { gradeLevel: 'JSS1', count: 120 },
        { gradeLevel: 'Primary1', count: 80 },
      ],
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<AdminDashboardView />);

    expect(screen.getByText('342')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('96%')).toBeInTheDocument();
  });

  it('renders clean empty states when no attendance or enrollment data is recorded', () => {
    mockOverview.mockReturnValue({
      data: {
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        averageAttendance: 0,
      },
      isLoading: false,
      isError: false,
    });

    mockAttendanceOverview.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    mockEnrollmentByGrade.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<AdminDashboardView />);

    // Should render empty state notices without fallback numbers like 93% or [25, 40, 20, 15]
    expect(screen.getByText('No Attendance Records Yet')).toBeInTheDocument();
    expect(screen.getByText('No Enrollment Data')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
