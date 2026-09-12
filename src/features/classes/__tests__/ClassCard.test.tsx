/**
 * ClassCard — unit tests
 */

import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { ClassCard } from '../components/ClassCard';
import type { ClassRecord } from '../types';

const MOCK_CLASS: ClassRecord = {
  id: 'cls-1',
  schoolId: 'school-1',
  grade: 'Primary 1',
  section: 'A',
  level: 'primary',
  capacity: 35,
  room: 101,
  teacher: 'Dr. Evelyn Hughes',
  students: 28,
  subjects: ['Mathematics', 'English'],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('ClassCard', () => {
  it('renders class display name and room number', () => {
    renderWithProviders(<ClassCard classRecord={MOCK_CLASS} />);

    expect(screen.getByText('Primary 1 A')).toBeInTheDocument();
    expect(screen.getByText('Room 101')).toBeInTheDocument();
  });

  it('renders capacity information and progress bar', () => {
    renderWithProviders(<ClassCard classRecord={MOCK_CLASS} />);

    expect(screen.getByText('Capacity')).toBeInTheDocument();
    expect(screen.getByText('28/35')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '80');
  });

  it('renders form teacher information and status badge', () => {
    renderWithProviders(<ClassCard classRecord={MOCK_CLASS} />);

    expect(screen.getByText('Form Teacher')).toBeInTheDocument();
    expect(screen.getByText('Dr. Evelyn Hughes')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders unassigned teacher fallback when no teacher is set', () => {
    const unassignedClass: ClassRecord = {
      ...MOCK_CLASS,
      teacher: undefined,
    };
    renderWithProviders(<ClassCard classRecord={unassignedClass} />);

    expect(screen.getByText('Not assigned')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('renders school level and subject badges', () => {
    renderWithProviders(<ClassCard classRecord={MOCK_CLASS} />);

    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('calls onViewDetails when "View class" button is clicked', () => {
    const onViewDetails = vi.fn();
    renderWithProviders(
      <ClassCard classRecord={MOCK_CLASS} onViewDetails={onViewDetails} />
    );

    fireEvent.click(screen.getByRole('button', { name: /view class/i }));
    expect(onViewDetails).toHaveBeenCalledWith(MOCK_CLASS);
  });

  it('calls onViewDetails when "View details" dropdown item is clicked', () => {
    const onViewDetails = vi.fn();
    renderWithProviders(
      <ClassCard classRecord={MOCK_CLASS} onViewDetails={onViewDetails} />
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /class actions/i }));
    expect(screen.getByRole('menuitem', { name: /view details/i })).toBeInTheDocument();

    // Click view details
    fireEvent.click(screen.getByRole('menuitem', { name: /view details/i }));
    expect(onViewDetails).toHaveBeenCalledWith(MOCK_CLASS);
  });

  it('renders edit and delete dropdown actions', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    renderWithProviders(
      <ClassCard
        classRecord={MOCK_CLASS}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /class actions/i }));
    expect(screen.getByRole('menuitem', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(MOCK_CLASS);
  });
});
