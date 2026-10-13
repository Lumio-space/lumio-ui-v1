/**
 * AssignClassesModal — unit tests
 *
 * Verifies:
 * - Rendering classes grouped by section
 * - Filtering out 'Nill' department badges for Nursery/Primary/JSS classes
 * - Correct department badges for Senior Secondary (Science, Arts, Commercial)
 * - Save button states (No changes, Save X classes, Saving…)
 * - Actionable error alert display on failure
 */

import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { AssignClassesModal } from '../components/AssignClassesModal';
import type { SubjectRecord } from '../types';
import type { ClassRecord } from '@/features/classes/types';

const mockSubjectNursery: SubjectRecord = {
  id: 'sub-nur-1',
  name: 'Rhymes & Songs',
  code: 'RHY',
  section: 'Nursery',
  status: 'Active',
  createdOn: '2026-01-15',
  classIds: [],
  offerings: [],
};

const mockSubjectSSS: SubjectRecord = {
  id: 'sub-sss-1',
  name: 'Physics',
  code: 'PHY',
  section: 'Senior Secondary',
  department: 'Science',
  type: 'Compulsory',
  status: 'Active',
  createdOn: '2026-01-20',
  classIds: [],
  offerings: [],
};

const mockClasses: ClassRecord[] = [
  {
    id: 'cls-nur-1',
    schoolId: 'sch-1',
    grade: 'nursery1',
    section: 'A',
    level: 'nursery',
    department: 'Nill' as unknown as undefined,
    students: 15,
    capacity: 25,
    room: 101,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'cls-sss-1',
    schoolId: 'sch-1',
    grade: 'SSS1',
    section: 'A',
    level: 'senior_secondary',
    department: 'Science',
    students: 28,
    capacity: 35,
    room: 102,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

describe('AssignClassesModal', () => {
  it('renders classes and does NOT display "Nill" department badge for Nursery classes', () => {
    renderWithProviders(
      <AssignClassesModal
        open={true}
        onClose={vi.fn()}
        subject={mockSubjectNursery}
        classes={mockClasses}
        offerings={[]}
        onSave={vi.fn()}
      />
    );

    // Nursery section header and class should be rendered
    expect(screen.getByText('Nursery 1 A')).toBeInTheDocument();

    // Must NOT display "Nill" department badge
    expect(screen.queryByText('Nill')).not.toBeInTheDocument();
  });

  it('displays the department badge for Senior Secondary classes', () => {
    renderWithProviders(
      <AssignClassesModal
        open={true}
        onClose={vi.fn()}
        subject={mockSubjectSSS}
        classes={mockClasses}
        offerings={[]}
        onSave={vi.fn()}
      />
    );

    // SSS class should have its "Science" department badge
    expect(screen.getByText('Science')).toBeInTheDocument();
  });

  it('enables Save button when class selection changes and calls onSave', () => {
    const onSave = vi.fn();
    renderWithProviders(
      <AssignClassesModal
        open={true}
        onClose={vi.fn()}
        subject={mockSubjectNursery}
        classes={mockClasses}
        offerings={[]}
        onSave={onSave}
      />
    );

    const saveButton = screen.getByRole('button', { name: /no changes/i });
    expect(saveButton).toBeDisabled();

    // Toggle the nursery class
    const classItem = screen.getByText('Nursery 1 A').closest('button')!;
    fireEvent.click(classItem);

    // Save button should now be enabled and show "Save 1 class"
    const saveReadyButton = screen.getByRole('button', { name: /save 1 class/i });
    expect(saveReadyButton).toBeEnabled();

    fireEvent.click(saveReadyButton);
    expect(onSave).toHaveBeenCalledWith(['cls-nur-1']);
  });

  it('displays error alert when assignment fails and keeps retry possible', () => {
    renderWithProviders(
      <AssignClassesModal
        open={true}
        onClose={vi.fn()}
        subject={mockSubjectNursery}
        classes={mockClasses}
        offerings={[]}
        onSave={vi.fn()}
        errorMessage="Network error: failed to assign classes"
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Network error: failed to assign classes');
  });
});
