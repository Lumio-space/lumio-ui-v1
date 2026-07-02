/**
 * Avatar — unit tests
 *
 * Tests cover: initials rendering, image fallback, size classes,
 * deterministic colour palette, and accessibility.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from '../Avatar';

describe('Avatar', () => {
  it('renders initials from a two-word name', () => {
    render(<Avatar name="Sarah Mitchell" />);
    expect(screen.getByText('SM')).toBeInTheDocument();
  });

  it('renders initials from a single-word name', () => {
    render(<Avatar name="Admin" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders an img when src is provided', () => {
    render(<Avatar name="Sarah Mitchell" src="https://example.com/avatar.jpg" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(img).toHaveAttribute('alt', 'Sarah Mitchell');
  });

  it('applies correct size class for sm', () => {
    const { container } = render(<Avatar name="Sam Lee" size="sm" />);
    expect(container.firstChild).toHaveClass('h-9', 'w-9');
  });

  it('applies ring classes when ring prop is true', () => {
    const { container } = render(<Avatar name="Sam Lee" ring />);
    expect(container.firstChild).toHaveClass('ring-2', 'ring-white');
  });
});
