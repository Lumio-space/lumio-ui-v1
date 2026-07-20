/**
 * Unit tests — onboarding logo upload services
 *
 * Tests are organised by module:
 *
 *   validateLogoFile     — pure validation (logo.validation.ts)
 *   uploadToCloudinary   — direct Cloudinary upload via fetch (logo.cloudinary.ts)
 *   requestBrandingSignature — POST /registration/drafts/branding/signature (registration.api.ts)
 *   saveBranding             — POST /registration/drafts/steps/branding (registration.api.ts)
 *   uploadSchoolLogo     — end-to-end orchestration (logo.upload.ts)
 *
 * Network strategy:
 *   - apiClient (Axios) is mocked at the module level via vi.mock so
 *     no real HTTP calls are made and the interceptor side-effects are skipped.
 *   - global fetch is stubbed for the direct Cloudinary upload which uses
 *     browser fetch (not Axios) as required by the architecture.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/* ── Hoist mocks so they're available inside vi.mock factories ── */
const { mockPost } = vi.hoisted(() => ({ mockPost: vi.fn() }));

/* ── Silence the interceptors side-effect import ─────────────── */
vi.mock('@/lib/api/interceptors', () => ({}));

/* ── Mock the shared Axios instance ──────────────────────────── */
vi.mock('@/lib/api/axios', () => ({
  apiClient: { post: mockPost, get: vi.fn() },
}));

/* ── Imports under test (after mocks are registered) ─────────── */
import {
  validateLogoFile,
  LOGO_MAX_BYTES,
} from '@/features/onboarding/services/logo.validation';

import { uploadToCloudinary } from '@/features/onboarding/services/logo.cloudinary';
import { uploadSchoolLogo }   from '@/features/onboarding/services/logo.upload';
import {
  requestBrandingSignature,
  saveBranding,
} from '@/features/onboarding/api/registration.api';

import type {
  BrandingSignatureResponse,
  LogoMetadata,
} from '@/features/onboarding/types';

/* ── Test fixtures ────────────────────────────────────────────── */

function makeFile(name: string, type: string, sizeBytes = 512): File {
  return new File([new Uint8Array(sizeBytes).fill(65)], name, { type });
}

const SIGNED_PARAMS: BrandingSignatureResponse = {
  cloud_name: 'test-cloud',
  api_key:    '999888777666555',
  signature:  'abc123sig',
  timestamp:  1700000000,
  folder:     'lumio/schools/logos',
};

const CLOUDINARY_RESPONSE = {
  public_id:  'lumio/schools/logos/test_abc',
  secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/lumio/schools/logos/test_abc.png',
  width:      300,
  height:     300,
  format:     'png',
  // extra fields that must be stripped
  bytes:         2048,
  created_at:    '2024-01-01T00:00:00Z',
  resource_type: 'image',
};

const LOGO_METADATA: LogoMetadata = {
  public_id:  CLOUDINARY_RESPONSE.public_id,
  secure_url: CLOUDINARY_RESPONSE.secure_url,
  width:      CLOUDINARY_RESPONSE.width,
  height:     CLOUDINARY_RESPONSE.height,
  format:     CLOUDINARY_RESPONSE.format,
};

/* ── validateLogoFile ─────────────────────────────────────────── */

describe('validateLogoFile', () => {
  describe('valid files', () => {
    it.each([
      ['logo.png',  'image/png'],
      ['logo.jpg',  'image/jpeg'],
      ['logo.jpeg', 'image/jpeg'],
      ['logo.svg',  'image/svg+xml'],
      ['logo.webp', 'image/webp'],
    ])('accepts %s (%s)', (name, type) => {
      expect(validateLogoFile(makeFile(name, type)).valid).toBe(true);
    });
  });

  describe('invalid MIME type', () => {
    it.each([
      ['document.pdf',  'application/pdf'],
      ['archive.zip',   'application/zip'],
      ['video.mp4',     'video/mp4'],
      ['image.gif',     'image/gif'],
    ])('rejects %s', (name, type) => {
      const result = validateLogoFile(makeFile(name, type));
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.message).toMatch(/Invalid file type/i);
    });
  });

  describe('invalid extension', () => {
    it('rejects a valid MIME type paired with an invalid extension', () => {
      const result = validateLogoFile(makeFile('logo.bmp', 'image/png'));
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.message).toMatch(/Invalid file extension/i);
    });
  });

  describe('file size', () => {
    it('accepts a file exactly at the 5 MB limit', () => {
      expect(validateLogoFile(makeFile('logo.png', 'image/png', LOGO_MAX_BYTES)).valid).toBe(true);
    });

    it('rejects a file one byte over the 5 MB limit', () => {
      const result = validateLogoFile(makeFile('logo.png', 'image/png', LOGO_MAX_BYTES + 1));
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.message).toMatch(/5 MB/i);
    });
  });
});

