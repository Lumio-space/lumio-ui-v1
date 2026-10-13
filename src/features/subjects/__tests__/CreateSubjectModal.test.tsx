/**
 * CreateSubjectModal — unit + integration tests
 *
 * Verifies rendering, validation, context-aware department selection,
 * successful creation, pending states, and CRITICAL: confirms Description
 * is completely removed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent, act } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { CreateSubjectModal } from '../components/CreateSubjectModal';

const { mockMutate, mockUseCreateSubject } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
  mockUseCreateSubject: vi.fn(),
}));

vi.mock('../hooks', () => ({
  useCreateSubject: () => mockUseCreateSubject(),
}));

function stubHook(overrides: { isPending?: boolean; error?: Error | null } = {}) {
  mockUseCreateSubject.mockReturnValue({
    mutate: mockMutate,
    isPending: overrides.isPending ?? false,
    error: overrides.error ?? null,
    reset: vi.fn(),
  });
}

beforeEach(() => {
  mockMutate.mockReset();
  mockUseCreateSubject.mockReset();
  stubHook();
});

function renderModal(props: { open?: boolean; onClose?: () => void; onCreated?: () => void } = {}) {
  return renderWithProviders(
    <CreateSubjectModal
      open={props.open ?? true}
      onClose={props.onClose ?? vi.fn()}
      onCreated={props.onCreated ?? vi.fn()}
    />
  );
}

describe('CreateSubjectModal', () => {
  describe('rendering', () => {
    it('renders the modal title and inputs', () => {
      renderModal();

      expect(screen.getByRole('heading', { name: /create subject/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/subject name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/subject code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/school section/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create subject/i })).toBeInTheDocument();
    });

    it('CRITICAL: does NOT render any Description field or textarea', () => {
      renderModal();

      expect(screen.queryByLabelText(/description/i)).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/what this subject covers/i)).not.toBeInTheDocument();
      expect(document.querySelector('textarea')).toBeNull();
    });
  });

  describe('context-aware Senior Secondary configuration', () => {
    it('does NOT show Department / Track or Subject type when Primary is selected', () => {
      renderModal();

      fireEvent.change(screen.getByLabelText(/school section/i), {
        target: { value: 'Primary' },
      });

      expect(screen.queryByLabelText(/department \/ track/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/subject type/i)).not.toBeInTheDocument();
    });

    it('shows Department / Track and Subject type when Senior Secondary is selected', async () => {
      renderModal();

      fireEvent.change(screen.getByLabelText(/school section/i), {
        target: { value: 'Senior Secondary' },
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/department \/ track/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/subject type/i)).toBeInTheDocument();
        expect(screen.getByText(/senior secondary configuration/i)).toBeInTheDocument();
      });
    });
  });

  describe('validation', () => {
    it('shows error messages when submitted empty', async () => {
      const { container } = renderModal();

      await act(async () => {
        fireEvent.submit(document.querySelector('form')!);
      });

      await waitFor(() => {
        expect(screen.getByText(/subject name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/subject code is required/i)).toBeInTheDocument();
        expect(screen.getByText(/select a school section/i)).toBeInTheDocument();
      });
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('requires department and type when Senior Secondary is chosen', async () => {
      const { container } = renderModal();

      fireEvent.change(screen.getByLabelText(/subject name/i), {
        target: { value: 'Physics' },
      });
      fireEvent.change(screen.getByLabelText(/subject code/i), {
        target: { value: 'PHY' },
      });
      fireEvent.change(screen.getByLabelText(/school section/i), {
        target: { value: 'Senior Secondary' },
      });

      await act(async () => {
        fireEvent.submit(document.querySelector('form')!);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/select a department or track for senior secondary/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/select compulsory or elective for senior secondary/i)
        ).toBeInTheDocument();
      });
      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  describe('submission', () => {
    it('submits valid primary subject payload WITHOUT description', async () => {
      const { container } = renderModal();

      fireEvent.change(screen.getByLabelText(/subject name/i), {
        target: { value: 'Mathematics' },
      });
      fireEvent.change(screen.getByLabelText(/subject code/i), {
        target: { value: 'MTH' },
      });
      fireEvent.change(screen.getByLabelText(/school section/i), {
        target: { value: 'Primary' },
      });

      await act(async () => {
        fireEvent.submit(document.querySelector('form')!);
      });

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledTimes(1);
        const [payload] = mockMutate.mock.calls[0] as [Record<string, unknown>];
        expect(payload).toEqual(
          expect.objectContaining({
            name: 'Mathematics',
            code: 'MTH',
            section: 'Primary',
            status: 'Active',
          })
        );
        expect(payload).not.toHaveProperty('description');
      });
    });

    it('submits valid Senior Secondary payload with department and type', async () => {
      const { container } = renderModal();

      fireEvent.change(screen.getByLabelText(/subject name/i), {
        target: { value: 'Biology' },
      });
      fireEvent.change(screen.getByLabelText(/subject code/i), {
        target: { value: 'bio' },
      });
      fireEvent.change(screen.getByLabelText(/school section/i), {
        target: { value: 'Senior Secondary' },
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/department \/ track/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/department \/ track/i), {
        target: { value: 'Science' },
      });
      fireEvent.change(screen.getByLabelText(/subject type/i), {
        target: { value: 'Elective' },
      });

      await act(async () => {
        fireEvent.submit(document.querySelector('form')!);
      });

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Biology',
            code: 'BIO',
            section: 'Senior Secondary',
            department: 'Science',
            type: 'Elective',
            status: 'Active',
          }),
          expect.anything()
        );
      });
    });

    it('invokes onCreated callback on successful mutation', async () => {
      const onCreated = vi.fn();
      mockMutate.mockImplementation(
        (_payload: unknown, opts: { onSuccess?: (data: unknown) => void }) => {
          opts?.onSuccess?.({ id: 'sub-1', name: 'Mathematics' });
        }
      );

      const { container } = renderModal({ onCreated });

      fireEvent.change(screen.getByLabelText(/subject name/i), {
        target: { value: 'Mathematics' },
      });
      fireEvent.change(screen.getByLabelText(/subject code/i), {
        target: { value: 'MTH' },
      });
      fireEvent.change(screen.getByLabelText(/school section/i), {
        target: { value: 'Primary' },
      });

      await act(async () => {
        fireEvent.submit(document.querySelector('form')!);
      });

      await waitFor(() => {
        expect(onCreated).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'sub-1', name: 'Mathematics' })
        );
      });
    });
  });

  describe('pending state', () => {
    it('disables submit button and inputs while mutation is pending', () => {
      stubHook({ isPending: true });
      renderModal();

      expect(screen.getByRole('button', { name: /create subject/i })).toBeDisabled();
      expect(screen.getByLabelText(/subject name/i)).toBeDisabled();
      expect(screen.getByLabelText(/subject code/i)).toBeDisabled();
      expect(screen.getByLabelText(/school section/i)).toBeDisabled();
    });
  });
});
