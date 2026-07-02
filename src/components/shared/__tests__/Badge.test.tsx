/**
 * Badge — unit tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders a dot when dot prop is true', () => {
    const { container } = render(<Badge dot tone="green">Active</Badge>);
    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass('bg-emerald-500');
  });

  it('applies the correct tone classes', () => {
    const { container } = render(<Badge tone="indigo">Role</Badge>);
    expect(container.firstChild).toHaveClass('bg-indigo-50', 'text-indigo-700');
  });
});
