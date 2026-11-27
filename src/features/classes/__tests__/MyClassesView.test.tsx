import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { MyClassesView } from '../components/MyClassesView';
import * as classesApi from '../api/classes.api';
import * as subjectsHooks from '@/features/subjects/hooks';
import * as studentsHooks from '@/features/students/hooks';
import { useAuthStore } from '@/stores/auth.store';
import type { ClassRecord } from '../types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/my-classes',
  useSearchParams: () => new URLSearchParams(),
}));

const mockClasses: ClassRecord[] = [
  {
    id: 'cls-1',
    grade: 'Primary 1',
    section: 'A',
    level: 'primary',
    schoolId: 'school-1',
    formTeacher: 'teacher-1',
    capacity: 30,
    room: 101,
    students: 28,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cls-2',
    grade: 'Primary 2',
    section: 'A',
    level: 'primary',
    schoolId: 'school-1',
    formTeacher: 'teacher-2',
    capacity: 30,
    room: 102,
    students: 25,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const mockStudents = [
  {
    id: 'st-1',
    name: 'Amaka Okoro',
    fullName: 'Amaka Okoro',
    admissionNo: 'LUM-2026-001',
    grade: 'Primary 1',
    section: 'A',
    classId: 'cls-1',
    attendance: 96,
    status: 'Active' as const,
    parent: 'Mrs. Okoro',
    parentEmail: 'okoro@example.com',
  },
];

describe('MyClassesView - Class Assignment Isolation & Drill-Down', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(classesApi, 'fetchClasses').mockResolvedValue(mockClasses);
    vi.spyOn(subjectsHooks, 'useSubjects').mockReturnValue({
      data: [
        {
          id: 'sub-1',
          name: 'English Language',
          code: 'ENG',
          section: 'Primary',
          classIds: ['cls-1'],
        },
      ],
      isLoading: false,
    } as any);
    vi.spyOn(studentsHooks, 'useStudents').mockReturnValue({
      data: { data: mockStudents, total: 1 },
      isLoading: false,
    } as any);
  });

  it('renders ONLY the assigned class for Teacher A (Primary 1A) and not all school classes', async () => {
    useAuthStore.setState({
      user: {
        id: 'teacher-1',
        name: 'Teacher One',
        email: 'teacher1@school.edu',
        role: 'teacher',
        classId: 'cls-1',
      },
      isAuthenticated: true,
      role: 'teacher',
    });

    renderWithProviders(<MyClassesView />);

    await waitFor(() => {
      expect(screen.getByText(/Primary 1 A/i)).toBeInTheDocument();
    });

    // Verify other classes are NOT rendered
    expect(screen.queryByText(/Primary 2 A/i)).not.toBeInTheDocument();
  });

  it('shows empty state when teacher has no matching assigned class', async () => {
    useAuthStore.setState({
      user: {
        id: 'unassigned-teacher',
        name: 'New Teacher',
        email: 'unassigned@school.edu',
        role: 'teacher',
      },
      isAuthenticated: true,
      role: 'teacher',
    });

    renderWithProviders(<MyClassesView />);

    await waitFor(() => {
      expect(screen.getByText(/No classes assigned yet/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Primary 1 A/i)).not.toBeInTheDocument();
  });

  it('navigates to class cohort drill-down when class card is clicked and enables form teacher actions', async () => {
    useAuthStore.setState({
      user: {
        id: 'teacher-1',
        name: 'Teacher One',
        email: 'teacher1@school.edu',
        role: 'teacher',
        classId: 'cls-1',
      },
      isAuthenticated: true,
      role: 'teacher',
    });

    renderWithProviders(<MyClassesView />);

    await waitFor(() => {
      expect(screen.getByText(/Primary 1 A/i)).toBeInTheDocument();
    });

    // Click class card to open drill-down
    fireEvent.click(screen.getByText(/Primary 1 A/i));

    // Drill-down header and back button should appear
    expect(screen.getByText(/Back to My Classes/i)).toBeInTheDocument();
    expect(screen.getByText(/Mark Daily Register/i)).toBeInTheDocument();
    expect(screen.getByText(/Student Register/i)).toBeInTheDocument();

    // Student roster should be displayed
    expect(screen.getByText('Amaka Okoro')).toBeInTheDocument();
    expect(screen.getByText('LUM-2026-001')).toBeInTheDocument();

    // Form teacher should see Message Parent button
    expect(screen.getByRole('button', { name: /message parent/i })).toBeInTheDocument();
  });

  it('displays formTeacherName instead of raw formTeacher UUID in class drill-down', async () => {
    vi.spyOn(classesApi, 'fetchClasses').mockResolvedValue([
      {
        id: 'cls-uuid',
        grade: 'Primary 1',
        section: 'A',
        level: 'primary',
        schoolId: 'school-1',
        formTeacher: '123e4567-e89b-12d3-a456-426614174000',
        formTeacherName: 'Mrs. Chidinma Eze',
        capacity: 30,
        room: 101,
        students: 20,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    useAuthStore.setState({
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Mrs. Chidinma Eze',
        email: 'chidinma@school.edu',
        role: 'teacher',
        classId: 'cls-uuid',
      },
      isAuthenticated: true,
      role: 'teacher',
    });

    renderWithProviders(<MyClassesView />);

    await waitFor(() => {
      expect(screen.getByText(/Primary 1 A/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Primary 1 A/i));

    expect(screen.getByText('Mrs. Chidinma Eze')).toBeInTheDocument();
    expect(
      screen.queryByText('123e4567-e89b-12d3-a456-426614174000')
    ).not.toBeInTheDocument();
  });

  it('surfaces API error instead of showing empty state when loading classes fails', async () => {
    vi.spyOn(classesApi, 'fetchClasses').mockRejectedValue(
      new Error('Internal server error')
    );

    renderWithProviders(<MyClassesView />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load classes/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/No classes assigned yet/i)).not.toBeInTheDocument();
  });

  it('sorts assigned teaching classes deterministically (level, grade, department, arm) and excludes deleted classes', async () => {
    vi.spyOn(classesApi, 'fetchClasses').mockResolvedValue([
      {
        id: 'cls-sss1',
        grade: 'SSS1',
        section: 'A',
        level: 'senior_secondary',
        department: 'Science',
        schoolId: 'school-1',
        formTeacher: 'teacher-1',
        capacity: 30,
        room: 301,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'cls-jss2a',
        grade: 'JSS2',
        section: 'A',
        level: 'junior_secondary',
        schoolId: 'school-1',
        formTeacher: 'teacher-1',
        capacity: 30,
        room: 201,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'cls-jss1b',
        grade: 'JSS1',
        section: 'B',
        level: 'junior_secondary',
        schoolId: 'school-1',
        formTeacher: 'teacher-1',
        capacity: 30,
        room: 102,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'cls-jss1a',
        grade: 'JSS1',
        section: 'A',
        level: 'junior_secondary',
        schoolId: 'school-1',
        formTeacher: 'teacher-1',
        capacity: 30,
        room: 101,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    useAuthStore.setState({
      user: {
        id: 'teacher-1',
        name: 'Teacher One',
        email: 'teacher1@school.edu',
        role: 'teacher',
      },
      isAuthenticated: true,
      role: 'teacher',
    });

    renderWithProviders(<MyClassesView />);

    await waitFor(() => {
      expect(screen.getByText('JSS 1 A')).toBeInTheDocument();
    });

    const orderedLabels = screen
      .getAllByText(/^(JSS|SSS) /i)
      .map((el) => el.textContent);
    expect(orderedLabels).toEqual([
      'JSS 1 A',
      'JSS 1 B',
      'JSS 2 A',
      'SSS 1 Science A',
    ]);
  });

  it('displays clear permission-restricted state on 403 instead of fake empty state', async () => {
    const forbiddenErr = Object.assign(new Error('Insufficient permissions'), {
      status: 403,
      response: { status: 403 },
    });
    vi.spyOn(classesApi, 'fetchClasses').mockRejectedValue(forbiddenErr);

    useAuthStore.setState({
      user: {
        id: 'teacher-1',
        name: 'Teacher One',
        email: 'teacher1@school.edu',
        role: 'teacher',
      },
      isAuthenticated: true,
      role: 'teacher',
    });

    renderWithProviders(<MyClassesView />);

    await waitFor(() => {
      expect(screen.getByText('Teaching Classes Unavailable')).toBeInTheDocument();
    });
    expect(screen.queryByText(/no classes assigned yet/i)).not.toBeInTheDocument();
  });
});