/* ── requestBrandingSignature ─────────────────────────────────── */

describe('requestBrandingSignature', () => {
  beforeEach(() => mockPost.mockReset());

  it('POSTs to /registration/drafts/branding/signature', async () => {
    mockPost.mockResolvedValueOnce({ data: SIGNED_PARAMS });
    await requestBrandingSignature();
    expect(mockPost).toHaveBeenCalledOnce();
    expect(mockPost).toHaveBeenCalledWith('/registration/drafts/branding/signature');
  });

  it('returns the signed params from the response', async () => {
    mockPost.mockResolvedValueOnce({ data: SIGNED_PARAMS });
    const result = await requestBrandingSignature();
    expect(result).toEqual(SIGNED_PARAMS);
  });

  it('propagates errors thrown by apiClient', async () => {
    mockPost.mockRejectedValueOnce(new Error('Unauthorized'));
    await expect(requestBrandingSignature()).rejects.toThrow('Unauthorized');
  });
});

/* ── saveBranding ─────────────────────────────────────────────── */

describe('saveBranding', () => {
  beforeEach(() => mockPost.mockReset());

  it('POSTs to /registration/drafts/steps/branding', async () => {
    mockPost.mockResolvedValueOnce({ data: {} });
    await saveBranding({
      publicId:  LOGO_METADATA.public_id,
      secureUrl: LOGO_METADATA.secure_url,
      width:     LOGO_METADATA.width,
      height:    LOGO_METADATA.height,
      format:    LOGO_METADATA.format,
    });
    expect(mockPost).toHaveBeenCalledOnce();
    expect(mockPost).toHaveBeenCalledWith(
      '/registration/drafts/steps/branding',
      expect.objectContaining({ publicId: LOGO_METADATA.public_id }),
    );
  });

  it('sends camelCase field names to the backend', async () => {
    mockPost.mockResolvedValueOnce({ data: {} });
    await saveBranding({
      publicId:  'lumio/test/abc',
      secureUrl: 'https://res.cloudinary.com/test/abc.png',
      width:     100,
      height:    100,
      format:    'png',
    });
    const [, payload] = mockPost.mock.calls[0] as [string, Record<string, unknown>];
    expect(payload).toHaveProperty('publicId');
    expect(payload).toHaveProperty('secureUrl');
    expect(payload).not.toHaveProperty('public_id');
    expect(payload).not.toHaveProperty('secure_url');
  });

  it('propagates errors thrown by apiClient', async () => {
    mockPost.mockRejectedValueOnce(new Error('School not found'));
    await expect(
      saveBranding({ publicId: 'x', secureUrl: 'x', width: 1, height: 1, format: 'png' }),
    ).rejects.toThrow('School not found');
  });
});

/* ── uploadToCloudinary ───────────────────────────────────────── */

describe('uploadToCloudinary', () => {
  const fetchSpy = vi.fn();

  beforeEach(() => vi.stubGlobal('fetch', fetchSpy));
  afterEach(() => { vi.unstubAllGlobals(); fetchSpy.mockReset(); });

  it('POSTs to the correct Cloudinary upload URL', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(CLOUDINARY_RESPONSE), { status: 200 }),
    );
    await uploadToCloudinary(makeFile('logo.png', 'image/png'), SIGNED_PARAMS);
    const [url] = fetchSpy.mock.calls[0] as [string];
    expect(url).toBe(
      `https://api.cloudinary.com/v1_1/${SIGNED_PARAMS.cloud_name}/image/upload`,
    );
  });

  it('includes all signed params in the FormData body', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(CLOUDINARY_RESPONSE), { status: 200 }),
    );
    const file = makeFile('logo.png', 'image/png');
    await uploadToCloudinary(file, SIGNED_PARAMS);
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    const body = init.body as FormData;
    expect(body.get('file')).toBe(file);
    expect(body.get('api_key')).toBe(SIGNED_PARAMS.api_key);
    expect(body.get('signature')).toBe(SIGNED_PARAMS.signature);
    expect(body.get('timestamp')).toBe(String(SIGNED_PARAMS.timestamp));
    expect(body.get('folder')).toBe(SIGNED_PARAMS.folder);
  });

  it('returns exactly the five required fields and strips extras', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(CLOUDINARY_RESPONSE), { status: 200 }),
    );
    const result = await uploadToCloudinary(makeFile('logo.png', 'image/png'), SIGNED_PARAMS);
    expect(result).toEqual(LOGO_METADATA);
    expect(result).not.toHaveProperty('bytes');
    expect(result).not.toHaveProperty('created_at');
    expect(result).not.toHaveProperty('resource_type');
  });

  it('throws with the Cloudinary error message on failure', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: { message: 'Invalid signature' } }),
        { status: 400 },
      ),
    );
    await expect(
      uploadToCloudinary(makeFile('logo.png', 'image/png'), SIGNED_PARAMS),
    ).rejects.toThrow('Invalid signature');
  });

  it('throws a fallback message when Cloudinary returns no error body', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('', { status: 500 }));
    await expect(
      uploadToCloudinary(makeFile('logo.png', 'image/png'), SIGNED_PARAMS),
    ).rejects.toThrow('Upload to Cloudinary failed. Please try again.');
  });

  it('propagates network errors', async () => {
    fetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(
      uploadToCloudinary(makeFile('logo.png', 'image/png'), SIGNED_PARAMS),
    ).rejects.toThrow('Failed to fetch');
  });
});

