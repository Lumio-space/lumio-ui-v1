import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { SettingsView } from '../components/SettingsView';

describe('SettingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders settings page header and default school tab', () => {
    renderWithProviders(<SettingsView />);

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /school/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /branding/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /notifications/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /security/i })).toBeInTheDocument();

    expect(screen.getByLabelText('School name')).toBeInTheDocument();
    expect(screen.getByLabelText('Contact email')).toBeInTheDocument();
  });

  it('switches to branding tab and allows accent color selection', () => {
    renderWithProviders(<SettingsView />);

    const brandingTab = screen.getByRole('tab', { name: /branding/i });
    fireEvent.click(brandingTab);

    expect(screen.getByText('School logo')).toBeInTheDocument();
    expect(screen.getByText('Brand accent color')).toBeInTheDocument();

    const goldBtn = screen.getByRole('button', { name: 'Soft Gold' });
    fireEvent.click(goldBtn);
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('switches to notifications tab and toggles switches', () => {
    renderWithProviders(<SettingsView />);

    const notifTab = screen.getByRole('tab', { name: /notifications/i });
    fireEvent.click(notifTab);

    expect(screen.getByText('Email notifications')).toBeInTheDocument();
    expect(screen.getByText('Push notifications')).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(
      /local ui preferences only — notification settings are not saved to or synchronized with your account/i
    );
    expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled();

    const emailToggle = screen.getByRole('switch', { name: 'Email notifications' });
    expect(emailToggle).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(emailToggle);
    expect(emailToggle).toHaveAttribute('aria-checked', 'false');
  });

  it('switches to security tab and renders password inputs', () => {
    renderWithProviders(<SettingsView />);

    const secTab = screen.getByRole('tab', { name: /security/i });
    fireEvent.click(secTab);

    expect(screen.getByLabelText('Current password')).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
    expect(screen.getByText('Two-factor authentication')).toBeInTheDocument();
  });

  it('provides save feedback when "Save changes" is clicked', () => {
    renderWithProviders(<SettingsView />);

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveBtn);

    expect(screen.getByText('Saved')).toBeInTheDocument();
  });
});
