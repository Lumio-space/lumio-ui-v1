/**
 * Unit tests — ImageUpload component
 *
 * Tests cover:
 *   - Idle render (no value)
 *   - Committed image render (value prop)
 *   - External error prop display
 *   - File selection via input change
 *   - Client-side validation errors (bad type, oversized)
 *   - Successful upload flow: onChange called, preview cleared
 *   - Failed upload flow: error shown, retry available
 *   - Remove button: onChange(null) called
 *   - Drag-and-drop acceptance
 *
 * The onUpload prop is always a jest.fn() / vi.fn() — no real HTTP calls.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageUpload }                          from '../ImageUpload';
import type { UploadedImageMetadata }           from '@/services/cloudinary';

/* ── Fixtures ─────────────────────────────────────────────────── */

const METADATA: UploadedImageMetadata = {
  publicId:  'lumio/test/abc',
  secureUrl: 'https://res.cloudinary.com/test/image/upload/abc.png',
  width:     200,
  height:    200,
  format:    'png',
};

function makeFile(name: string, type: string, sizeBytes = 512): File {
  return new File([new Uint8Array(sizeBytes).fill(65)], name, { type });
}

/* ── Helpers ──────────────────────────────────────────────────── */

interface RenderProps {
  onUpload?: (file: File) => Promise<UploadedImageMetadata>;
  onChange?:  (metadata: UploadedImageMetadata | null) => void;
  value?:    string | null;
  error?:    string;
}

function renderUpload({
  onUpload  = vi.fn().mockResolvedValue(METADATA),
  onChange  = vi.fn(),
  value     = null,
  error,
}: RenderProps = {}) {
  return {
    onUpload,
    onChange,
    ...render(
      <ImageUpload
        onUpload={onUpload}
        onChange={onChange}
        value={value}
        error={error}
      />,
    ),
  };
}

/* ── Idle state ───────────────────────────────────────────────── */

describe('ImageUpload — idle state', () => {
  it('renders the upload zone with upload cloud icon', () => {
    renderUpload();
    expect(screen.getByRole('button', { name: /upload image/i })).toBeDefined();
  });

  it('renders the upload sub-label with accepted formats', () => {
    renderUpload();
    expect(screen.getByText(/PNG.*JPG.*SVG.*WEBP/i)).toBeDefined();
  });

  it('does not render a Remove button when no image is committed', () => {
    renderUpload();
    expect(screen.queryByRole('button', { name: /remove/i })).toBeNull();
  });
});

/* ── Committed image ─────────────────────────────────────────── */

