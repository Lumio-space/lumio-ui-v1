import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AttendanceSummaryCards } from '../components/AttendanceSummaryCards';

describe('AttendanceSummaryCards', () => {
  it('renders correct present, absent, and late counts and calculates rate', () => {
    render(
      <AttendanceSummaryCards
        summary={{
          present: 18,
          absent: 2,
          late: 1,
          excused: 1,
          total: 22,
        }}
        classNameDisplay="Primary 5 A"
      />
    );

    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Present')).toBeInTheDocument();
    expect(screen.getByText('Absent')).toBeInTheDocument();
    expect(screen.getByText('Late')).toBeInTheDocument();
    expect(screen.getByText("Today’s rate")).toBeInTheDocument();
    expect(screen.getByText('Primary 5 A')).toBeInTheDocument();

    // 18 / 22 = 81.8% -> 82%
    expect(screen.getByText('82%')).toBeInTheDocument();
  });

  it('handles empty / zero counts gracefully without dividing by zero', () => {
    render(
      <AttendanceSummaryCards
        summary={{
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0,
        }}
        classNameDisplay="JSS 1 B"
      />
    );

    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('JSS 1 B')).toBeInTheDocument();
  });

  it('correctly uses summary.total as denominator when only a subset of students are marked', () => {
    // 5 present out of 20 total enrolled students (e.g. rest not marked yet)
    // Rate must be 5 / 20 = 25%, NOT 5 / 5 = 100%
    render(
      <AttendanceSummaryCards
        summary={{
          present: 5,
          absent: 0,
          late: 0,
          excused: 0,
          total: 20,
        }}
        classNameDisplay="Primary 3 C"
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.queryByText('100%')).not.toBeInTheDocument();
  });
});
