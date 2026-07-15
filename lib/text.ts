/**
 * Split text into sentences without breaking on periods that are part of
 * a token — e.g. filenames ("image.png"), decimals ("3.14") or
 * abbreviations ("e.g.", "i.e."). Uses the Unicode sentence
 * segmenter when available (it already yields one item per sentence),
 * with a regex fallback that only treats a period as a boundary when
 * it is followed by whitespace AND a new sentence-like character
 * (uppercase letter, quote or parenthesis).
 */
export function splitSentences(text: string): string[] {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return [];

  const Segmenter = (Intl as unknown as { Segmenter?: new (locale?: string, options?: { granularity: string }) => Iterable<{ segment: string }> }).Segmenter;

  if (typeof Segmenter === "function") {
    try {
      const segmenter = new Segmenter("en", { granularity: "sentence" });
      const out: string[] = [];
      for (const item of segmenter) {
        const s = item.segment.trim();
        if (s) out.push(s);
      }
      if (out.length) return out;
    } catch {
      // fall through to regex
    }
  }

  return trimmed
    .split(/(?<=[.?!])\s+(?=[A-Z("'])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