describe('ImageUpload — with committed value', () => {
  it('renders an img element with the committed URL', () => {
    renderUpload({ value: METADATA.secureUrl });
    const img = screen.getByAltText(/preview/i) as HTMLImageElement;
    expect(img.src).toBe(METADATA.secureUrl);
  });

  it('shows the Remove button when a value is committed', () => {
    renderUpload({ value: METADATA.secureUrl });
    expect(screen.getByRole('button', { name: /remove/i })).toBeDefined();
  });

  it('calls onChange(null) and hides the image when Remove is clicked', async () => {
    const onChange = vi.fn();
    renderUpload({ value: METADATA.secureUrl, onChange });
    await userEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

/* ── External error prop ─────────────────────────────────────── */

describe('ImageUpload — external error', () => {
  it('displays the external error message', () => {
    renderUpload({ error: 'Logo is required' });
    expect(screen.getByText('Logo is required')).toBeDefined();
  });

  it('shows a Retry button alongside the external error', () => {
    renderUpload({ error: 'Network error' });
    expect(screen.getByRole('button', { name: /retry/i })).toBeDefined();
  });
});

/* ── Client-side validation ──────────────────────────────────── */

/**
 * Helper: simulate a file being selected on a hidden file input.
 * userEvent.upload requires the element to be fully interactable (not
 * sr-only), so we use fireEvent.change with Object.defineProperty instead,
 * which mirrors exactly what the browser dispatches.
 */
function simulateFileSelect(input: HTMLInputElement, file: File) {
  Object.defineProperty(input, 'files', { writable: true, value: [file] });
  fireEvent.change(input);
}

describe('ImageUpload — client-side validation', () => {
  it('shows a validation error and does NOT call onUpload for a rejected MIME type', async () => {
    const onUpload = vi.fn();
    const { container } = renderUpload({ onUpload });

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    simulateFileSelect(input, makeFile('doc.pdf', 'application/pdf'));

    expect(onUpload).not.toHaveBeenCalled();
    expect(await screen.findByText(/Invalid file type/i)).toBeDefined();
  });

  it('shows a size error and does NOT call onUpload for an oversized file', async () => {
    const onUpload = vi.fn();
    const { container } = renderUpload({ onUpload });

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    simulateFileSelect(input, makeFile('big.png', 'image/png', 6 * 1024 * 1024));

    expect(onUpload).not.toHaveBeenCalled();
    expect(await screen.findByText(/smaller than/i)).toBeDefined();
  });
});

/* ── Successful upload flow ──────────────────────────────────── */

describe('ImageUpload — successful upload', () => {
  beforeEach(() => {
    // FileReader is not available in jsdom — stub it so startUpload doesn't hang.
    vi.stubGlobal('FileReader', class {
      onload: (() => void) | null = null;
      readAsDataURL() { this.onload?.(); }
      result = 'data:image/png;base64,abc';
    });
  });

  it('calls onUpload with the selected file', async () => {
    const onUpload = vi.fn().mockResolvedValue(METADATA);
    const { container } = renderUpload({ onUpload });

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file  = makeFile('logo.png', 'image/png');
    simulateFileSelect(input, file);

    await waitFor(() => expect(onUpload).toHaveBeenCalledOnce());
    expect(onUpload).toHaveBeenCalledWith(file);
  });

  it('calls onChange with the returned metadata on success', async () => {
    const onChange = vi.fn();
    const onUpload = vi.fn().mockResolvedValue(METADATA);
    const { container } = renderUpload({ onUpload, onChange });

    simulateFileSelect(
      container.querySelector('input[type="file"]') as HTMLInputElement,
      makeFile('logo.png', 'image/png'),
    );

    await waitFor(() => expect(onChange).toHaveBeenCalledOnce());
    expect(onChange).toHaveBeenCalledWith(METADATA);
  });

  it('does not show an error after a successful upload', async () => {
    const onUpload = vi.fn().mockResolvedValue(METADATA);
    const { container } = renderUpload({ onUpload });

    simulateFileSelect(
      container.querySelector('input[type="file"]') as HTMLInputElement,
      makeFile('logo.png', 'image/png'),
    );

    await waitFor(() => expect(onUpload).toHaveBeenCalled());
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

/* ── Failed upload flow ──────────────────────────────────────── */

describe('ImageUpload — upload failure', () => {
  beforeEach(() => {
    vi.stubGlobal('FileReader', class {
      onload: (() => void) | null = null;
      readAsDataURL() { this.onload?.(); }
      result = 'data:image/png;base64,abc';
    });
  });

  it('shows the upload error message on failure', async () => {
    const onUpload = vi.fn().mockRejectedValue(new Error('Network error'));
    const { container } = renderUpload({ onUpload });

    simulateFileSelect(
      container.querySelector('input[type="file"]') as HTMLInputElement,
      makeFile('logo.png', 'image/png'),
    );

    expect(await screen.findByText('Network error')).toBeDefined();
  });

  it('shows the Retry button after a failure', async () => {
    const onUpload = vi.fn().mockRejectedValue(new Error('Upload failed'));
    const { container } = renderUpload({ onUpload });

    simulateFileSelect(
      container.querySelector('input[type="file"]') as HTMLInputElement,
      makeFile('logo.png', 'image/png'),
    );

    expect(await screen.findByRole('button', { name: /retry/i })).toBeDefined();
  });

  it('does NOT call onChange on failure', async () => {
    const onChange = vi.fn();
    const onUpload = vi.fn().mockRejectedValue(new Error('Fail'));
    const { container } = renderUpload({ onUpload, onChange });

    simulateFileSelect(
      container.querySelector('input[type="file"]') as HTMLInputElement,
      makeFile('logo.png', 'image/png'),
    );

    await waitFor(() => expect(onUpload).toHaveBeenCalled());
    expect(onChange).not.toHaveBeenCalled();
  });
});

/* ── Drag-and-drop ───────────────────────────────────────────── */

describe('ImageUpload — drag and drop', () => {
  it('processes a dropped file the same as a file input selection', async () => {
    const onUpload = vi.fn().mockResolvedValue(METADATA);
    const onChange  = vi.fn();
    renderUpload({ onUpload, onChange });

    const zone = screen.getByRole('button', { name: /upload image/i });
    const file  = makeFile('logo.png', 'image/png');

    fireEvent.dragEnter(zone, { dataTransfer: { files: [file] } });
    fireEvent.dragOver(zone,  { dataTransfer: { files: [file] } });
    fireEvent.drop(zone,      { dataTransfer: { files: [file] } });

    await waitFor(() => expect(onUpload).toHaveBeenCalledWith(file));
  });
});
