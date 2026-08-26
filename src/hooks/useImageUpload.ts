import { useState, useCallback, useRef } from "react";

import { uploadImage } from "@/lib/services/upload.service";

import type { ImageUploadResponse } from "@/components/forms/interfaces/ImageUploader.interface";

export interface UseImageUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  uploadedData: ImageUploadResponse | null;
}

export interface UseImageUploadReturn extends UseImageUploadState {
  uploadFile: (file: File) => Promise<ImageUploadResponse | null>;
  retryUpload: () => Promise<ImageUploadResponse | null>;
  clearError: () => void;
  reset: () => void;
}

/**
 * Custom React hook for managing file upload lifecycle, real-time progress,
 * error state, and retry capabilities.
 */
export function useImageUpload(onSuccess?: (url: string) => void): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedData, setUploadedData] = useState<ImageUploadResponse | null>(null);

  const lastFileRef = useRef<File | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
    setUploadedData(null);
    lastFileRef.current = null;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<ImageUploadResponse | null> => {
    lastFileRef.current = file;
    setIsUploading(true);
    setProgress(0);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await uploadImage(file, {
        onProgress: (percent) => setProgress(percent),
        signal: controller.signal,
      });

      setUploadedData(response);
      setProgress(100);
      onSuccess?.(response.url);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload image.";
      setError(message);
      return null;
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  }, [onSuccess]);

  const retryUpload = useCallback(async (): Promise<ImageUploadResponse | null> => {
    if (lastFileRef.current) {
      return uploadFile(lastFileRef.current);
    }
    return null;
  }, [uploadFile]);

  return {
    isUploading,
    progress,
    error,
    uploadedData,
    uploadFile,
    retryUpload,
    clearError,
    reset,
  };
}
