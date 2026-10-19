/**
 * EditSubjectModal — unit + integration tests
 *
 * Verifies:
 * - Prepopulation of form with existing subject details
 * - Senior Secondary department and type configuration
 * - Submitting updates through useUpdateSubject
 * - Preserving untouched fields
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { EditSubjectModal } from '../components/EditSubjectModal';
import type { SubjectRecord } from '../types';

const { mockMutate, mockUseUpdateSubject } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
  mockUseUpdateSubject: vi.fn(),
}));

vi.mock('../hooks', () => ({
  useUpdateSubject: () => mockUseUpdateSubject(),
}));

function stubHook(overrides: { isPending?: boolean; error?: Error | null } = {}) {
  mockUseUpdateSubject.mockReturnValue({
    mutate: mockMutate,
    isPending: overrides.isPending ?? false,
    error: overrides.error ?? null,
    reset: vi.fn(),
  });
}

const MOCK_SENIOR_SUBJECT: SubjectRecord = {
  id: 'sub-s-1',
  name: 'Physics',
  code: 'PHY',
  section: 'Senior Secondary',
  department: 'Science',
  type: 'Compulsory',
  status: 'Active',
  createdOn: '2026-01-01',
};

const MOCK_PRIMARY_SUBJECT: SubjectRecord = {
  id: 'sub-p-1',
  name: 'English Language',
  code: 'ENG',
  section: 'Primary',
  status: 'Active',
  createdOn: '2026-01-01',
};

describe('EditSubjectModal', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockUseUpdateSubject.mockReset();
    stubHook();
  });

  it('prepopulates fields with existing subject data', () => {
    renderWithProviders(
      <EditSubjectModal
        open={true}
        subject={MOCK_SENIOR_SUBJECT}
        onClose={vi.fn()}
        onUpdated={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: /edit subject/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Physics')).toBeInTheDocument();
    expect(screen.getByDisplayValue('PHY')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Senior Secondary')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Science')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Compulsory')).toBeInTheDocument();
  });

  it('hides department and subject type for Primary section', () => {
    renderWithProviders(
      <EditSubjectModal
        open={true}
        subject={MOCK_PRIMARY_SUBJECT}
        onClose={vi.fn()}
        onUpdated={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue('English Language')).toBeInTheDocument();
    expect(screen.queryByLabelText(/department \/ track/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/subject type/i)).not.toBeInTheDocument();
  });

  it('submits updated values through useUpdateSubject', async () => {
    const onUpdated = vi.fn();
    const onClose = vi.fn();

    renderWithProviders(
      <EditSubjectModal
        open={true}
        subject={MOCK_SENIOR_SUBJECT}
        onClose={onClose}
        onUpdated={onUpdated}
      />
    );

    const nameInput = screen.getByLabelText(/subject name/i);
    fireEvent.change(nameInput, { target: { value: 'Advanced Physics' } });

    const submitBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        {
          id: 'sub-s-1',
          payload: {
            name: 'Advanced Physics',
            code: 'PHY',
            section: 'Senior Secondary',
            department: 'Science',
            type: 'Compulsory',
            status: 'Active',
          },
        },
        expect.anything()
      );
    });
  });
});
