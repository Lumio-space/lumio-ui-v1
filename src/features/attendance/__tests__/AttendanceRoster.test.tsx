import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, render, act } from '@testing-library/react';
import { AttendanceRoster } from '../components/AttendanceRoster';
import type { StudentAttendanceRow } from '../types';

const MOCK_STUDENTS: StudentAttendanceRow[] = [
  {
    studentId: 's-1',
    name: 'Amelia Bennett',
    rollNo: '10',
    status: 'present',
  },
  {
    studentId: 's-2',
    name: 'Liam Carter',
    rollNo: '12',
    status: 'absent',
  },
  {
    studentId: 's-3',
    name: 'Chloe Davis',
    rollNo: '15',
    status: null,
  },
];

describe('AttendanceRoster', () => {
  it('renders read-only view with status badges and hides mark/save controls', () => {
    const onSave = vi.fn();

    render(
      <AttendanceRoster
        students={MOCK_STUDENTS}
        date="2026-11-23"
        classNameDisplay="Grade 10 A"
        readOnly={true}
        onSave={onSave}
      />
    );

    // Read-only indicator is visible
    expect(screen.getByText('Read-only view')).toBeInTheDocument();

    // Action buttons are NOT rendered
    expect(screen.queryByText('Mark all present')).not.toBeInTheDocument();
    expect(screen.queryByText('Save register')).not.toBeInTheDocument();

    // Student names are displayed
    expect(screen.getByText('Amelia Bennett')).toBeInTheDocument();
    expect(screen.getByText('Liam Carter')).toBeInTheDocument();
    expect(screen.getByText('Chloe Davis')).toBeInTheDocument();

    // Status badges are displayed
    expect(screen.getByText('Present')).toBeInTheDocument();
    expect(screen.getByText('Absent')).toBeInTheDocument();
    expect(screen.getByText('Unmarked')).toBeInTheDocument();

    // Save cannot be triggered
    expect(onSave).not.toHaveBeenCalled();
  });

  it('renders editable controls and allows form teachers to mark and save', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onSummaryChange = vi.fn();

    render(
      <AttendanceRoster
        students={MOCK_STUDENTS}
        date="2026-11-23"
        classNameDisplay="Grade 10 A"
        readOnly={false}
        onSave={onSave}
        onSummaryChange={onSummaryChange}
      />
    );

    // Interactive controls are present
    const markAllBtn = screen.getByText('Mark all present');
    const saveBtn = screen.getByText('Save register');
    expect(markAllBtn).toBeInTheDocument();
    expect(saveBtn).toBeInTheDocument();

    // Status buttons are interactive
    const lateButton = screen.getByLabelText('Mark Amelia Bennett Late');
    await act(async () => {
      fireEvent.click(lateButton);
    });

    // Save register
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        's-1': 'late',
      })
    );
  });

  it('renders status badges with case-insensitivity in read-only mode', () => {
    const studentsWithMixedCase = [
      {
        studentId: 's-10',
        name: 'Eva Green',
        rollNo: '20',
        status: 'PRESENT' as any,
      },
      {
        studentId: 's-11',
        name: 'Noah Scott',
        rollNo: '21',
        status: 'Late' as any,
      },
      {
        studentId: 's-12',
        name: 'Maya Lin',
        rollNo: '22',
        status: 'EXCUSED' as any,
      },
    ];

    render(
      <AttendanceRoster
        students={studentsWithMixedCase}
        date="2026-11-23"
        classNameDisplay="Grade 10 A"
        readOnly={true}
      />
    );

    expect(screen.getByText('Present')).toBeInTheDocument();
    expect(screen.getByText('Late')).toBeInTheDocument();
    expect(screen.getByText('Excused')).toBeInTheDocument();
  });

  it('does not trigger infinite summary updates when re-rendered with new empty array references or inline callbacks', () => {
    const onSummaryChange = vi.fn();

    const { rerender } = render(
      <AttendanceRoster
        students={[]}
        date="2026-11-23"
        classNameDisplay="Grade 10 A"
        readOnly={false}
        onSummaryChange={(s) => onSummaryChange(s)}
      />
    );

    expect(onSummaryChange).toHaveBeenCalledTimes(1);

    // Re-render with fresh empty array literal and fresh inline callback
    for (let i = 0; i < 5; i++) {
      rerender(
        <AttendanceRoster
          students={[]}
          date="2026-11-23"
          classNameDisplay="Grade 10 A"
          readOnly={false}
          onSummaryChange={(s) => onSummaryChange(s)}
        />
      );
    }

    expect(onSummaryChange).toHaveBeenCalledTimes(1);
    expect(screen.getByText('No students enrolled in this class roster.')).toBeInTheDocument();
  });
});
