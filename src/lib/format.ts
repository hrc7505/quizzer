/**
 * Shared UI helper: maps a quiz difficulty label to a semantic Badge token.
 * Centralized so every admin/public surface renders consistent colors.
 */
export type DifficultyTone = "success" | "warning" | "danger";

export function difficultyColor(difficulty: string): DifficultyTone {
  const normalized = difficulty.toLowerCase();
  if (normalized === "easy") return "success";
  if (normalized === "hard") return "danger";
  return "warning";
}

/**
 * Remove image references and visual-only tokens from source text so the AI
 * model is not asked to reason about documents it cannot see. Shared by the
 * quiz generator and the elaboration endpoint to avoid divergent sanitizers.
 */
export function sanitizeImageText(text: string): string {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[.*?\]\(.*?\.(png|jpg|jpeg|gif|bmp|webp|svg).*?\)/gi, "")
    .replace(/data:image\/[a-zA-Z]+;base64,[a-zA-Z0-9+/=\s]+/gi, "")
    .replace(/\b(image|img|figure|photo|picture)\d*\s*(\.\s*(png|jpg|jpeg|gif|bmp|webp|svg))?\b/gi, "")
    .replace(/\b(image|img|figure|photo|picture)[\w-]*\.(png|jpg|jpeg|gif|bmp|webp|svg)\b/gi, "")
    .replace(/\b\d+\.(png|jpg|jpeg|gif|bmp|webp|svg)\b/gi, "")
    .replace(/\b(image|img|figure|photo|picture)\d*\b/gi, "")
    .replace(/\b\w+\.(png|jpg|jpeg|gif|bmp|webp|svg)\b/gi, "")
    .replace(/\(\s*(png|jpg|jpeg|gif|bmp|webp|svg)\s*\)/gi, "")
    .replace(/\[\s*(png|jpg|jpeg|gif|bmp|webp|svg)\s*\]/gi, "")
    .trim();
}

/**
 * Sanitizes and validates image URLs to prevent DOM XSS (e.g., javascript: or data:text/html schemes).
 * Only allows trusted HTTP/HTTPS protocols, relative paths, or safe data:image/ URIs.
 *
 * @param url Candidate URL string.
 * @returns Sanitized URL string or empty string if invalid/unsafe.
 */
export function sanitizeImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();

  // Block dangerous pseudo-protocols like javascript:, vbscript:, data:text/html, etc.
  if (/^(javascript|vbscript|data(?!:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,)):/i.test(trimmed)) {
    return "";
  }

  // Safe schemes: https://, http://, relative /paths, or safe data:image/ base64
  if (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("/") ||
    /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,[a-zA-Z0-9+/=]+$/i.test(trimmed)
  ) {
    return trimmed;
  }

  return "";
}

