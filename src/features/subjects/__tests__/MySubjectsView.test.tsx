import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { MySubjectsView } from '../components/MySubjectsView';
import * as subjectsHooks from '@/features/subjects/hooks';
import * as classesHooks from '@/features/classes/hooks';
import * as studentsHooks from '@/features/students/hooks';
import { useAuthStore } from '@/stores/auth.store';
import type { SubjectRecord } from '../types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/my-subjects',
  useSearchParams: () => new URLSearchParams(),
}));

const mockSubjects: SubjectRecord[] = [
  {
    id: 'sub-1',
    name: 'Physics',
    code: 'PHY',
    section: 'Senior Secondary',
    department: 'Science',
    type: 'Compulsory',
    status: 'Active',
    createdOn: '2026-01-01',
    classIds: ['cls-1'],
    offerings: [
      {
        id: 'off-1',
        subjectId: 'sub-1',
        classId: 'cls-1',
        teacherIds: ['teacher-1'],
      },
    ],
  },
  {
    id: 'sub-2',
    name: 'Literature in English',
    code: 'LIT',
    section: 'Senior Secondary',
    department: 'Arts',
    type: 'Elective',
    status: 'Active',
    createdOn: '2026-01-01',
    classIds: ['cls-2'],
    offerings: [
      {
        id: 'off-2',
        subjectId: 'sub-2',
        classId: 'cls-2',
        teacherIds: ['teacher-2'],
      },
    ],
  },
];

const mockClasses = [
  {
    id: 'cls-1',
    grade: 'SS2',
    section: 'A',
    level: 'Senior Secondary',
    department: 'Science',
    room: 101,
    students: 32,
    formTeacher: 'teacher-1',
  },
];

describe('MySubjectsView - Teacher Scoped Subjects & Drill-Down', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(subjectsHooks, 'useSubjects').mockReturnValue({
      data: mockSubjects,
      isLoading: false,
    } as any);
    vi.spyOn(classesHooks, 'useClasses').mockReturnValue({
      data: mockClasses,
      isLoading: false,
    } as any);
    vi.spyOn(studentsHooks, 'useStudents').mockReturnValue({
      data: { data: [], total: 0 },
      isLoading: false,
    } as any);
  });

  it('renders ONLY the assigned subject for Teacher One (Physics) and excludes unassigned subjects', async () => {
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

    renderWithProviders(<MySubjectsView />);

    expect(screen.getByText('Physics')).toBeInTheDocument();
    expect(screen.getByText('PHY')).toBeInTheDocument();

    // Literature should NOT be rendered
    expect(screen.queryByText('Literature in English')).not.toBeInTheDocument();
  });

  it('shows empty state when teacher has no assigned subjects', async () => {
    useAuthStore.setState({
      user: {
        id: 'unassigned-teacher',
        name: 'New Staff',
        email: 'new@school.edu',
        role: 'teacher',
      },
      isAuthenticated: true,
      role: 'teacher',
    });

    renderWithProviders(<MySubjectsView />);

    expect(screen.getByText(/no subjects assigned yet/i)).toBeInTheDocument();
    expect(screen.queryByText('Physics')).not.toBeInTheDocument();
  });

  it('navigates to subject drill-down when subject card is clicked', async () => {
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

    renderWithProviders(<MySubjectsView />);

    fireEvent.click(screen.getByText('Physics'));

    // Header and back button appear
    expect(screen.getByText(/back to my subjects/i)).toBeInTheDocument();
    expect(screen.getByText(/classes you teach in physics/i)).toBeInTheDocument();
    expect(screen.getByText(/SS2 Science A/i)).toBeInTheDocument();
    expect(screen.getByText(/open teaching context/i)).toBeInTheDocument();
  });
});
