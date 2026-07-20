import { requestBrandingSignature, saveBranding } from '../api/registration.api';
import { uploadToCloudinary }                      from './logo.cloudinary';
import type { LogoMetadata }                       from '../types';

/**
 * Upload a school logo using the signed Cloudinary flow.
 *
 * @returns The five LogoMetadata fields — use `secure_url` for the preview
 *          and `public_id` to identify the asset later.
 * @throws  An Error with a human-readable message if any step fails.
 */
export async function uploadSchoolLogo(file: File): Promise<LogoMetadata> {
  // Step 1 — obtain signed upload parameters from the backend
  const params = await requestBrandingSignature();

  // Step 2 — upload directly to Cloudinary (bypasses the app backend)
  const metadata = await uploadToCloudinary(file, params);

  // Step 3 — send the five metadata fields to the backend
  // The backend expects camelCase: publicId, secureUrl
  await saveBranding({
    publicId:  metadata.public_id,
    secureUrl: metadata.secure_url,
    width:     metadata.width,
    height:    metadata.height,
    format:    metadata.format,
  });

  return metadata;
}
