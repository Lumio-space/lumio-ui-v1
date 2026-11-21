import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { ParentsView } from '../components/ParentsView';
import type { ParentRecord } from '../types';

const { mockUseParents } = vi.hoisted(() => ({
  mockUseParents: vi.fn(),
}));

vi.mock('../hooks', () => ({
  useParents: () => mockUseParents(),
}));

// Mock InviteParentModal
vi.mock('@/features/invitations/components/InviteParentModal', () => ({
  InviteParentModal: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="mock-invite-parent-modal">
        <button onClick={onClose}>Close Invite</button>
      </div>
    ) : null,
}));

const MOCK_PARENTS: ParentRecord[] = [
  {
    id: 'p-1',
    name: 'Robert Bennett',
    fullName: 'Robert Bennett',
    email: 'robert@example.com',
    phone: '+1 555 0142',
    status: 'Active',
    children: [
      {
        studentId: 's-1',
        studentName: 'Amelia Bennett',
        grade: 'Grade 10',
        section: 'A',
        className: 'Grade 10 · A',
        relationship: 'Father',
      },
    ],
  },
  {
    id: 'p-2',
    name: 'Sandra Carter',
    fullName: 'Sandra Carter',
    email: 'sandra@example.com',
    phone: '+1 555 0143',
    status: 'Active',
    children: [
      {
        studentId: 's-2',
        studentName: 'Liam Carter',
        grade: 'Grade 11',
        section: 'B',
        className: 'Grade 11 · B',
        relationship: 'Mother',
      },
      {
        studentId: 's-3',
        studentName: 'Lucas Carter',
        grade: 'Primary 4',
        section: 'A',
        className: 'Primary 4 · A',
        relationship: 'Mother',
      },
    ],
  },
];

describe('ParentsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParents.mockReturnValue({
      data: { data: MOCK_PARENTS, total: 2 },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it('renders parents directory, cards, and KPI counters', () => {
    renderWithProviders(<ParentsView />);

    expect(screen.getByRole('heading', { name: 'Parents' })).toBeInTheDocument();
    expect(screen.getByText('Robert Bennett')).toBeInTheDocument();
    expect(screen.getByText('Sandra Carter')).toBeInTheDocument();
    expect(screen.getByText('robert@example.com')).toBeInTheDocument();
    expect(screen.getByText('+1 555 0142')).toBeInTheDocument();

    // KPI stats
    expect(screen.getByText('Total Parents')).toBeInTheDocument();
    expect(screen.getByText('Active Accounts')).toBeInTheDocument();
    expect(screen.getByText('Linked Students')).toBeInTheDocument();
  });

  it('renders linked children badges on parent cards', () => {
    renderWithProviders(<ParentsView />);

    expect(screen.getByText('Amelia')).toBeInTheDocument();
    expect(screen.getByText('Grade 10 · A')).toBeInTheDocument();
    expect(screen.getByText('Liam')).toBeInTheDocument();
    expect(screen.getByText('Lucas')).toBeInTheDocument();
  });

  it('filters parents by query (parent name, email, or linked child name)', () => {
    renderWithProviders(<ParentsView />);

    const searchInput = screen.getByLabelText('Search parents');

    // Search by parent name
    fireEvent.change(searchInput, { target: { value: 'Robert' } });
    expect(screen.getByText('Robert Bennett')).toBeInTheDocument();
    expect(screen.queryByText('Sandra Carter')).not.toBeInTheDocument();

    // Search by child name
    fireEvent.change(searchInput, { target: { value: 'Lucas' } });
    expect(screen.queryByText('Robert Bennett')).not.toBeInTheDocument();
    expect(screen.getByText('Sandra Carter')).toBeInTheDocument();
  });

  it('shows empty state and allows clearing search when no match', () => {
    renderWithProviders(<ParentsView />);

    const searchInput = screen.getByLabelText('Search parents');
    fireEvent.change(searchInput, { target: { value: 'nonexistent-person' } });

    expect(screen.getByText('No parents found')).toBeInTheDocument();

    const clearBtn = screen.getByRole('button', { name: /clear search/i });
    fireEvent.click(clearBtn);

    expect(screen.getByText('Robert Bennett')).toBeInTheDocument();
  });

  it('opens parent detail profile modal when card is clicked', () => {
    renderWithProviders(<ParentsView />);

    const card = screen.getByText('Robert Bennett');
    fireEvent.click(card);

    expect(screen.getByText('Parent profile')).toBeInTheDocument();
    expect(screen.getByText('Linked Children')).toBeInTheDocument();
    expect(screen.getAllByText('Amelia Bennett').length).toBeGreaterThan(0);
  });

  it('opens invite parent modal when "Invite parent" button is clicked', () => {
    renderWithProviders(<ParentsView />);

    const inviteBtn = screen.getByRole('button', { name: /invite parent/i });
    fireEvent.click(inviteBtn);

    expect(screen.getByTestId('mock-invite-parent-modal')).toBeInTheDocument();
  });

  it('strictly enforces authorization boundary: NO "Message" or chat button exists', () => {
    renderWithProviders(<ParentsView />);

    // In lumio-react there was a "Message" button on each card and a message modal.
    // In lumio-frontend admin directory, direct messaging is strictly omitted.
    expect(screen.queryByRole('button', { name: /message/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Send message')).not.toBeInTheDocument();
  });

  it('renders loading state when query is loading', () => {
    mockUseParents.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    });

    renderWithProviders(<ParentsView />);
    expect(screen.getByText(/loading parent directory/i)).toBeInTheDocument();
  });

  it('renders error state with retry button on failure', () => {
    const mockRefetch = vi.fn();
    mockUseParents.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: new Error('Network error'),
      refetch: mockRefetch,
    });

    renderWithProviders(<ParentsView />);
    expect(screen.getByText('Failed to load parents')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalled();
  });
});
