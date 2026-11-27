import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders, userEvent } from '@/test/utils';
import { AssignTeacherSubjectModal } from '../components/AssignTeacherSubjectModal';
import type { TeacherRecord } from '../types';
import type { ClassRecord } from '@/features/classes/types';
import type { SubjectRecord } from '@/features/subjects/types';

const mockMutateAsync = vi.fn();
const mockUseClasses = vi.fn();
const mockUseSubjects = vi.fn();

vi.mock('../hooks', () => ({
  useAssignTeacherSubject: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock('@/features/classes/hooks', () => ({
  useClasses: () => mockUseClasses(),
}));

vi.mock('@/features/subjects/hooks', () => ({
  useSubjects: () => mockUseSubjects(),
}));

const MOCK_TEACHER: TeacherRecord = {
  id: 't-1',
  userId: 'u-1',
  fullName: 'Dr. John Doe',
  email: 'john.doe@school.edu',
  role: 'teacher',
  status: 'active',
  joinedAt: '2026-01-01',
  subjects: [],
};

const MOCK_CLASSES: ClassRecord[] = [
  {
    id: 'cls-1',
    schoolId: 'sch-1',
    grade: 'JSS1',
    section: 'A',
    level: 'junior_secondary',
    capacity: 30,
    room: 101,
    createdAt: '2026-01-01',
  },
  {
    id: 'cls-2',
    schoolId: 'sch-1',
    grade: 'JSS1',
    section: 'B',
    level: 'junior_secondary',
    capacity: 30,
    room: 102,
    createdAt: '2026-01-01',
  },
  {
    id: 'cls-3',
    schoolId: 'sch-1',
    grade: 'Primary1',
    section: 'A',
    level: 'primary',
    capacity: 25,
    room: 201,
    createdAt: '2026-01-01',
  },
];

const MOCK_SUBJECTS: SubjectRecord[] = [
  {
    id: 'sub-math',
    name: 'Mathematics',
    code: 'MTH',
    section: 'Junior Secondary',
    status: 'Active',
    createdOn: '2026-01-01',
    classIds: ['cls-1', 'cls-2'],
  },
  {
    id: 'sub-eng',
    name: 'English Language',
    code: 'ENG',
    section: 'Primary',
    status: 'Active',
    createdOn: '2026-01-01',
    classIds: ['cls-3'],
  },
];

describe('AssignTeacherSubjectModal (Multi-Class Selection & Backend Guard)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseClasses.mockReturnValue({
      data: MOCK_CLASSES,
      isLoading: false,
    });
    mockUseSubjects.mockReturnValue({
      data: MOCK_SUBJECTS,
      isLoading: false,
    });
  });

  it('renders modal with subject select and class cohort checklist', () => {
    renderWithProviders(
      <AssignTeacherSubjectModal
        open={true}
        onClose={vi.fn()}
        teacher={MOCK_TEACHER}
      />
    );

    expect(screen.getByText('Assign subject course')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /^subject$/i })).toBeInTheDocument();
    expect(screen.getByText('Class Cohorts')).toBeInTheDocument();
  });

  it('filters available classes based on selected subject', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AssignTeacherSubjectModal
        open={true}
        onClose={vi.fn()}
        teacher={MOCK_TEACHER}
      />
    );

    // Select Mathematics (scoped to cls-1 and cls-2)
    const select = screen.getByRole('combobox', { name: /^subject$/i });
    await user.selectOptions(select, 'sub-math');

    // Should display JSS 1 A and JSS 1 B, but NOT Primary 1 A
    expect(screen.getByText('JSS 1 A')).toBeInTheDocument();
    expect(screen.getByText('JSS 1 B')).toBeInTheDocument();
    expect(screen.queryByText('Primary 1 A')).not.toBeInTheDocument();
  });

  it('allows multi-selection of classes with distinct visual state', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AssignTeacherSubjectModal
        open={true}
        onClose={vi.fn()}
        teacher={MOCK_TEACHER}
      />
    );

    const select = screen.getByRole('combobox', { name: /^subject$/i });
    await user.selectOptions(select, 'sub-math');

    const classA = screen.getByRole('button', { name: /jss 1 a/i });
    const classB = screen.getByRole('button', { name: /jss 1 b/i });

    // Click both
    await user.click(classA);
    expect(screen.getByText('1 of 2 selected')).toBeInTheDocument();

    await user.click(classB);
    expect(screen.getByText('2 of 2 selected')).toBeInTheDocument();
  });

  it('submits single class selection adhering to backend DTO contract', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = vi.fn();
    const mockOnClose = vi.fn();

    renderWithProviders(
      <AssignTeacherSubjectModal
        open={true}
        onClose={mockOnClose}
        teacher={MOCK_TEACHER}
        onSuccess={mockOnSuccess}
      />
    );

    const select = screen.getByRole('combobox', { name: /^subject$/i });
    await user.selectOptions(select, 'sub-math');

    const classA = screen.getByRole('button', { name: /jss 1 a/i });
    await user.click(classA);

    const submitBtn = screen.getByRole('button', { name: /assign subject/i });
    expect(submitBtn).toBeEnabled();

    await user.click(submitBtn);

    expect(mockMutateAsync).toHaveBeenCalledWith({
      teacherId: 'u-1',
      classId: 'cls-1',
      subjectId: 'sub-math',
    });
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('prevents submitting batch payload when multiple classes are selected and displays backend limitation advisory', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AssignTeacherSubjectModal
        open={true}
        onClose={vi.fn()}
        teacher={MOCK_TEACHER}
      />
    );

    const select = screen.getByRole('combobox', { name: /^subject$/i });
    await user.selectOptions(select, 'sub-math');

    const classA = screen.getByRole('button', { name: /jss 1 a/i });
    const classB = screen.getByRole('button', { name: /jss 1 b/i });

    await user.click(classA);
    await user.click(classB);

    // Advisory notice should be rendered
    expect(screen.getByRole('note')).toHaveTextContent(/backend limitation/i);
    expect(screen.getByRole('note')).toHaveTextContent(/POST \/teachers\/assign-subject-to-teacher.*currently only accepts a single classId/i);

    // Submit button should be disabled for batch selection
    const batchButton = screen.getByRole('button', { name: /batch requires backend update/i });
    expect(batchButton).toBeDisabled();

    // Mutate should NOT have been called
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('excludes soft-deleted classes from cohort checklist', () => {
    mockUseClasses.mockReturnValue({
      data: [
        ...MOCK_CLASSES,
        {
          id: 'cls-deleted',
          schoolId: 'sch-1',
          grade: 'JSS2',
          section: 'C',
          level: 'junior_secondary',
          capacity: 30,
          room: 199,
          createdAt: '2026-01-01',
          deletedAt: '2026-02-01',
        },
      ],
      isLoading: false,
    });

    renderWithProviders(
      <AssignTeacherSubjectModal
        open={true}
        onClose={vi.fn()}
        teacher={MOCK_TEACHER}
      />
    );

    expect(screen.getByText('JSS 1 A')).toBeInTheDocument();
    expect(screen.queryByText('JSS 2 C')).not.toBeInTheDocument();
  });
});
