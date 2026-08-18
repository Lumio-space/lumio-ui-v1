/**
 * Shared Cloudinary types
 *
 * These types are the frontend contract for the Cloudinary direct-upload
 * flow and are intentionally decoupled from any specific feature (onboarding,
 * student avatars, teacher avatars, etc.).
 *
 * Field names follow the frontend camelCase convention. The upload services
 * in each feature are responsible for converting to/from Cloudinary's
 * snake_case field names internally.
 */

/** Metadata returned after a successful Cloudinary upload. */
export interface UploadedImageMetadata {
  publicId:  string;
  secureUrl: string;
  width:     number;
  height:    number;
  format:    string;
}

/** Configuration used to validate a candidate image before upload. */
export interface ImageValidationConfig {
  /** Maximum permitted file size in bytes. */
  maxBytes:          number;
  /** Human-readable label for the maximum size (e.g. "5 MB"). */
  maxLabel:          string;
  /** Accepted MIME types (e.g. "image/png"). */
  allowedMimeTypes:  ReadonlySet<string>;
  /** Accepted file extensions without the leading dot (e.g. "png"). */
  allowedExtensions: ReadonlySet<string>;
}

/** Result of a file validation check. */
export type ImageValidationResult =
  | { valid: true  }
  | { valid: false; message: string };

/**
 * Default validation config: 5 MB limit, PNG / JPG / SVG / WebP accepted.
 * Override individual fields via the `ImageUpload` component props when
 * different constraints are needed.
 */
export const DEFAULT_IMAGE_VALIDATION: ImageValidationConfig = {
  maxBytes:  5 * 1024 * 1024,
  maxLabel:  '5 MB',
  allowedMimeTypes: new Set([
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/svg+xml',
    'image/webp',
  ]),
  allowedExtensions: new Set(['png', 'jpg', 'jpeg', 'svg', 'webp']),
} as const;
