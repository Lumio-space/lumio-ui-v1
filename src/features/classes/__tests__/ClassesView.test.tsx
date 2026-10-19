/**
 * ClassesView — integration tests
 *
 * Tests the main class-management view: list rendering, all four UI states
 * (loading / empty / error / populated), and modal open/close wiring.
 *
 * Strategy: mock the hooks layer so the tests never hit the network.
 * vi.hoisted ensures mock handles are available inside vi.mock factories.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent, act, within } from '@testing-library/react';
import { renderWithProviders, userEvent }         from '@/test/utils';
import { ClassesView }                           from '@/features/classes/components/ClassesView';

// ---------------------------------------------------------------------------
// Hoisted mock handles
// ---------------------------------------------------------------------------

const { mockRefetch, mockMutate, mockDeleteMutate, mockUseClasses } = vi.hoisted(() => ({
  mockRefetch:       vi.fn(),
  mockMutate:        vi.fn(),
  mockDeleteMutate:  vi.fn(),
  mockUseClasses:    vi.fn(),
}));

// ---------------------------------------------------------------------------
// Module mock — intercepts useClasses, useCreateClass, and useDeleteClass
// ---------------------------------------------------------------------------

vi.mock('@/features/classes/hooks', () => ({
  useClasses: () => mockUseClasses(),
  useCreateClass: () => ({
    mutate:    mockMutate,
    isPending: false,
    error:     null,
    reset:     vi.fn(),
  }),
  useUpdateClass: () => ({
    mutate:    vi.fn(),
    isPending: false,
    error:     null,
    reset:     vi.fn(),
  }),
  useDeleteClass: () => ({
    mutate:    mockDeleteMutate,
    isPending: false,
    error:     null,
    reset:     vi.fn(),
  }),
}));

vi.mock('../hooks', () => ({
  useClasses: () => mockUseClasses(),
  useCreateClass: () => ({
    mutate:    mockMutate,
    isPending: false,
    error:     null,
    reset:     vi.fn(),
  }),
  useUpdateClass: () => ({
    mutate:    vi.fn(),
    isPending: false,
    error:     null,
    reset:     vi.fn(),
  }),
  useDeleteClass: () => ({
    mutate:    mockDeleteMutate,
    isPending: false,
    error:     null,
    reset:     vi.fn(),
  }),
}));



vi.mock('@/features/subjects/hooks', () => ({
  useSubjects: () => ({
    data: [],
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('@/features/teachers/hooks', () => ({
  useTeachers: () => ({
    data: [],
    isLoading: false,
    isError: false,
  }),
}));


// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const MOCK_CLASSES = [
  {
    id:        'cls-1',
    schoolId:  'school-1',
    grade:     'Primary 1',
    section:   'A',
    level:     'primary',
    capacity:  35,
    room:      101,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id:        'cls-2',
    schoolId:  'school-1',
    grade:     'JSS 2',
    section:   'B',
    level:     'junior_secondary',
    capacity:  30,
    room:      205,
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stubClasses(overrides: Partial<ReturnType<typeof mockUseClasses>> = {}) {
  mockUseClasses.mockReturnValue({
    data:      MOCK_CLASSES,
    isLoading: false,
    isError:   false,
    error:     null,
    refetch:   mockRefetch,
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ClassesView', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
    mockRefetch.mockReset();
    mockMutate.mockReset();
    mockDeleteMutate.mockReset();
    mockUseClasses.mockReset();
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('does not render class cards while data is loading', () => {
      mockUseClasses.mockReturnValue({
        data: undefined, isLoading: true, isError: false, error: null, refetch: mockRefetch,
      });

      renderWithProviders(<ClassesView />);

      // No class card content visible during load
      expect(screen.queryByText('Primary 1 A')).not.toBeInTheDocument();
    });

    it('does not show error or empty state while loading', () => {
      mockUseClasses.mockReturnValue({
        data: undefined, isLoading: true, isError: false, error: null, refetch: mockRefetch,
      });

      renderWithProviders(<ClassesView />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByText(/no classes yet/i)).not.toBeInTheDocument();
    });
  });

  // ── Error state ────────────────────────────────────────────────────────────

  describe('error state', () => {
    it('shows error message when fetching classes fails', () => {
      mockUseClasses.mockReturnValue({
        data: undefined, isLoading: false, isError: true,
        error: new Error('Network request failed'),
        refetch: mockRefetch,
      });

      renderWithProviders(<ClassesView />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/network request failed/i)).toBeInTheDocument();
    });

    it('shows "Failed to load classes" for non-Error error objects', () => {
      mockUseClasses.mockReturnValue({
        data: undefined, isLoading: false, isError: true,
        error: 'unexpected',
        refetch: mockRefetch,
      });

      renderWithProviders(<ClassesView />);

      expect(screen.getByText(/failed to load classes/i)).toBeInTheDocument();
    });

    it('calls refetch when the retry button is clicked', async () => {
      mockUseClasses.mockReturnValue({
        data: undefined, isLoading: false, isError: true,
        error: new Error('Timeout'),
        refetch: mockRefetch,
      });

      const user = userEvent.setup();
      renderWithProviders(<ClassesView />);

      await user.click(screen.getByRole('button', { name: /try again/i }));

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('does not show class cards when there is an error', () => {
      mockUseClasses.mockReturnValue({
        data: undefined, isLoading: false, isError: true,
        error: new Error('Error'),
        refetch: mockRefetch,
      });

      renderWithProviders(<ClassesView />);

      expect(screen.queryByText('Primary 1 A')).not.toBeInTheDocument();
    });
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  describe('empty state', () => {
    it('shows empty state heading when no classes exist', () => {
      mockUseClasses.mockReturnValue({
        data: [], isLoading: false, isError: false, error: null, refetch: mockRefetch,
      });

      renderWithProviders(<ClassesView />);

      expect(screen.getByText(/no classes yet/i)).toBeInTheDocument();
    });

    it('shows an explanatory description in the empty state', () => {
      mockUseClasses.mockReturnValue({
        data: [], isLoading: false, isError: false, error: null, refetch: mockRefetch,
      });

      renderWithProviders(<ClassesView />);

      expect(screen.getByText(/get started by creating your first class/i)).toBeInTheDocument();
    });

    it('shows a "Create first class" call-to-action in the empty state', () => {
      mockUseClasses.mockReturnValue({
        data: [], isLoading: false, isError: false, error: null, refetch: mockRefetch,
      });

      renderWithProviders(<ClassesView />);

      expect(
        screen.getByRole('button', { name: /create first class/i })
      ).toBeInTheDocument();
    });
  });

  // ── Populated state — class list ───────────────────────────────────────────

  describe('class list', () => {
    it('renders a card for each class returned by the API', () => {
      stubClasses();
      renderWithProviders(<ClassesView />);

      // Primary 1 A card
      expect(screen.getByText('Primary 1 A')).toBeInTheDocument();
      // JSS 2 B card
      expect(screen.getByText('JSS 2 B')).toBeInTheDocument();
    });

    it('formats backend grade keys (e.g. nursery1) into friendly labels (Nursery 1 A)', () => {
      mockUseClasses.mockReturnValue({
        data: [
          {
            id:        'cls-nursery',
            schoolId:  'school-1',
            grade:     'nursery1',
            section:   'A',
            level:     'nursery',
            capacity:  25,
            room:      102,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        isLoading: false,
        isError:   false,
        error:     null,
        refetch:   mockRefetch,
      });
      renderWithProviders(<ClassesView />);
      expect(screen.getByText('Nursery 1 A')).toBeInTheDocument();
    });

    it('displays the school level label on each card', () => {
      stubClasses();
      renderWithProviders(<ClassesView />);

      // SCHOOL_LEVEL_LABELS maps 'primary' → 'Primary'
      expect(screen.getAllByText('Primary').length).toBeGreaterThan(0);
    });

    it('does not show the empty state when classes are present', () => {
      stubClasses();
      renderWithProviders(<ClassesView />);

      expect(screen.queryByText(/no classes yet/i)).not.toBeInTheDocument();
    });

    it('does not show an error banner when classes load successfully', () => {
      stubClasses();
      renderWithProviders(<ClassesView />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  // ── Page header ────────────────────────────────────────────────────────────

  describe('page header', () => {
    it('renders the page title "Classes"', () => {
      stubClasses();
      renderWithProviders(<ClassesView />);

      expect(screen.getByRole('heading', { name: /classes/i })).toBeInTheDocument();
    });

    it('renders a "Create class" action button in the header', () => {
      stubClasses();
      renderWithProviders(<ClassesView />);

      // The header button — name matches /create class/i (the icon label is sr-only)
      const buttons = screen.getAllByRole('button', { name: /create class/i });
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Modal wiring ───────────────────────────────────────────────────────────

  describe('create class modal', () => {
    it('opens the modal dialog when the header "Create class" button is clicked', async () => {
      stubClasses();
      const user = userEvent.setup();
      renderWithProviders(<ClassesView />);

      // Click the header-level "Create class" button (first match)
      await user.click(
        screen.getAllByRole('button', { name: /create class/i })[0]
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('shows the modal title "Create new class"', async () => {
      stubClasses();
      const user = userEvent.setup();
      renderWithProviders(<ClassesView />);

      await user.click(
        screen.getAllByRole('button', { name: /create class/i })[0]
      );

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /create new class/i })
        ).toBeInTheDocument();
      });
    });

    it('opens the modal when the empty-state CTA is clicked', async () => {
      mockUseClasses.mockReturnValue({
        data: [], isLoading: false, isError: false, error: null, refetch: mockRefetch,
      });

      const user = userEvent.setup();
      renderWithProviders(<ClassesView />);

      await user.click(screen.getByRole('button', { name: /create first class/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('closes the modal after a successful class creation', async () => {
      stubClasses();

      // Simulate mutation calling onSuccess synchronously
      mockMutate.mockImplementation((_payload, opts: { onSuccess?: () => void }) => {
        opts?.onSuccess?.();
      });

      const user = userEvent.setup();
      const { container } = renderWithProviders(<ClassesView />);

      // Open modal
      await user.click(
        screen.getAllByRole('button', { name: /create class/i })[0]
      );
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      const dialog = screen.getByRole('dialog');

      // Fill the form inside the dialog
      const schoolLevelSelect = within(dialog).getByLabelText(/school level/i);
      const classSectionSelect = within(dialog).getByLabelText(/class arm/i);

      fireEvent.change(schoolLevelSelect, { target: { value: 'primary' } });

      await waitFor(() => {
        expect(within(dialog).getByLabelText(/class level/i)).not.toBeDisabled();
      });

      fireEvent.change(within(dialog).getByLabelText(/class level/i), { target: { value: 'Primary2' } });
      fireEvent.change(classSectionSelect, { target: { value: 'B' } });
      fireEvent.change(within(dialog).getByLabelText(/room/i), { target: { value: '301' } });
      fireEvent.change(within(dialog).getByLabelText(/capacity/i), { target: { value: '35' } });

      // Submit
      await act(async () => {
        fireEvent.submit(dialog.querySelector('form')!);
      });

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  // ── Class detail modal ─────────────────────────────────────────────────────

  describe('class detail modal', () => {
    it('opens the detail modal when "View class" button is clicked', async () => {
      stubClasses();
      renderWithProviders(<ClassesView />);

      // Click the first "View class" button
      const viewButtons = screen.getAllByRole('button', { name: /view class/i });
      expect(viewButtons.length).toBeGreaterThanOrEqual(1);
      fireEvent.click(viewButtons[0]);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(within(dialog).getByText(/room 101/i)).toBeInTheDocument();
        expect(within(dialog).getByText('Seats left')).toBeInTheDocument();
      });
    });

    it('closes the detail modal when the close button is clicked', async () => {
      stubClasses();
      renderWithProviders(<ClassesView />);

      const viewButtons = screen.getAllByRole('button', { name: /view class/i });
      fireEvent.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      fireEvent.click(closeButtons[0]);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  // ── Class deletion flow ─────────────────────────────────────────────────────

  describe('class deletion modal', () => {
    it('opens delete confirmation modal when Delete is selected from card menu', async () => {
      stubClasses();
      renderWithProviders(<ClassesView />);

      const actionButtons = screen.getAllByRole('button', { name: /class actions/i });
      fireEvent.click(actionButtons[0]);

      const deleteOption = await screen.findByRole('menuitem', { name: /delete/i });
      fireEvent.click(deleteOption);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /delete class/i })).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();
      });
    });

    it('triggers delete mutation when confirmed in delete modal', async () => {
      stubClasses();
      renderWithProviders(<ClassesView />);

      const actionButtons = screen.getAllByRole('button', { name: /class actions/i });
      fireEvent.click(actionButtons[0]);

      const deleteOption = await screen.findByRole('menuitem', { name: /delete/i });
      fireEvent.click(deleteOption);

      const confirmButton = await screen.findByRole('button', { name: /delete class/i });
      fireEvent.click(confirmButton);

      expect(mockDeleteMutate).toHaveBeenCalledWith(
        'cls-1',
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });
  });

  describe('class editing modal', () => {
    it('opens EditClassModal when Edit is selected from card menu', async () => {
      stubClasses();
      renderWithProviders(<ClassesView />);

      const actionButtons = screen.getAllByRole('button', { name: /class actions/i });
      fireEvent.click(actionButtons[0]);

      const editOption = await screen.findByRole('menuitem', { name: /^edit$/i });
      fireEvent.click(editOption);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /edit class/i })).toBeInTheDocument();
      });
    });
  });
});

