/**
 * Represents the response payload returned by the image upload API.
 */
export interface ImageUploadResponse {
  success: boolean;
  url: string;
  publicId?: string;
  format?: string;
  width?: number;
  height?: number;
  error?: string;
}

/**
 * Options for triggering an image upload operation.
 */
export interface UploadOptions {
  /** Callback fired as bytes are transferred (0 to 100). */
  onProgress?: (percent: number) => void;
  /** Optional AbortSignal to cancel the in-flight upload. */
  signal?: AbortSignal;
}

/**
 * Props for the reusable ImageUploader form component.
 */
export interface ImageUploaderProps {
  /** Current image URL string. */
  value?: string | null;
  /** Callback fired when an image URL is updated or cleared. */
  onChange: (url: string) => void;
  /** Whether the image should invert colors in dark mode. */
  invertInDark?: boolean;
  /** Callback fired when the dark mode inversion toggle changes. */
  onInvertInDarkChange?: (invert: boolean) => void;
  /** Whether to render the dark mode inversion toggle. Defaults to true. */
  showInvertToggle?: boolean;
  /** Custom label displayed at the top of the upload zone. */
  label?: string;
  /** Custom helper text for the dark mode toggle. */
  invertHelperText?: string;
  /** Maximum allowed file size in Megabytes. Defaults to 10. */
  maxSizeMB?: number;
  /** Optional custom container CSS classes. */
  className?: string;
  /** Whether the parent form or component is in a loading/disabled state. */
  disabled?: boolean;
}
