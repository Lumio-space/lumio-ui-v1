import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { StudentsView } from '../components/StudentsView';
import type { StudentRecord } from '../types';

const {
  mockUseStudents,
  mockUseClasses,
  mockRemoveMutateAsync,
} = vi.hoisted(() => ({
  mockUseStudents: vi.fn(),
  mockUseClasses: vi.fn(),
  mockRemoveMutateAsync: vi.fn(),
}));

vi.mock('../hooks', () => ({
  useStudents: () => mockUseStudents(),
  useRemoveStudent: () => ({
    mutateAsync: mockRemoveMutateAsync,
    isPending: false,
  }),
}));

vi.mock('@/features/classes/hooks', () => ({
  useClasses: () => mockUseClasses(),
}));

// Mock InviteStudentModal to keep test focused
vi.mock('@/features/invitations/components/InviteStudentModal', () => ({
  InviteStudentModal: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="mock-invite-student-modal">
        <button onClick={onClose}>Close Invite</button>
      </div>
    ) : null,
}));

const MOCK_STUDENTS: StudentRecord[] = [
  {
    id: 's-1',
    name: 'Amelia Bennett',
    fullName: 'Amelia Bennett',
    admissionNo: 'ADM-2041',
    grade: 'Grade 10',
    section: 'A',
    rollNo: 12,
    gender: 'Female',
    status: 'Active',
    attendance: 96,
    average: 91,
    parent: 'Robert Bennett',
    parentPhone: '+1 555 0142',
    email: 'amelia.b@lumio.edu',
    joined: '2021-08-14',
  },
  {
    id: 's-2',
    name: 'Liam Carter',
    fullName: 'Liam Carter',
    admissionNo: 'ADM-2042',
    grade: 'Grade 11',
    section: 'B',
    rollNo: 5,
    gender: 'Male',
    status: 'Inactive',
    attendance: 75,
    average: 68,
    parent: 'Sandra Carter',
    parentPhone: '+1 555 0143',
    email: 'liam.c@lumio.edu',
    joined: '2021-08-14',
  },
];

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

describe('StudentsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseClasses.mockReturnValue({ data: MOCK_CLASSES, isLoading: false });
    mockUseStudents.mockReturnValue({
      data: { data: MOCK_STUDENTS, total: 2 },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it('renders student list and summary KPIs correctly', () => {
    renderWithProviders(<StudentsView />);

    expect(screen.getByRole('heading', { name: 'Students' })).toBeInTheDocument();
    expect(screen.getByText('Amelia Bennett')).toBeInTheDocument();
    expect(screen.getByText('ADM-2041')).toBeInTheDocument();
    expect(screen.getByText('Liam Carter')).toBeInTheDocument();
    expect(screen.getByText('ADM-2042')).toBeInTheDocument();

    // KPI values
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Avg attendance')).toBeInTheDocument();
  });

  it('filters students by search query (name or admission no)', () => {
    renderWithProviders(<StudentsView />);

    const searchInput = screen.getByLabelText('Search students');
    fireEvent.change(searchInput, { target: { value: 'ADM-2041' } });

    expect(screen.getByText('Amelia Bennett')).toBeInTheDocument();
    expect(screen.queryByText('Liam Carter')).not.toBeInTheDocument();
  });

  it('filters students by status', () => {
    renderWithProviders(<StudentsView />);

    const statusSelect = screen.getByLabelText('Filter by status');
    fireEvent.change(statusSelect, { target: { value: 'Inactive' } });

    expect(screen.queryByText('Amelia Bennett')).not.toBeInTheDocument();
    expect(screen.getByText('Liam Carter')).toBeInTheDocument();
  });

  it('filters students by grade', () => {
    renderWithProviders(<StudentsView />);

    const gradeSelect = screen.getByLabelText('Filter by grade');
    fireEvent.change(gradeSelect, { target: { value: 'Grade 10' } });

    expect(screen.getByText('Amelia Bennett')).toBeInTheDocument();
    expect(screen.queryByText('Liam Carter')).not.toBeInTheDocument();
  });

  it('shows empty state and allows clearing filters when no match', () => {
    renderWithProviders(<StudentsView />);

    const searchInput = screen.getByLabelText('Search students');
    fireEvent.change(searchInput, { target: { value: 'nonexistent-student' } });

    expect(screen.getByText('No students found')).toBeInTheDocument();

    const clearButton = screen.getByRole('button', { name: /clear filters/i });
    fireEvent.click(clearButton);

    expect(screen.getByText('Amelia Bennett')).toBeInTheDocument();
  });

  it('opens student detail profile modal on row click', () => {
    renderWithProviders(<StudentsView />);

    const row = screen.getByText('Amelia Bennett');
    fireEvent.click(row);

    expect(screen.getByText('Student profile')).toBeInTheDocument();
    expect(screen.getByText('Robert Bennett')).toBeInTheDocument();
    expect(screen.getByText('+1 555 0142')).toBeInTheDocument();
  });

  it('opens invite student modal when "Add student" button is clicked', () => {
    renderWithProviders(<StudentsView />);

    const addButton = screen.getByRole('button', { name: /add student/i });
    fireEvent.click(addButton);

    expect(screen.getByTestId('mock-invite-student-modal')).toBeInTheDocument();
  });

  it('handles student deletion flow with confirmation modal', async () => {
    mockRemoveMutateAsync.mockResolvedValueOnce({});
    renderWithProviders(<StudentsView />);

    // Open first student's actions dropdown
    const actionButtons = screen.getAllByRole('button', { name: 'Student actions' });
    fireEvent.click(actionButtons[0]);

    // Click "Remove" from the opened dropdown menu
    const removeOption = screen.getByRole('menuitem', { name: /remove/i });
    fireEvent.click(removeOption);

    expect(screen.getByText(/Are you sure you want to remove this student/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /^Remove$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockRemoveMutateAsync).toHaveBeenCalledWith('s-1');
    });
  });

  it('renders loading state when query is loading', () => {
    mockUseStudents.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    });

    renderWithProviders(<StudentsView />);
    expect(screen.getByText(/loading student directory/i)).toBeInTheDocument();
  });

  it('renders error state with retry button on failure', () => {
    const mockRefetch = vi.fn();
    mockUseStudents.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: new Error('Network error'),
      refetch: mockRefetch,
    });

    renderWithProviders(<StudentsView />);
    expect(screen.getByText('Failed to load students')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalled();
  });
});
