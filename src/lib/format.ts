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
