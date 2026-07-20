import type { BrandingSignatureResponse, LogoMetadata, CloudinaryUploadResponse } from '../types';


export async function uploadToCloudinary(
  file:   File,
  params: BrandingSignatureResponse,
): Promise<LogoMetadata> {
  const formData = new FormData();
  formData.append('file',      file);
  formData.append('api_key',   params.api_key);
  formData.append('signature', params.signature);
  formData.append('timestamp', String(params.timestamp));
  formData.append('folder',    params.folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${params.cloud_name}/image/upload`,
    { method: 'POST', body: formData },
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as {
      error?: { message?: string };
    };
    throw new Error(
      body.error?.message ?? 'Upload to Cloudinary failed. Please try again.',
    );
  }

  const data = await response.json() as CloudinaryUploadResponse;

  // Extract only the five required fields — discard all Cloudinary extras.
  return {
    public_id:  data.public_id,
    secure_url: data.secure_url,
    width:      data.width,
    height:     data.height,
    format:     data.format,
  };
}
