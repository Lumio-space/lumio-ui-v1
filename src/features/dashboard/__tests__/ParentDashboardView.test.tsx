import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { ParentDashboardView } from '../components/ParentDashboardView';
import { useAuthStore } from '@/stores/auth.store';
import { useSchoolStore } from '@/stores/school.store';
import * as parentHooks from '@/features/parents/hooks';

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
    average: 88,
    avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
    formTeacher: {
      id: 't-1',
      name: 'Mrs. Angela Vance',
      email: 'angela.vance@school.edu',
    },
    results: [
      { subject: 'Mathematics', score: 92, grade: 'A+', tone: 'green' as const },
      { subject: 'English', score: 88, grade: 'A', tone: 'green' as const },
      { subject: 'Science', score: 85, grade: 'A', tone: 'green' as const },
    ],
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
    average: 91,
    avatar: undefined,
    formTeacher: {
      id: 't-2',
      name: 'Mr. David Cole',
      email: 'david.cole@school.edu',
    },
    results: [
      { subject: 'Reading', score: 95, grade: 'A+', tone: 'green' as const },
      { subject: 'Numeracy', score: 90, grade: 'A+', tone: 'green' as const },
    ],
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

  it('renders academic results card with letter grades and subject scores', () => {
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
    expect(screen.getByText('View report card')).toBeInTheDocument();
    expect(screen.getAllByText('Mathematics')[0]).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('A+')).toBeInTheDocument();
    expect(screen.getAllByText('English')[0]).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
  });

  it('renders today schedule, attendance trend, and fee notices', () => {
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
    expect(screen.getByText(/term 2 tuition & resource assessment/i)).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
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