/* ── uploadSchoolLogo (orchestration) ────────────────────────── */

describe('uploadSchoolLogo', () => {
  const fetchSpy = vi.fn();

  beforeEach(() => {
    mockPost.mockReset();
    vi.stubGlobal('fetch', fetchSpy);
  });
  afterEach(() => { vi.unstubAllGlobals(); fetchSpy.mockReset(); });

  function setupHappyPath() {
    // Call 1 (Axios): POST /registration/drafts/branding/signature
    mockPost.mockResolvedValueOnce({ data: SIGNED_PARAMS });
    // Call 2 (fetch): POST Cloudinary /image/upload
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(CLOUDINARY_RESPONSE), { status: 200 }),
    );
    // Call 3 (Axios): POST /registration/drafts/steps/branding
    mockPost.mockResolvedValueOnce({ data: {} });
  }

  it('resolves with the five required LogoMetadata fields', async () => {
    setupHappyPath();
    const result = await uploadSchoolLogo(makeFile('logo.png', 'image/png'));
    expect(result).toEqual(LOGO_METADATA);
  });

  it('calls the signature endpoint then Cloudinary then the branding save', async () => {
    setupHappyPath();
    await uploadSchoolLogo(makeFile('logo.png', 'image/png'));

    // Axios was called twice (sign + save)
    expect(mockPost).toHaveBeenCalledTimes(2);
    expect(mockPost.mock.calls[0][0]).toBe('/registration/drafts/branding/signature');
    expect(mockPost.mock.calls[1][0]).toBe('/registration/drafts/steps/branding');

    // fetch was called once (Cloudinary)
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [cloudinaryUrl] = fetchSpy.mock.calls[0] as [string];
    expect(cloudinaryUrl).toContain('api.cloudinary.com');
  });

  it('maps snake_case Cloudinary fields to camelCase for the backend save', async () => {
    setupHappyPath();
    await uploadSchoolLogo(makeFile('logo.png', 'image/png'));

    const [, brandingPayload] = mockPost.mock.calls[1] as [string, Record<string, unknown>];
    expect(brandingPayload).toMatchObject({
      publicId:  LOGO_METADATA.public_id,
      secureUrl: LOGO_METADATA.secure_url,
      width:     LOGO_METADATA.width,
      height:    LOGO_METADATA.height,
      format:    LOGO_METADATA.format,
    });
  });

  it('uploads to the cloud_name returned by the signature endpoint', async () => {
    setupHappyPath();
    await uploadSchoolLogo(makeFile('logo.png', 'image/png'));
    const [cloudinaryUrl] = fetchSpy.mock.calls[0] as [string];
    expect(cloudinaryUrl).toContain(SIGNED_PARAMS.cloud_name);
  });

  it('throws and halts when the signature step fails', async () => {
    mockPost.mockRejectedValueOnce(new Error('Sign service error'));
    await expect(
      uploadSchoolLogo(makeFile('logo.png', 'image/png')),
    ).rejects.toThrow('Sign service error');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it('throws and halts when the Cloudinary upload fails', async () => {
    mockPost.mockResolvedValueOnce({ data: SIGNED_PARAMS });
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'Upload error' } }), { status: 400 }),
    );
    await expect(
      uploadSchoolLogo(makeFile('logo.png', 'image/png')),
    ).rejects.toThrow('Upload error');
    // Backend save must not be called
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it('throws when the backend save step fails', async () => {
    mockPost.mockResolvedValueOnce({ data: SIGNED_PARAMS });
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(CLOUDINARY_RESPONSE), { status: 200 }),
    );
    mockPost.mockRejectedValueOnce(new Error('Save failed'));
    await expect(
      uploadSchoolLogo(makeFile('logo.png', 'image/png')),
    ).rejects.toThrow('Save failed');
  });
});
