/**
 * Shared formatting and sanitization utilities.
 */

/**
 * Maps a difficulty level to a Badge variant.
 */
export function difficultyColor(difficulty: string): "success" | "warning" | "danger" | "secondary" {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return "success";
    case "medium":
      return "warning";
    case "hard":
      return "danger";
    default:
      return "secondary";
  }
}

/**
 * Strips null bytes (\u0000 / 0x00) and other invalid PostgreSQL UTF-8 control characters from a string.
 * PostgreSQL rejects \u0000 in TEXT/VARCHAR fields because C-strings are null-terminated.
 *
 * @param text The input string to sanitize.
 * @returns The sanitized string with null bytes removed.
 */
export function stripNullBytes(text?: string | null): string {
  if (!text || typeof text !== "string") return "";
  return text.replace(/\0/g, "").replace(/\u0000/g, "").replace(/\\u0000/g, "");
}

/**
 * Recursively strips null bytes from objects, arrays, and strings.
 *
 * @param value The value (string, object, array, etc.) to sanitize.
 * @returns The sanitized structure with all string null bytes stripped.
 */
export function sanitizeNullBytes<T>(value: T): T {
  if (typeof value === "string") {
    return stripNullBytes(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeNullBytes(item)) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      cleaned[k] = sanitizeNullBytes(v);
    }
    return cleaned as T;
  }
  return value;
}

/**
 * Strips bracketed file extension noise like [png], [jpg] and null bytes from question text.
 *
 * @param text Candidate question text.
 * @returns Cleaned question text string.
 */
export function sanitizeQuestionText(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(/\0/g, "")
    .replace(/\u0000/g, "")
    .replace(/\\u0000/g, "")
    .replace(/\[\s*(png|jpg|jpeg|gif|bmp|webp|svg)\s*\]/gi, "")
    .trim();
}

export const sanitizeImageText = sanitizeQuestionText;

/**
 * Sanitizes and validates image URLs to prevent DOM XSS and injection vulnerabilities.
 * Strictly verifies protocols and allows only valid HTTP/HTTPS URLs, safe relative paths,
 * or safe data:image/ base64 payloads.
 *
 * @param url Candidate URL string.
 * @returns Sanitized URL string or empty string if invalid/unsafe.
 */
export function sanitizeImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();

  // Allow safe relative paths (e.g. /uploads/image.png)
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes("\\")) {
    if (/^\/[a-zA-Z0-9_\-./%]+$/.test(trimmed)) {
      return encodeURI(trimmed);
    }
  }

  // Allow safe data:image base64
  if (/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,[a-zA-Z0-9+/=]+$/i.test(trimmed)) {
    return trimmed;
  }

  // Validate absolute URL via URL constructor
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
  } catch {
    return "";
  }

  return "";
}
