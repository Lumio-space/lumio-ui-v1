'use client';

import { useMutation }     from '@tanstack/react-query';
import { uploadSchoolLogo } from '../services/logo.upload';

/**
 * useBranding
 *
 * React Query mutation that orchestrates the full three-step logo
 * upload flow (sign → Cloudinary upload → backend save).
 *
 * Returns `{ mutate, isPending, error, data }` — `isPending` replaces
 * the manual `isUploading` state previously used in BrandingStep.
 */
export function useBranding() {
  return useMutation({
    mutationFn: (file: File) => uploadSchoolLogo(file),
  });
}
