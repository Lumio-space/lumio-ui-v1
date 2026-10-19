/**
 * EditClassModal — unit tests
 *
 * Verifies:
 * - Prepopulation with existing class details
 * - Senior Secondary department behavior
 * - Submission of valid edits
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { EditClassModal } from '../components/EditClassModal';
import type { ClassRecord } from '../types';

const { mockMutate, mockUseUpdateClass, mockUseClasses } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
  mockUseUpdateClass: vi.fn(),
  mockUseClasses: vi.fn(),
}));

vi.mock('../hooks', () => ({
  useUpdateClass: () => mockUseUpdateClass(),
  useClasses: () => mockUseClasses(),
}));

const MOCK_CLASS: ClassRecord = {
  id: 'cls-sss1-a',
  schoolId: 'school-1',
  grade: 'SSS1',
  section: 'A',
  level: 'senior_secondary',
  department: 'Science',
  capacity: 35,
  room: 204,
  createdAt: '2026-01-01',
};

describe('EditClassModal', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockUseUpdateClass.mockReset();
    mockUseClasses.mockReset();

    mockUseUpdateClass.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
      reset: vi.fn(),
    });

    mockUseClasses.mockReturnValue({
      data: [MOCK_CLASS],
      isLoading: false,
    });
  });

  it('prepopulates inputs with the selected class data', () => {
    renderWithProviders(
      <EditClassModal
        open={true}
        classRecord={MOCK_CLASS}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: /edit class/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Senior Secondary')).toBeInTheDocument();
    expect(screen.getByDisplayValue('SSS 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Arm A')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Science')).toBeInTheDocument();
    expect(screen.getByDisplayValue('204')).toBeInTheDocument();
    expect(screen.getByDisplayValue('35')).toBeInTheDocument();
  });

  it('submits valid updates through useUpdateClass', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    renderWithProviders(
      <EditClassModal
        open={true}
        classRecord={MOCK_CLASS}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const roomInput = screen.getByLabelText(/room number/i);
    fireEvent.change(roomInput, { target: { value: '205' } });

    const submitBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        {
          id: 'cls-sss1-a',
          payload: expect.objectContaining({
            room: 205,
            gradeLevel: 'SSS1',
            gradeSection: 'A',
            schoolLevel: 'senior_secondary',
            department: 'Science',
            capacity: 35,
          }),
        },
        expect.anything()
      );
    });
  });
});
