'use client';

/**
 * useImageUpload
 *
 * A generic, reusable hook for any image-upload use case in the application
 * (school logo, student avatars, teacher avatars, announcements, etc.).
 *
 * It wraps React Query's useMutation with a stable interface so each
 * feature only needs to supply its own `uploadFn` — the orchestration,
 * loading state, and error handling are all handled here.
 *
 * Usage
 * ─────
 * const { upload, reset, isPending, isError, error, data } =
 *   useImageUpload((file) => uploadSchoolLogo(file).then(toMetadata));
 *
 * @param uploadFn  Async function that accepts a File and resolves with
 *                  UploadedImageMetadata. Provided by the calling feature.
 */

import { useCallback }     from 'react';
import { useMutation }     from '@tanstack/react-query';
import type { UploadedImageMetadata } from '@/services/cloudinary';

export interface UseImageUploadReturn {
  /** Initiate an upload for the given file. */
  upload:    (file: File) => void;
  /** Reset the mutation state (clears error and result). */
  reset:     () => void;
  isPending: boolean;
  isSuccess: boolean;
  isError:   boolean;
  error:     Error | null;
  /** The metadata returned after a successful upload. */
  data:      UploadedImageMetadata | undefined;
}

export function useImageUpload(
  uploadFn: (file: File) => Promise<UploadedImageMetadata>,
): UseImageUploadReturn {
  const mutation = useMutation<UploadedImageMetadata, Error, File>({
    mutationFn: uploadFn,
  });

  const upload = useCallback(
    (file: File) => { mutation.mutate(file); },
    [mutation],
  );

  return {
    upload,
    reset:     mutation.reset,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError:   mutation.isError,
    error:     mutation.error,
    data:      mutation.data,
  };
}
