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
 * Strips bracketed file extension noise like [png], [jpg] from question text.
 */
export function sanitizeQuestionText(text?: string | null): string {
  if (!text) return "";
  return text
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
