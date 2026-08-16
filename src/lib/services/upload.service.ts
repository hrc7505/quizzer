import type { ImageUploadResponse, UploadOptions } from "@/components/forms/interfaces/ImageUploader.interface";

export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
];

export const DEFAULT_MAX_SIZE_MB = 10;

/**
 * Validates file format and size constraints before dispatching to server.
 *
 * @param file The candidate File object.
 * @param maxSizeMB Maximum permitted file size in Megabytes.
 * @throws Error if constraints are violated.
 */
export function validateImageFile(file: File, maxSizeMB: number = DEFAULT_MAX_SIZE_MB): void {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Invalid format. Supported: PNG, JPG, WebP, SVG, GIF.");
  }
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`File exceeds the maximum limit of ${maxSizeMB}MB.`);
  }
}

/**
 * Uploads an image file to the backend upload endpoint using XMLHttpRequest
 * to provide fine-grained, real-time upload progress tracking.
 *
 * @param file The image File to upload.
 * @param options Optional configuration including progress callback and abort signal.
 * @returns Promise resolving to the ImageUploadResponse.
 */
export function uploadImage(file: File, options?: UploadOptions): Promise<ImageUploadResponse> {
  return new Promise((resolve, reject) => {
    try {
      validateImageFile(file);
    } catch (err) {
      return reject(err instanceof Error ? err : new Error(String(err)));
    }

    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    // Track upload progress
    xhr.upload.onprogress = (event: ProgressEvent) => {
      if (event.lengthComputable && options?.onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        options.onProgress(percent);
      }
    };

    // Handle abort signal if provided
    if (options?.signal) {
      options.signal.addEventListener("abort", () => {
        xhr.abort();
        reject(new Error("Upload aborted by user"));
      });
    }

    xhr.onload = () => {
      let data: ImageUploadResponse;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        return reject(new Error(`Server error (${xhr.status}). Failed to parse upload response.`));
      }

      if (xhr.status >= 200 && xhr.status < 300 && data.success) {
        if (options?.onProgress) {
          options.onProgress(100);
        }
        resolve(data);
      } else {
        reject(new Error(data.error || `Upload failed with status ${xhr.status}.`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network connection error during upload. Please check your connection and retry."));
    };

    xhr.ontimeout = () => {
      reject(new Error("Upload request timed out. Please try again."));
    };

    xhr.open("POST", "/api/admin/upload", true);
    xhr.send(formData);
  });
}
