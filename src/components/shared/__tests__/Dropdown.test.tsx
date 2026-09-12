/**
 * Dropdown — unit tests
 */

import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Dropdown, DropdownItem, DropdownDivider, DropdownLabel } from '../Dropdown';

describe('Dropdown', () => {
  it('renders the trigger button', () => {
    renderWithProviders(
      <Dropdown trigger={<span>Open Menu</span>}>
        <DropdownItem>Item 1</DropdownItem>
      </Dropdown>
    );

    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens the menu when trigger is clicked', () => {
    renderWithProviders(
      <Dropdown trigger={<span>Open Menu</span>}>
        <DropdownItem>Item 1</DropdownItem>
        <DropdownItem>Item 2</DropdownItem>
      </Dropdown>
    );

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /item 1/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /item 2/i })).toBeInTheDocument();
  });

  it('calls onClick and closes menu when a menuitem is clicked', async () => {
    const onItemClick = vi.fn();
    renderWithProviders(
      <Dropdown trigger={<span>Open Menu</span>}>
        <DropdownItem onClick={onItemClick}>Item 1</DropdownItem>
      </Dropdown>
    );

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /item 1/i }));

    expect(onItemClick).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('closes menu when Escape key is pressed', async () => {
    renderWithProviders(
      <Dropdown trigger={<span>Open Menu</span>}>
        <DropdownItem>Item 1</DropdownItem>
      </Dropdown>
    );

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('closes menu when clicking outside', async () => {
    renderWithProviders(
      <div>
        <div data-testid="outside">Outside</div>
        <Dropdown trigger={<span>Open Menu</span>}>
          <DropdownItem>Item 1</DropdownItem>
        </Dropdown>
      </div>
    );

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('renders DropdownLabel and DropdownDivider', () => {
    renderWithProviders(
      <Dropdown trigger={<span>Open Menu</span>}>
        <DropdownLabel>Section Label</DropdownLabel>
        <DropdownItem>Action</DropdownItem>
        <DropdownDivider />
        <DropdownItem danger>Delete</DropdownItem>
      </Dropdown>
    );

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));
    expect(screen.getByText('Section Label')).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /delete/i })).toHaveClass('text-red-600');
  });
});
