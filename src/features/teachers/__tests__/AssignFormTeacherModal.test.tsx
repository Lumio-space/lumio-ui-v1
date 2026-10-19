import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent } from '@/test/utils';
import { AssignFormTeacherModal } from '../components/AssignFormTeacherModal';
import type { TeacherRecord } from '../types';
import type { ClassRecord } from '@/features/classes/types';

const mockMutateAsync = vi.fn();
const mockUseTeachers = vi.fn();
const mockUseClasses = vi.fn();

vi.mock('../hooks', () => ({
  useAssignFormTeacher: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useTeachers: () => mockUseTeachers(),
}));

vi.mock('@/features/classes/hooks', () => ({
  useClasses: () => mockUseClasses(),
}));

const MOCK_CLASS: ClassRecord = {
  id: 'cls-1',
  schoolId: 'school-1',
  grade: 'Primary 1',
  section: 'A',
  level: 'primary',
  capacity: 30,
  room: 101,
  formTeacher: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const MOCK_TEACHER: TeacherRecord = {
  id: 't-1',
  userId: 'u-1',
  schoolId: 'school-1',
  fullName: 'Mr. David Ade',
  email: 'david.ade@school.edu',
  role: 'teacher',
  status: 'active',
  joinedAt: '2026-01-01T00:00:00.000Z',
  subjects: [],
  department: 'Sciences',
};

describe('AssignFormTeacherModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseClasses.mockReturnValue({
      data: [MOCK_CLASS],
      isLoading: false,
    });
    mockUseTeachers.mockReturnValue({
      data: [MOCK_TEACHER],
      isLoading: false,
    });
  });

  it('renders class-first mode and allows assigning active accepted teacher to class', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    renderWithProviders(
      <AssignFormTeacherModal
        open={true}
        onClose={handleClose}
        targetClass={MOCK_CLASS}
        onSuccess={handleSuccess}
      />
    );

    expect(screen.getByRole('heading', { name: /assign form teacher/i })).toBeInTheDocument();
    expect(screen.getByText(/choose an active teacher to lead primary 1 a/i)).toBeInTheDocument();
    expect(screen.getByText('Mr. David Ade')).toBeInTheDocument();
    expect(screen.getByText('david.ade@school.edu')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();

    const teacherBtn = screen.getByRole('button', { name: /mr\. david ade/i });
    await user.click(teacherBtn);

    expect(mockMutateAsync).toHaveBeenCalledWith({
      classId: 'cls-1',
      teacherId: 'u-1',
    });
    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('shows empty state when no active accepted teachers exist in class-first mode', () => {
    mockUseTeachers.mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderWithProviders(
      <AssignFormTeacherModal
        open={true}
        onClose={vi.fn()}
        targetClass={MOCK_CLASS}
        onInviteTeacher={vi.fn()}
      />
    );

    expect(screen.getByText('No eligible teachers available')).toBeInTheDocument();
    expect(
      screen.getByText(
        /only teachers who have accepted their school invitation can be assigned as form teachers/i
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /invite teacher/i })).toBeInTheDocument();
  });

  it('renders teacher-first mode when teacher prop is passed', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    renderWithProviders(
      <AssignFormTeacherModal
        open={true}
        onClose={handleClose}
        teacher={MOCK_TEACHER}
      />
    );

    expect(
      screen.getByText(/choose the class mr\. david ade will lead as form teacher/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Primary 1 A')).toBeInTheDocument();

    const classBtn = screen.getByRole('button', { name: /primary 1 a/i });
    await user.click(classBtn);

    expect(mockMutateAsync).toHaveBeenCalledWith({
      classId: 'cls-1',
      teacherId: 'u-1',
    });
  });
});
