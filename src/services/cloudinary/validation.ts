import {
  DEFAULT_IMAGE_VALIDATION,
  type ImageValidationConfig,
  type ImageValidationResult,
} from './types';

/**
 * Validate a File against the supplied config before initiating an upload.
 *
 * Checks in order:
 *   1. MIME type
 *   2. File extension (guards against mismatched type + extension)
 *   3. File size
 *
 * Returns `{ valid: true }` on success or `{ valid: false, message }` on the
 * first failure so callers can display a single, actionable error at a time.
 *
 * @example
 * const result = validateImageFile(file);
 * if (!result.valid) throw new Error(result.message);
 */
export function validateImageFile(
  file:   File,
  config: ImageValidationConfig = DEFAULT_IMAGE_VALIDATION,
): ImageValidationResult {
  if (!config.allowedMimeTypes.has(file.type)) {
    const types = [...config.allowedMimeTypes]
      .map((t) => t.split('/')[1].toUpperCase())
      .join(', ');
    return {
      valid:   false,
      message: `Invalid file type. Accepted formats: ${types}.`,
    };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!config.allowedExtensions.has(ext)) {
    const exts = [...config.allowedExtensions].map((e) => e.toUpperCase()).join(', ');
    return {
      valid:   false,
      message: `Invalid file extension. Accepted formats: ${exts}.`,
    };
  }

  if (file.size > config.maxBytes) {
    return {
      valid:   false,
      message: `Image must be smaller than ${config.maxLabel}.`,
    };
  }

  return { valid: true };
}
