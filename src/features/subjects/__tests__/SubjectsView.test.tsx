/**
 * SubjectsView — integration tests
 *
 * Verifies list rendering, overview stats, empty states, error handling,
 * search/filter, and modal interactions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { SubjectsView } from '../components/SubjectsView';
import type { SubjectRecord } from '../types';

const {
  mockRefetch,
  mockUseSubjects,
  mockUseClasses,
  mockUseTeachers,
  mockDeleteMutate,
} = vi.hoisted(() => ({
  mockRefetch: vi.fn(),
  mockUseSubjects: vi.fn(),
  mockUseClasses: vi.fn(),
  mockUseTeachers: vi.fn(),
  mockDeleteMutate: vi.fn(),
}));

vi.mock('../hooks', () => ({
  useSubjects: () => mockUseSubjects(),
  useCreateSubject: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateSubject: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteSubject: () => ({ mutate: mockDeleteMutate, isPending: false }),
  useAssignClasses: () => ({ mutate: vi.fn(), isPending: false }),
  useAssignTeacher: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/features/classes/hooks', () => ({
  useClasses: () => mockUseClasses(),
}));

vi.mock('@/features/teachers/hooks', () => ({
  useTeachers: () => mockUseTeachers(),
}));

const MOCK_SUBJECTS: SubjectRecord[] = [
  {
    id: 'sub-1',
    name: 'Mathematics',
    code: 'MTH',
    section: 'Primary',
    status: 'Active',
    createdOn: '2026-01-10',
    classIds: ['cls-1'],
    offerings: [
      {
        id: 'of-1',
        subjectId: 'sub-1',
        classId: 'cls-1',
        teacherIds: ['t-1'],
      },
    ],
  },
  {
    id: 'sub-2',
    name: 'Physics',
    code: 'PHY',
    section: 'Senior Secondary',
    department: 'Science',
    type: 'Compulsory',
    status: 'Active',
    createdOn: '2026-01-15',
    classIds: [],
    offerings: [],
  },
];

const MOCK_CLASSES = [
  {
    id: 'cls-1',
    schoolId: 'school-1',
    grade: 'Primary 1',
    section: 'A',
    level: 'primary',
    capacity: 35,
    room: 101,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const MOCK_TEACHERS = [
  {
    id: 't-1',
    userId: 't-1',
    firstName: 'John',
    lastName: 'Okafor',
  },
];

function stubData(overrides: {
  subjects?: SubjectRecord[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
} = {}) {
  mockUseSubjects.mockReturnValue({
    data: overrides.subjects !== undefined ? overrides.subjects : MOCK_SUBJECTS,
    isLoading: overrides.isLoading ?? false,
    isError: overrides.isError ?? false,
    error: overrides.error ?? null,
    refetch: mockRefetch,
  });
  mockUseClasses.mockReturnValue({
    data: MOCK_CLASSES,
    isLoading: false,
    isError: false,
  });
  mockUseTeachers.mockReturnValue({
    data: MOCK_TEACHERS,
    isLoading: false,
    isError: false,
  });
}

beforeEach(() => {
  mockRefetch.mockReset();
  mockUseSubjects.mockReset();
  mockUseClasses.mockReset();
  mockUseTeachers.mockReset();
  mockDeleteMutate.mockReset();
  stubData();
});

describe('SubjectsView', () => {
  describe('rendering and stats', () => {
    it('renders page header and stats cards', () => {
      renderWithProviders(<SubjectsView />);

      expect(screen.getByRole('heading', { name: /subjects/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create subject/i })).toBeInTheDocument();
      expect(screen.getByText('Total subjects')).toBeInTheDocument();
      expect(screen.getByText('Fully configured')).toBeInTheDocument();
      expect(screen.getByText('Offerings without a teacher')).toBeInTheDocument();
    });

    it('renders subjects grouped by section', () => {
      renderWithProviders(<SubjectsView />);

      expect(screen.getByText('Mathematics')).toBeInTheDocument();
      expect(screen.getByText('MTH')).toBeInTheDocument();
      expect(screen.getByText('Physics')).toBeInTheDocument();
      expect(screen.getByText('PHY')).toBeInTheDocument();
      expect(screen.getByText('Science')).toBeInTheDocument();
      expect(screen.getByText('Compulsory')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('does not render subject rows while loading', () => {
      stubData({ isLoading: true, subjects: undefined });
      renderWithProviders(<SubjectsView />);

      expect(screen.queryByText('Mathematics')).not.toBeInTheDocument();
      expect(screen.queryByText('Physics')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('renders error alert and retry button when fetching fails', () => {
      stubData({
        isError: true,
        error: new Error('Network error loading subjects'),
        subjects: undefined,
      });
      renderWithProviders(<SubjectsView />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/network error loading subjects/i)).toBeInTheDocument();
      const retryBtn = screen.getByRole('button', { name: /try again/i });
      expect(retryBtn).toBeInTheDocument();
      fireEvent.click(retryBtn);
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('empty state', () => {
    it('renders empty state when no subjects exist', () => {
      stubData({ subjects: [] });
      renderWithProviders(<SubjectsView />);

      expect(screen.getByText(/no subjects yet/i)).toBeInTheDocument();
      expect(
        screen.getByText(/create your first subject, then choose the classes/i)
      ).toBeInTheDocument();
    });
  });

  describe('filtering and search', () => {
    it('filters subjects by search term', () => {
      renderWithProviders(<SubjectsView />);

      const searchInput = screen.getByPlaceholderText(/search by subject name or code/i);
      fireEvent.change(searchInput, { target: { value: 'Phys' } });

      expect(screen.getByText('Physics')).toBeInTheDocument();
      expect(screen.queryByText('Mathematics')).not.toBeInTheDocument();
    });

    it('shows no matches empty state when filter matches nothing', () => {
      renderWithProviders(<SubjectsView />);

      const searchInput = screen.getByPlaceholderText(/search by subject name or code/i);
      fireEvent.change(searchInput, { target: { value: 'ChemistryNonExistent' } });

      expect(screen.getByText(/no subjects match your filters/i)).toBeInTheDocument();
      const clearBtn = screen.getByRole('button', { name: /clear filters/i });
      expect(clearBtn).toBeInTheDocument();
      fireEvent.click(clearBtn);

      expect(screen.getByText('Mathematics')).toBeInTheDocument();
      expect(screen.getByText('Physics')).toBeInTheDocument();
    });
  });

  describe('modals', () => {
    it('opens CreateSubjectModal when "Create subject" button is clicked', async () => {
      renderWithProviders(<SubjectsView />);

      const createBtn = screen.getByRole('button', { name: /create subject/i });
      fireEvent.click(createBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /create subject/i })).toBeInTheDocument();
      });
    });

    it('opens SubjectDetailModal when subject row is clicked', async () => {
      renderWithProviders(<SubjectsView />);

      const mathBtn = screen.getByText('Mathematics').closest('button')!;
      fireEvent.click(mathBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('MTH · Primary')).toBeInTheDocument();
      });
    });

    it('opens EditSubjectModal when "Edit subject" action is clicked', async () => {
      renderWithProviders(<SubjectsView />);

      const actionTrigger = screen.getByLabelText('Actions for Mathematics');
      fireEvent.click(actionTrigger);

      const editBtn = screen.getByText('Edit subject');
      fireEvent.click(editBtn);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit subject/i })).toBeInTheDocument();
        expect(screen.getByDisplayValue('Mathematics')).toBeInTheDocument();
        expect(screen.getByDisplayValue('MTH')).toBeInTheDocument();
      });
    });
  });

  describe('status action labels', () => {
    it('displays "Mark inactive" for active subjects and "Mark active" for inactive subjects', () => {
      stubData({
        subjects: [
          {
            id: 'sub-active',
            name: 'Active Subject',
            code: 'ACT',
            section: 'Primary',
            status: 'Active',
            createdOn: '2026-01-10',
          },
          {
            id: 'sub-inactive',
            name: 'Inactive Subject',
            code: 'INA',
            section: 'Primary',
            status: 'Inactive',
            createdOn: '2026-01-10',
          },
        ],
      });

      renderWithProviders(<SubjectsView />);

      const activeActions = screen.getByLabelText('Actions for Active Subject');
      fireEvent.click(activeActions);
      expect(screen.getByText('Mark inactive')).toBeInTheDocument();

      const inactiveActions = screen.getByLabelText('Actions for Inactive Subject');
      fireEvent.click(inactiveActions);
      expect(screen.getByText('Mark active')).toBeInTheDocument();
    });
  });

  describe('unsupported deassignment safeguards', () => {
    it('disables Remove from class in SubjectDetailModal and does not allow local-only teacher removal in AssignTeacherModal', async () => {
      renderWithProviders(<SubjectsView />);

      const mathBtn = screen.getByText('Mathematics').closest('button')!;
      fireEvent.click(mathBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('tab', { name: /classes/i }));

      const offeringActions = screen.getByLabelText('Actions for Mathematics in Primary 1 A');
      fireEvent.click(offeringActions);

      const removeItem = await screen.findByRole('menuitem', { name: /remove from class \(unavailable\)/i });
      expect(removeItem).toBeDisabled();

      // Switch to Change teacher and toggle off assigned teacher
      fireEvent.click(screen.getByRole('menuitem', { name: /change teacher/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /assign teacher/i })).toBeInTheDocument();
      });

      const teacherButton = screen.getByRole('button', { name: /teacher/i, pressed: true });
      fireEvent.click(teacherButton);

      expect(screen.getByRole('note')).toHaveTextContent(/not currently supported by the backend/i);
      const saveBtn = screen.getByRole('button', { name: /removal unavailable/i });
      expect(saveBtn).toBeDisabled();
    });
  });

  describe('subject deletion', () => {
    it('deletes subject via confirmation modal and displays success banner', async () => {
      mockDeleteMutate.mockImplementation((_id, options) => {
        options?.onSuccess?.();
      });

      renderWithProviders(<SubjectsView />);

      fireEvent.click(screen.getByLabelText('Actions for Mathematics'));
      fireEvent.click(screen.getByText('Delete subject'));

      expect(screen.getByRole('heading', { name: /delete subject/i })).toBeInTheDocument();

      const confirmBtn = screen.getByRole('button', { name: /^delete subject$/i });
      fireEvent.click(confirmBtn);

      expect(mockDeleteMutate).toHaveBeenCalledWith('sub-1', expect.any(Object));
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(
          'Subject "Mathematics" was successfully deleted.'
        );
      });
    });

    it('surfaces deletion error in the modal without closing or showing success', async () => {
      mockDeleteMutate.mockImplementation((_id, options) => {
        options?.onError?.(new Error('Cannot delete subject with existing results'));
      });

      renderWithProviders(<SubjectsView />);

      fireEvent.click(screen.getByLabelText('Actions for Mathematics'));
      fireEvent.click(screen.getByText('Delete subject'));

      fireEvent.click(screen.getByRole('button', { name: /^delete subject$/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Cannot delete subject with existing results'
        );
      });
      expect(screen.getByRole('heading', { name: /delete subject/i })).toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });
});
