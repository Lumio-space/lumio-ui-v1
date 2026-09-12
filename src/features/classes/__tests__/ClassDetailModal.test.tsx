/**
 * ClassDetailModal — unit tests
 */

import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { ClassDetailModal } from '../components/ClassDetailModal';
import type { ClassRecord } from '../types';

const MOCK_CLASS: ClassRecord = {
  id: 'cls-1',
  schoolId: 'school-1',
  grade: 'Primary 1',
  section: 'A',
  level: 'primary',
  capacity: 36,
  room: 204,
  teacher: 'Dr. Evelyn Hughes',
  students: 32,
  subjects: ['Mathematics', 'English Literature', 'Physics'],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ClassDetailModal', () => {
  it('renders nothing when classRecord is null', () => {
    const { container } = renderWithProviders(
      <ClassDetailModal open={true} onClose={vi.fn()} classRecord={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders dialog with class title, room, and student count in description', () => {
    renderWithProviders(
      <ClassDetailModal open={true} onClose={vi.fn()} classRecord={MOCK_CLASS} />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Primary 1 A' })).toBeInTheDocument();
    expect(screen.getByText(/room 204 · 32 students/i)).toBeInTheDocument();
  });

  it('renders the 3 metric stat boxes: students, subjects, and seats left', () => {
    renderWithProviders(
      <ClassDetailModal open={true} onClose={vi.fn()} classRecord={MOCK_CLASS} />
    );

    expect(screen.getByText('32')).toBeInTheDocument();
    expect(screen.getByText('Students')).toBeInTheDocument();

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Subjects')).toBeInTheDocument();

    // 36 capacity - 32 students = 4 seats left
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Seats left')).toBeInTheDocument();
  });

  it('renders form teacher section with teacher name and active badge', () => {
    renderWithProviders(
      <ClassDetailModal open={true} onClose={vi.fn()} classRecord={MOCK_CLASS} />
    );

    expect(screen.getByText('Form Teacher')).toBeInTheDocument();
    expect(screen.getByText('Dr. Evelyn Hughes')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders unassigned teacher fallback when teacher is not set', () => {
    const classWithoutTeacher: ClassRecord = {
      ...MOCK_CLASS,
      teacher: undefined,
    };

    renderWithProviders(
      <ClassDetailModal open={true} onClose={vi.fn()} classRecord={classWithoutTeacher} />
    );

    expect(screen.getByText('Not assigned')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('renders subjects list with teacher assignments', () => {
    renderWithProviders(
      <ClassDetailModal open={true} onClose={vi.fn()} classRecord={MOCK_CLASS} />
    );

    expect(screen.getByText('Subjects & teachers')).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('English Literature')).toBeInTheDocument();
    expect(screen.getByText('Physics')).toBeInTheDocument();
  });

  it('renders empty message when no subjects are assigned', () => {
    const classWithoutSubjects: ClassRecord = {
      ...MOCK_CLASS,
      subjects: [],
    };

    renderWithProviders(
      <ClassDetailModal open={true} onClose={vi.fn()} classRecord={classWithoutSubjects} />
    );

    expect(screen.getByText(/no subjects assigned yet/i)).toBeInTheDocument();
  });

  it('calls onClose when Close button is clicked', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <ClassDetailModal open={true} onClose={onClose} classRecord={MOCK_CLASS} />
    );

    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    expect(closeButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalled();
  });
});
