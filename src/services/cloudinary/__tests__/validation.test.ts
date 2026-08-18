/**
 * Unit tests — shared Cloudinary validation service
 *
 * Tests validateImageFile with both the default config and custom configs
 * to verify the function is truly generic.
 */

import { describe, it, expect } from 'vitest';
import { validateImageFile }     from '../validation';
import {
  DEFAULT_IMAGE_VALIDATION,
  type ImageValidationConfig,
} from '../types';

/* ── Fixtures ─────────────────────────────────────────────────── */

function makeFile(name: string, type: string, sizeBytes = 512): File {
  return new File([new Uint8Array(sizeBytes).fill(65)], name, { type });
}

const MAX_BYTES = DEFAULT_IMAGE_VALIDATION.maxBytes; // 5 MB

/* ── Default config ───────────────────────────────────────────── */

describe('validateImageFile — default config', () => {
  describe('accepted types', () => {
    it.each([
      ['image.png',  'image/png'],
      ['image.jpg',  'image/jpeg'],
      ['image.jpeg', 'image/jpeg'],
      ['image.svg',  'image/svg+xml'],
      ['image.webp', 'image/webp'],
    ])('accepts %s', (name, type) => {
      expect(validateImageFile(makeFile(name, type)).valid).toBe(true);
    });
  });

  describe('rejected MIME types', () => {
    it.each([
      ['doc.pdf',  'application/pdf'],
      ['vid.mp4',  'video/mp4'],
      ['img.gif',  'image/gif'],
      ['arc.zip',  'application/zip'],
    ])('rejects %s', (name, type) => {
      const result = validateImageFile(makeFile(name, type));
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.message).toMatch(/Invalid file type/i);
    });
  });

  describe('rejected extensions', () => {
    it('rejects mismatched extension even with a valid MIME type', () => {
      const result = validateImageFile(makeFile('image.bmp', 'image/png'));
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.message).toMatch(/Invalid file extension/i);
    });
  });

  describe('file size', () => {
    it('accepts a file exactly at the 5 MB limit', () => {
      expect(validateImageFile(makeFile('image.png', 'image/png', MAX_BYTES)).valid).toBe(true);
    });

    it('rejects a file one byte over the 5 MB limit', () => {
      const result = validateImageFile(makeFile('image.png', 'image/png', MAX_BYTES + 1));
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.message).toMatch(/smaller than/i);
    });
  });
});

/* ── Custom config ────────────────────────────────────────────── */

describe('validateImageFile — custom config', () => {
  const AVATAR_CONFIG: ImageValidationConfig = {
    maxBytes:          2 * 1024 * 1024, // 2 MB
    maxLabel:          '2 MB',
    allowedMimeTypes:  new Set(['image/png', 'image/jpeg']),
    allowedExtensions: new Set(['png', 'jpg', 'jpeg']),
  };

  it('accepts PNG within the custom size limit', () => {
    expect(validateImageFile(makeFile('avatar.png', 'image/png', 512), AVATAR_CONFIG).valid).toBe(true);
  });

  it('rejects SVG that is allowed by the default but not by the custom config', () => {
    const result = validateImageFile(makeFile('icon.svg', 'image/svg+xml'), AVATAR_CONFIG);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.message).toMatch(/Invalid file type/i);
  });

  it('rejects a file exceeding the custom 2 MB limit', () => {
    const OVER_2MB = 2 * 1024 * 1024 + 1;
    const result = validateImageFile(makeFile('avatar.png', 'image/png', OVER_2MB), AVATAR_CONFIG);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.message).toMatch(/2 MB/i);
  });

  it('accepts a file exactly at the 2 MB limit', () => {
    expect(
      validateImageFile(makeFile('avatar.png', 'image/png', 2 * 1024 * 1024), AVATAR_CONFIG).valid,
    ).toBe(true);
  });
});
