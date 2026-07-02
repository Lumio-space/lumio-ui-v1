/**
 * PageHeader — unit tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader } from '../PageHeader';

describe('PageHeader', () => {
  it('renders the title', () => {
    render(<PageHeader title="Students" />);
    expect(screen.getByRole('heading', { name: 'Students' })).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<PageHeader title="Students" description="Manage student records" />);
    expect(screen.getByText('Manage student records')).toBeInTheDocument();
  });

  it('renders actions slot when provided', () => {
    render(<PageHeader title="Students" actions={<button>Add Student</button>} />);
    expect(screen.getByRole('button', { name: 'Add Student' })).toBeInTheDocument();
  });

  it('does not render description when omitted', () => {
    const { queryByText } = render(<PageHeader title="Students" />);
    expect(queryByText(/manage/i)).not.toBeInTheDocument();
  });
});
