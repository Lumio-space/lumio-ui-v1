export const LOGO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const LOGO_MAX_LABEL = '5 MB';

export const LOGO_ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
  'image/webp',
]);

export const LOGO_ALLOWED_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'svg', 'webp',
]);

export interface ValidationResult { valid: true;  message?: never; }
export interface ValidationError  { valid: false; message: string; }

/**
 * Validate a File before uploading.
 * Returns `{ valid: true }` on success or `{ valid: false, message }` on
 * the first failure.
 */
export function validateLogoFile(file: File): ValidationResult | ValidationError {
  if (!LOGO_ALLOWED_TYPES.has(file.type)) {
    return {
      valid:   false,
      message: 'Invalid file type. Accepted formats: PNG, JPG, JPEG, SVG, WebP.',
    };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!LOGO_ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid:   false,
      message: 'Invalid file extension. Accepted formats: PNG, JPG, JPEG, SVG, WebP.',
    };
  }

  if (file.size > LOGO_MAX_BYTES) {
    return {
      valid:   false,
      message: `Logo must be smaller than ${LOGO_MAX_LABEL}.`,
    };
  }

  return { valid: true };
}
