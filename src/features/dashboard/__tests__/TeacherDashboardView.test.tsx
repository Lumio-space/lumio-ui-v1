import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { TeacherDashboardView } from '../components/TeacherDashboardView';
import { useAuthStore } from '@/stores/auth.store';
import { useSchoolStore } from '@/stores/school.store';
import * as classesHooks from '@/features/classes/hooks';
import * as subjectsHooks from '@/features/subjects/hooks';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/dashboard',
}));

describe('TeacherDashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 't-1',
        name: 'Daniel Okafor',
        email: 'daniel.o@school.edu',
        role: 'TEACHER',
        schoolId: 'sch-1',
        classId: 'c-1',
      },
      isAuthenticated: true,
      role: 'teacher',
    });
    useSchoolStore.setState({
      schoolName: 'Greenfield College',
      logoDataUrl: null,
    });
  });

  it('renders welcome banner with teacher name and school name', () => {
    vi.spyOn(classesHooks, 'useClasses').mockReturnValue({
      data: [],
      isLoading: false,
    } as any);
    vi.spyOn(subjectsHooks, 'useSubjects').mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    renderWithProviders(<TeacherDashboardView />);

    expect(screen.getByText(/welcome back, daniel/i)).toBeInTheDocument();
    expect(screen.getByText(/teacher workspace — greenfield college/i)).toBeInTheDocument();
  });

  it('renders 4 workload stat cards with accurate counts', () => {
    const mockClasses = [
      {
        id: 'c-1',
        grade: 'SS2',
        section: 'A',
        level: 'Senior Secondary',
        department: 'Science',
        room: 101,
        students: 30,
        formTeacher: 'Daniel Okafor',
      },
      {
        id: 'c-2',
        grade: 'SS1',
        section: 'B',
        level: 'Senior Secondary',
        department: 'Science',
        room: 102,
        students: 25,
        teacher: 'Daniel Okafor',
      },
    ];

    const mockSubjects = [
      {
        id: 's-1',
        name: 'Physics',
        code: 'PHY',
        section: 'Senior Secondary',
        classIds: ['c-1'],
        offerings: [{ classId: 'c-1', teacherIds: ['t-1'] }],
      },
    ];

    vi.spyOn(classesHooks, 'useClasses').mockReturnValue({
      data: mockClasses,
      isLoading: false,
    } as any);
    vi.spyOn(subjectsHooks, 'useSubjects').mockReturnValue({
      data: mockSubjects,
      isLoading: false,
    } as any);

    renderWithProviders(<TeacherDashboardView />);

    expect(screen.getByText('My Classes')).toBeInTheDocument();
    expect(screen.getAllByText('My Subjects')[0]).toBeInTheDocument();
    expect(screen.getByText('My Students')).toBeInTheDocument();
    expect(screen.getByText('Form Classes')).toBeInTheDocument();

    // Student total: 30 + 25 = 55
    expect(screen.getByText('55')).toBeInTheDocument();
  });

  it('highlights Form Teacher duties and displays pastoral care section when assigned as Form Teacher', () => {
    const mockClasses = [
      {
        id: 'c-1',
        grade: 'SS2',
        section: 'A',
        level: 'Senior Secondary',
        department: 'Science',
        students: 30,
        formTeacher: 'Daniel Okafor',
      },
    ];

    vi.spyOn(classesHooks, 'useClasses').mockReturnValue({
      data: mockClasses,
      isLoading: false,
    } as any);
    vi.spyOn(subjectsHooks, 'useSubjects').mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    renderWithProviders(<TeacherDashboardView />);

    expect(screen.getByText(/form teacher duties/i)).toBeInTheDocument();
    expect(screen.getByText(/daily attendance register unlocked/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /record today['’]s register/i })).toBeInTheDocument();
  });

  it('renders today schedule periods based on assigned classes', () => {
    const mockClasses = [
      {
        id: 'c-1',
        grade: 'SS2',
        section: 'A',
        level: 'Senior Secondary',
        department: 'Science',
        room: 'Lab 2',
        students: 30,
        teacher: 'Daniel Okafor',
      },
    ];

    const mockSubjects = [
      {
        id: 's-1',
        name: 'Physics',
        code: 'PHY',
        section: 'Senior Secondary',
        classIds: ['c-1'],
      },
    ];

    vi.spyOn(classesHooks, 'useClasses').mockReturnValue({
      data: mockClasses,
      isLoading: false,
    } as any);
    vi.spyOn(subjectsHooks, 'useSubjects').mockReturnValue({
      data: mockSubjects,
      isLoading: false,
    } as any);

    renderWithProviders(<TeacherDashboardView />);

    expect(screen.getByText(/today['’]s schedule/i)).toBeInTheDocument();
    expect(screen.getByText('08:30 – 09:15')).toBeInTheDocument();
    expect(screen.getByText('Lab 2')).toBeInTheDocument();
  });
});
