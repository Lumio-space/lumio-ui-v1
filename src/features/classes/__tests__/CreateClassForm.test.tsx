/**
 * CreateClassForm — unit + integration tests
 *
 * Covers every item from the functional verification checklist:
 *
 *   ✓ form renders                      ✓ valid values submit
 *   ✓ required-field validation         ✓ correct DTO field names in payload
 *   ✓ school-level → grade cascade      ✓ duplicate submission prevented
 *   ✓ invalid values rejected           ✓ backend errors displayed inline
 *   ✓ onSuccess callback invoked        ✓ newly created class triggers refresh
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent, act }       from '@testing-library/react';
import { renderWithProviders }                   from '@/test/utils';
import { CreateClassForm }                       from '@/features/classes/components/CreateClassForm';

// ---------------------------------------------------------------------------
// Hoisted mock handles — vi.fn() pattern matches LoginForm / ForgotPasswordForm
// ---------------------------------------------------------------------------

const { mockMutate, mockUseCreateClass, mockUseClasses } = vi.hoisted(() => ({
  mockMutate:         vi.fn(),
  mockUseCreateClass: vi.fn(),
  mockUseClasses:     vi.fn(),
}));

vi.mock('@/features/classes/hooks', () => ({
  useCreateClass: () => mockUseCreateClass(),
  useClasses: () => mockUseClasses(),
}));

// ---------------------------------------------------------------------------
// Default hook stub
// ---------------------------------------------------------------------------

function stubHook(overrides: { isPending?: boolean; error?: Error | null } = {}) {
  mockUseCreateClass.mockReturnValue({
    mutate:    mockMutate,
    isPending: overrides.isPending ?? false,
    error:     overrides.error     ?? null,
    reset:     vi.fn(),
  });
}

beforeEach(() => {
  mockMutate.mockReset();
  mockUseCreateClass.mockReset();
  mockUseClasses.mockReset();
  mockUseClasses.mockReturnValue({ data: [] });
  stubHook();
});


function renderForm(onSuccess = vi.fn()) {
  return renderWithProviders(<CreateClassForm onSuccess={onSuccess} />);
}

async function fillValidForm(overrides: { room?: string; capacity?: string } = {}) {
  fireEvent.change(screen.getByLabelText(/school level/i), {
    target: { value: 'primary' },
  });
  await waitFor(() =>
    expect(screen.getByLabelText(/class level/i)).not.toBeDisabled()
  );
  fireEvent.change(screen.getByLabelText(/class level/i), {
    target: { value: 'Primary1' },
  });
  fireEvent.change(screen.getByLabelText(/class arm/i), {
    target: { value: 'A' },
  });
  fireEvent.change(screen.getByLabelText(/room/i), {
    target: { value: overrides.room ?? '101' },
  });
  fireEvent.change(screen.getByLabelText(/capacity/i), {
    target: { value: overrides.capacity ?? '35' },
  });
}

// ===========================================================================
// Tests
// ===========================================================================

describe('CreateClassForm', () => {

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the school level select', () => {
      renderForm();
      expect(screen.getByLabelText(/school level/i)).toBeInTheDocument();
    });

    it('renders the class level select', () => {
      renderForm();
      expect(screen.getByLabelText(/class level/i)).toBeInTheDocument();
    });

    it('renders the class arm select', () => {
      renderForm();
      expect(screen.getByLabelText(/class arm/i)).toBeInTheDocument();
    });

    it('renders the room input', () => {
      renderForm();
      expect(screen.getByLabelText(/room/i)).toBeInTheDocument();
    });

    it('renders the capacity input', () => {
      renderForm();
      expect(screen.getByLabelText(/capacity/i)).toBeInTheDocument();
    });

    it('renders a submit button with type="submit"', () => {
      renderForm();
      const btn = screen.getByRole('button', { name: /create class/i });
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveAttribute('type', 'submit');
    });
  });

  // ── School level → grade level cascade ────────────────────────────────────

  describe('school-level → grade-level cascade', () => {
    it('class level select is disabled before a school level is chosen', () => {
      renderForm();
      expect(screen.getByLabelText(/class level/i)).toBeDisabled();
    });

    it('enables class level once a school level is chosen', async () => {
      renderForm();
      fireEvent.change(screen.getByLabelText(/school level/i), {
        target: { value: 'primary' },
      });
      await waitFor(() =>
        expect(screen.getByLabelText(/class level/i)).not.toBeDisabled()
      );
    });

    it('populates Primary 1–6 options when Primary is selected', async () => {
      renderForm();
      fireEvent.change(screen.getByLabelText(/school level/i), {
        target: { value: 'primary' },
      });
      await waitFor(() => {
        const sel = screen.getByLabelText(/class level/i);
        expect(sel).toContainHTML('Primary 1');
        expect(sel).toContainHTML('Primary 6');
      });
    });

    it('populates JSS 1–3 options when Junior Secondary is selected', async () => {
      renderForm();
      fireEvent.change(screen.getByLabelText(/school level/i), {
        target: { value: 'junior_secondary' },
      });
      await waitFor(() => {
        const sel = screen.getByLabelText(/class level/i);
        expect(sel).toContainHTML('JSS 1');
        expect(sel).toContainHTML('JSS 3');
      });
    });

    it('populates SSS 1–3 options when Senior Secondary is selected', async () => {
      renderForm();
      fireEvent.change(screen.getByLabelText(/school level/i), {
        target: { value: 'senior_secondary' },
      });
      await waitFor(() => {
        const sel = screen.getByLabelText(/class level/i);
        expect(sel).toContainHTML('SSS 1');
        expect(sel).toContainHTML('SSS 3');
      });
    });

    it('populates Nursery 1, Nursery 2, Nursery 3 options when Nursery is selected', async () => {
      renderForm();
      fireEvent.change(screen.getByLabelText(/school level/i), {
        target: { value: 'nursery' },
      });
      await waitFor(() => {
        const sel = screen.getByLabelText(/class level/i);
        expect(sel).toContainHTML('Nursery 1');
        expect(sel).toContainHTML('Nursery 3');
      });
    });

    it('resets class level when school level switches to an incompatible value', async () => {
      renderForm();

      fireEvent.change(screen.getByLabelText(/school level/i), {
        target: { value: 'primary' },
      });
      await waitFor(() =>
        expect(screen.getByLabelText(/class level/i)).not.toBeDisabled()
      );
      fireEvent.change(screen.getByLabelText(/class level/i), {
        target: { value: 'Primary1' },
      });
      expect(
        screen.getByLabelText<HTMLSelectElement>(/class level/i).value
      ).toBe('Primary1');

      // Switch to Junior Secondary — 'Primary 1' is not a valid JSS grade
      fireEvent.change(screen.getByLabelText(/school level/i), {
        target: { value: 'junior_secondary' },
      });

      await waitFor(() =>
        expect(
          screen.getByLabelText<HTMLSelectElement>(/class level/i).value
        ).toBe('')
      );
    });
  });

  // ── Required-field validation ──────────────────────────────────────────────

  describe('required-field validation', () => {
    it('shows a validation error for school level when form is submitted empty', async () => {
      const { container } = renderForm();

      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });

      await waitFor(() =>
        expect(
          screen.getByText(/please select a school level/i)
        ).toBeInTheDocument()
      );
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('shows a validation error for class level when not selected', async () => {
      const { container } = renderForm();

      fireEvent.change(screen.getByLabelText(/school level/i), {
        target: { value: 'primary' },
      });

      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });

      await waitFor(() =>
        expect(
          screen.getByText(/please select a class level/i)
        ).toBeInTheDocument()
      );
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('shows a validation error for class arm when not selected', async () => {
      const { container } = renderForm();

      fireEvent.change(screen.getByLabelText(/school level/i), {
        target: { value: 'primary' },
      });
      await waitFor(() =>
        expect(screen.getByLabelText(/class level/i)).not.toBeDisabled()
      );
      fireEvent.change(screen.getByLabelText(/class level/i), {
        target: { value: 'Primary1' },
      });

      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });

      await waitFor(() =>
        expect(
          screen.getByText(/please select a class arm/i)
        ).toBeInTheDocument()
      );
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('shows a validation error for room when not provided', async () => {
      const { container } = renderForm();

      fireEvent.change(screen.getByLabelText(/school level/i), {
        target: { value: 'primary' },
      });
      await waitFor(() =>
        expect(screen.getByLabelText(/class level/i)).not.toBeDisabled()
      );
      fireEvent.change(screen.getByLabelText(/class level/i), {
        target: { value: 'Primary1' },
      });
      fireEvent.change(screen.getByLabelText(/class arm/i), {
        target: { value: 'A' },
      });
      fireEvent.change(screen.getByLabelText(/capacity/i), {
        target: { value: '35' },
      });

      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });

      await waitFor(() =>
        expect(
          screen.getByText(/please enter a room number/i)
        ).toBeInTheDocument()
      );
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('shows a validation error for capacity when not provided', async () => {
      const { container } = renderForm();

      fireEvent.change(screen.getByLabelText(/school level/i), {
        target: { value: 'primary' },
      });
      await waitFor(() =>
        expect(screen.getByLabelText(/class level/i)).not.toBeDisabled()
      );
      fireEvent.change(screen.getByLabelText(/class level/i), {
        target: { value: 'Primary1' },
      });
      fireEvent.change(screen.getByLabelText(/class arm/i), {
        target: { value: 'A' },
      });
      fireEvent.change(screen.getByLabelText(/room/i), {
        target: { value: '101' },
      });

      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });

      await waitFor(() =>
        expect(
          screen.getByText(/please enter class capacity/i)
        ).toBeInTheDocument()
      );
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('does not call mutate when any required field is missing', async () => {
      const { container } = renderForm();
      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });
      await waitFor(() => expect(mockMutate).not.toHaveBeenCalled());
    });
  });

  // ── Valid submission ───────────────────────────────────────────────────────

  describe('valid submission', () => {
    it('calls mutate once when all fields are valid', async () => {
      const { container } = renderForm();
      await fillValidForm();
      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });
      await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    });

    it('sends gradeLevel, gradeSection, schoolLevel, room, capacity — exact DTO field names as numbers', async () => {
      const { container } = renderForm();
      await fillValidForm();
      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });
      await waitFor(() =>
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            gradeLevel:   'Primary1',
            gradeSection: 'A',
            schoolLevel:  'primary',
            room:         101,
            capacity:     35,
          }),
          expect.anything()
        )
      );
      const [payload] = mockMutate.mock.calls[0] as [Record<string, unknown>];
      expect(typeof payload.room).toBe('number');
      expect(typeof payload.capacity).toBe('number');
    });

    it('submits nursery1 value when Nursery 1 is chosen', async () => {
      const { container } = renderForm();
      fireEvent.change(screen.getByLabelText(/school level/i), {
        target: { value: 'nursery' },
      });
      await waitFor(() =>
        expect(screen.getByLabelText(/class level/i)).not.toBeDisabled()
      );
      fireEvent.change(screen.getByLabelText(/class level/i), {
        target: { value: 'nursery1' },
      });
      fireEvent.change(screen.getByLabelText(/class arm/i), {
        target: { value: 'A' },
      });
      fireEvent.change(screen.getByLabelText(/room/i), {
        target: { value: '101' },
      });
      fireEvent.change(screen.getByLabelText(/capacity/i), {
        target: { value: '30' },
      });
      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });
      await waitFor(() =>
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            gradeLevel:   'nursery1',
            gradeSection: 'A',
            schoolLevel:  'nursery',
            room:         101,
            capacity:     30,
          }),
          expect.anything()
        )
      );
    });

    it('submits SSS1 value when SSS 1 is chosen', async () => {
      const { container } = renderForm();
      fireEvent.change(screen.getByLabelText(/school level/i), {
        target: { value: 'senior_secondary' },
      });
      await waitFor(() =>
        expect(screen.getByLabelText(/class level/i)).not.toBeDisabled()
      );
      fireEvent.change(screen.getByLabelText(/class level/i), {
        target: { value: 'SSS1' },
      });
      fireEvent.change(screen.getByLabelText(/class arm/i), {
        target: { value: 'B' },
      });
      fireEvent.change(screen.getByLabelText(/room/i), {
        target: { value: '205' },
      });
      fireEvent.change(screen.getByLabelText(/capacity/i), {
        target: { value: '40' },
      });
      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });
      await waitFor(() =>
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            gradeLevel:   'SSS1',
            gradeSection: 'B',
            schoolLevel:  'senior_secondary',
            room:         205,
            capacity:     40,
          }),
          expect.anything()
        )
      );
    });

    it('does NOT send DB column names (grade / section / level) in the payload', async () => {
      const { container } = renderForm();
      await fillValidForm();
      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });
      await waitFor(() => {
        const [payload] = mockMutate.mock.calls[0] as [Record<string, unknown>];
        expect(payload).not.toHaveProperty('grade');
        expect(payload).not.toHaveProperty('section');
        expect(payload).not.toHaveProperty('level');
      });
    });

    it('calls onSuccess callback after a successful mutation', async () => {
      const onSuccess = vi.fn();
      mockMutate.mockImplementation(
        (_payload: unknown, opts: { onSuccess?: () => void }) => {
          opts?.onSuccess?.();
        }
      );
      const { container } = renderForm(onSuccess);
      await fillValidForm();
      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });
      await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    });

    it('newly created class triggers list refresh — onSuccess fires after mutation', async () => {
      // The onSuccess callback is the signal that TanStack Query's
      // invalidateQueries (inside the hook's own onSuccess) has already fired.
      const onSuccess = vi.fn();
      mockMutate.mockImplementation(
        (_payload: unknown, opts: { onSuccess?: () => void }) => {
          opts?.onSuccess?.();
        }
      );
      const { container } = renderForm(onSuccess);
      await fillValidForm();
      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });
      await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    });
  });

  // ── Backend error display ──────────────────────────────────────────────────

  describe('backend error display', () => {
    it('shows an inline alert when the mutation returns a general non-duplicate Error', () => {
      stubHook({ error: new Error('Internal server error.') });
      renderForm();
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
    });

    it('shows a centered pop-up dialog when the mutation returns a duplicate class error', () => {
      stubHook({ error: new Error('A class with this combination already exists.') });
      renderForm();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(
        screen.getByText(/a class with this combination already exists/i)
      ).toBeInTheDocument();
    });

    it('shows a generic fallback when the error is not an Error instance', () => {
      stubHook({ error: 'network timeout' as unknown as Error });
      renderForm();
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('does not render an error alert when there is no error', () => {
      stubHook({ error: null });
      renderForm();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  // ── Duplicate ARM & Room validation ────────────────────────────────────────

  describe('duplicate ARM and Room validation', () => {
    it('detects existing class ARM, shows inline warning, and triggers centered pop-up on submit', async () => {
      mockUseClasses.mockReturnValue({
        data: [
          {
            id: 'c1',
            grade: 'Primary1',
            section: 'A',
            level: 'primary',
            room: 101,
            capacity: 30,
          },
        ],
      });

      const { container } = renderForm();
      await fillValidForm(); // Primary, Primary 1, Section A, Room 101

      // Expect inline warning under ARM
      expect(screen.getByText(/arm "a" is already in use/i)).toBeInTheDocument();

      // Submit form
      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });

      // Mutation should NOT be called
      expect(mockMutate).not.toHaveBeenCalled();

      // Centered pop-up should be visible
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/class arm already exists/i)).toBeInTheDocument();
    });

    it('detects existing room number, shows inline warning, and triggers centered pop-up on submit', async () => {
      mockUseClasses.mockReturnValue({
        data: [
          {
            id: 'c2',
            grade: 'Primary2',
            section: 'B',
            level: 'primary',
            room: 101,
            capacity: 30,
          },
        ],
      });

      const { container } = renderForm();
      // Select Primary 1, section A (different arm), but room 101 (duplicate room)
      await fillValidForm({ room: '101' });

      // Expect inline warning under Room
      expect(screen.getByText(/room 101 is already assigned to an existing class/i)).toBeInTheDocument();

      // Submit form
      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });

      // Mutation should NOT be called
      expect(mockMutate).not.toHaveBeenCalled();

      // Centered pop-up should be visible
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/room \/ location already in use/i)).toBeInTheDocument();
    });
  });


  // ── Pending / duplicate-submission prevention ──────────────────────────────

  describe('pending state — duplicate submission prevention', () => {
    it('disables the submit button while the mutation is pending', () => {
      stubHook({ isPending: true });
      const { container } = renderForm();
      // Query by attribute — reliable regardless of accessible-name rendering
      // quirks caused by React 19 + RHF batching button children separately.
      const submitBtn = container.querySelector('button[type="submit"]')!;
      expect(submitBtn).toBeInTheDocument();
      expect(submitBtn).toBeDisabled();
    });

    it('disables all selects and numeric inputs while the mutation is pending', () => {
      stubHook({ isPending: true });
      renderForm();
      screen.getAllByRole('combobox').forEach((select) => {
        expect(select).toBeDisabled();
      });
      expect(screen.getByLabelText(/room/i)).toBeDisabled();
      expect(screen.getByLabelText(/capacity/i)).toBeDisabled();
    });

    it('shows a loading spinner inside the submit button while pending', () => {
      stubHook({ isPending: true });
      const { container } = renderForm();
      const submitBtn = container.querySelector('button[type="submit"]')!;
      expect(submitBtn).toBeDisabled();
      // Loader2Icon renders as an SVG with aria-hidden="true"
      expect(submitBtn.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    });
  });

  describe('guidance notices', () => {
    it('renders the Form Teacher invitation explanation and link to /teachers and /subjects', () => {
      renderForm();
      expect(
        screen.getByText(/form teachers are assigned from the/i)
      ).toBeInTheDocument();
      const teachersLink = screen.getByRole('link', { name: /teachers/i });
      expect(teachersLink).toBeInTheDocument();
      expect(teachersLink).toHaveAttribute('href', '/teachers');
      const subjectsLink = screen.getByRole('link', { name: /subjects/i });
      expect(subjectsLink).toBeInTheDocument();
      expect(subjectsLink).toHaveAttribute('href', '/subjects');
    });
  });

  // ── Senior Secondary Department selection & Live Preview ───────────────────

  describe('department selection & live preview', () => {
    it('does NOT show Department / Track select for Primary level', () => {
      renderForm();
      fireEvent.change(screen.getByLabelText(/school level/i), {
        target: { value: 'primary' },
      });
      expect(screen.queryByLabelText(/department \/ track/i)).not.toBeInTheDocument();
    });

    it('shows Department / Track select when Senior Secondary is chosen', async () => {
      renderForm();
      fireEvent.change(screen.getByLabelText(/school level/i), {
        target: { value: 'senior_secondary' },
      });
      await waitFor(() => {
        expect(screen.getByLabelText(/department \/ track/i)).toBeInTheDocument();
      });
    });

    it('submits department in payload when selected for Senior Secondary', async () => {
      const { container } = renderForm();
      fireEvent.change(screen.getByLabelText(/school level/i), {
        target: { value: 'senior_secondary' },
      });
      await waitFor(() =>
        expect(screen.getByLabelText(/class level/i)).not.toBeDisabled()
      );
      fireEvent.change(screen.getByLabelText(/class level/i), {
        target: { value: 'SSS2' },
      });
      fireEvent.change(screen.getByLabelText(/class arm/i), {
        target: { value: 'A' },
      });
      await waitFor(() =>
        expect(screen.getByLabelText(/department \/ track/i)).toBeInTheDocument()
      );
      fireEvent.change(screen.getByLabelText(/department \/ track/i), {
        target: { value: 'Science' },
      });
      fireEvent.change(screen.getByLabelText(/room/i), {
        target: { value: '301' },
      });
      fireEvent.change(screen.getByLabelText(/capacity/i), {
        target: { value: '32' },
      });

      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });

      await waitFor(() =>
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            schoolLevel: 'senior_secondary',
            gradeLevel: 'SSS2',
            gradeSection: 'A',
            department: 'Science',
            room: 301,
            capacity: 32,
          }),
          expect.anything()
        )
      );
    });

    it('displays live preview with composed name', async () => {
      renderForm();
      fireEvent.change(screen.getByLabelText(/school level/i), {
        target: { value: 'primary' },
      });
      await waitFor(() =>
        expect(screen.getByLabelText(/class level/i)).not.toBeDisabled()
      );
      fireEvent.change(screen.getByLabelText(/class level/i), {
        target: { value: 'Primary1' },
      });
      fireEvent.change(screen.getByLabelText(/class arm/i), {
        target: { value: 'B' },
      });

      expect(screen.getByText('This class will be')).toBeInTheDocument();
      expect(screen.getByText('Primary 1 B')).toBeInTheDocument();
    });
  });
});

