/**
 * Shared formatting, sanitization, and text processing utilities.
 */

// ==========================================
// Precompiled Regular Expressions
// ==========================================

const NULL_BYTE_REGEX = /\0/g;
const NULL_BYTE_UNICODE_REGEX = /\u0000/g;
const NULL_BYTE_LITERAL_REGEX = /\\u0000/g;

const FILE_EXT_NOISE_REGEX = /\[\s*(png|jpg|jpeg|gif|bmp|webp|svg)\s*\]/gi;
const SAFE_RELATIVE_PATH_REGEX = /^\/[a-zA-Z0-9_\-./%]+$/;
const SAFE_DATA_IMAGE_REGEX = /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,[a-zA-Z0-9+/=]+$/i;

const LATEX_FRAC_REGEX = /\\frac(?=[{\s])/g;
const LATEX_BRACKET_BLOCK_REGEX = /\\\[([\s\S]*?)\\\]/g;
const LATEX_PAREN_INLINE_REGEX = /\\\(([\s\S]*?)\\\)/g;
const CODE_FENCE_BLOCK_REGEX = /```[\s\S]*?```/;

const CODE_SIGNATURES: Array<{ lang: string; pattern: RegExp }> = [
  {
    lang: "c",
    pattern: /(?:#\s*include\s*<[^>]+>|int\s+main\s*\([^)]*\)|void\s+main\s*\([^)]*\)|void\s*\*?\w+\s*=|printf\s*\(\s*"|scanf\s*\(\s*"|#\s*define\s+\w+)/,
  },
  {
    lang: "cpp",
    pattern: /(?:#\s*include\s*<iostream>|std::cout|std::cin|cout\s*<<|cin\s*>>|namespace\s+\w+|template\s*<)/,
  },
  {
    lang: "java",
    pattern: /(?:public\s+class\s+\w+|public\s+static\s+void\s+main|System\.out\.print(?:ln)?)/,
  },
  {
    lang: "python",
    pattern: /(?:def\s+\w+\s*\([^)]*\)\s*:|import\s+\w+|from\s+\w+\s+import\s+\w+|if\s+__name__\s*==\s*['"]__main__['"])/,
  },
  {
    lang: "sql",
    pattern: /(?:SELECT\s+.+\s+FROM\s+\w+|CREATE\s+TABLE\s+\w+|INSERT\s+INTO\s+\w+|ALTER\s+TABLE\s+\w+)/i,
  },
  {
    lang: "html",
    pattern: /(?:<!DOCTYPE\s+html>|<html(?:\s+[^>]*)?>[\s\S]*<\/html>|<div(?:\s+[^>]*)?>[\s\S]*<\/div>)/i,
  },
];

const CODE_SEGMENTS_SPLIT_REGEX = /(`+[^`]+`+)/g;
const C_DECLARATION_REGEX = /(?<![A-Za-z0-9_`])((?:const\s+|static\s+|volatile\s+)?(?:int|char|float|double|void|long|short|unsigned|signed|bool|size_t|struct\s+\w+)\s+(?:\*|\(\s*\*|[a-zA-Z_])[a-zA-Z0-9_\s*()[\],]*;)/g;
const FUNCTION_CALL_REGEX = /(?<![A-Za-z0-9_`])((?:printf|scanf|sizeof|malloc|calloc|free|strlen|strcpy)\s*\([^)\n]*\))/g;
const POINTER_TYPE_REGEX = /(?<![A-Za-z0-9_`])((?:int|char|float|double|void|long|short|unsigned)\s*\*(?:\s*\*)*)(?![A-Za-z0-9_`])/g;

const MATH_SEGMENTS_SPLIT_REGEX = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+\$|`+[^`]+`+)/g;
const OCR_PROPORTIONAL_REGEX = /\b([a-zA-Z])\s*(?:\\propto|∝)\s*(\d+)\b/g;
const PAREN_INEQUALITY_REGEX = /(?<![$\w`])\(\s*([a-zA-Z])\s*(?:\\ge|\\le|\\geq|\\leq|>=|<=|>|<|!=|==)\s*(\d+)\s*\)(?![$\w`])/g;
const STANDALONE_INEQUALITY_REGEX = /(?<![$\w`])\b([a-zA-Z])\s*(?:\\ge|\\le|\\geq|\\leq|>=|<=)\s*(\d+)\b(?![$\w`])/g;
const CARET_EXPRESSION_REGEX = /(?<![$\w`])(\d*\([a-zA-Z0-9\s+\-*/]*\^[a-zA-Z0-9\s+\-*/]*\)\b|\b[a-zA-Z0-9]+\^[a-zA-Z0-9{}]+(?:\s*[+\-*/]\s*\d+)?)(?![$\w`])/g;
const GREEK_LATEX_COMMAND_REGEX = /(?<![$\w`])(\\(?:theta|alpha|beta|gamma|delta|lambda|sigma|omega|Omega|Theta|infty|sqrt|log|ln|sin|cos|tan)\b(?:\s*[({[].*?[)}\]])?)(?![$\w`])/g;

/**
 * Maps a difficulty level to a Badge variant.
 *
 * @param difficulty The difficulty string (e.g. "Easy", "Medium", "Hard").
 * @returns The matching badge variant.
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
  return text
    .replace(NULL_BYTE_REGEX, "")
    .replace(NULL_BYTE_UNICODE_REGEX, "")
    .replace(NULL_BYTE_LITERAL_REGEX, "");
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
  return stripNullBytes(text)
    .replace(FILE_EXT_NOISE_REGEX, "")
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
    if (SAFE_RELATIVE_PATH_REGEX.test(trimmed)) {
      return encodeURI(trimmed);
    }
  }

  // Allow safe data:image base64
  if (SAFE_DATA_IMAGE_REGEX.test(trimmed)) {
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

/**
 * Normalizes LaTeX expressions to standard display math delimiters ($$, $)
 * and converts `\frac` to full-height `\dfrac` for clear rendering.
 *
 * @param text Raw LaTeX/markdown text.
 * @returns Text with normalized LaTeX delimiters.
 */
export function normalizeMathDelimiters(text: string): string {
  if (!text) return "";
  let out = text
    .replace(LATEX_FRAC_REGEX, "\\dfrac")
    .replace(LATEX_BRACKET_BLOCK_REGEX, "\n$$\n$1\n$$\n")
    .replace(LATEX_PAREN_INLINE_REGEX, "$$$1$$");

  // Normalize Unicode dashes (en-dash, em-dash, minus sign) to standard ASCII minus (-) inside math mode
  out = out.replace(/(\$\$[\s\S]*?\$\$|\$[^\$\n]+\$)/g, (math) => {
    return math.replace(/[\u2013\u2014\u2212–—−]/g, "-");
  });

  return out;
}

/**
 * Automatically detects unfenced programming code snippets and mathematical formulas
 * in question text, converting them into standard Markdown code blocks or LaTeX formulas.
 *
 * @param rawText The raw question, statement, or option text.
 * @returns Cleaned text with Markdown code fences and normalized LaTeX delimiters.
 */
export function autoFormatCodeAndMath(rawText: string): string {
  if (!rawText) return "";

  let text = rawText.trim();

  // 1. Normalize LaTeX expressions
  text = normalizeMathDelimiters(text);

  // 2. If text already has fenced code blocks (``` ... ```), return formatted text directly
  if (CODE_FENCE_BLOCK_REGEX.test(text)) {
    return text;
  }

  // 3. Pattern detection for un-fenced programming code blocks
  for (const sig of CODE_SIGNATURES) {
    const match = sig.pattern.exec(text);
    if (match && match.index !== undefined) {
      // Check if there is an introductory premise before the code
      const pre = text.slice(0, match.index);

      // Find the last sentence end or colon before the code start if pre contains text
      const colonIdx = pre.lastIndexOf(":");
      const newlineIdx = pre.lastIndexOf("\n");

      let splitPoint = match.index;
      if (colonIdx !== -1 && colonIdx > pre.length - 40) {
        splitPoint = colonIdx + 1;
      } else if (newlineIdx !== -1) {
        splitPoint = newlineIdx + 1;
      }

      const premise = text.slice(0, splitPoint).trim();
      const codeSnippet = text.slice(splitPoint).trim();

      if (codeSnippet.length > 0) {
        return premise ? `${premise}\n\n\`\`\`${sig.lang}\n${codeSnippet}\n\`\`\`` : `\`\`\`${sig.lang}\n${codeSnippet}\n\`\`\``;
      }
    }
  }

  // 4. Detect and wrap inline code declarations & expressions in backticks
  const codeSegments = text.split(CODE_SEGMENTS_SPLIT_REGEX);
  text = codeSegments
    .map((seg, i) => {
      // Skip already backticked segments
      if (i % 2 === 1) return seg;

      let processed = seg;

      // C/C++/Java declarations with semicolons: e.g. int *f( ); or char (*(*x( )))( ); or int a;
      processed = processed.replace(C_DECLARATION_REGEX, "`$1`");

      // Function calls: printf(...), scanf(...), sizeof(...), malloc(...)
      processed = processed.replace(FUNCTION_CALL_REGEX, "`$1`");

      // Pointer types: "int *", "char *", "void *"
      processed = processed.replace(POINTER_TYPE_REGEX, "`$1`");

      return processed;
    })
    .join("");

  // 5. Detect and wrap mathematical expressions (exponents, inequalities, greek symbols) in $...$
  const mathSegments = text.split(MATH_SEGMENTS_SPLIT_REGEX);
  text = mathSegments
    .map((seg, i) => {
      // Skip segments already wrapped in math ($) or code (`)
      if (i % 2 === 1) return seg;

      let processed = seg;

      // Fix common OCR misrecognitions: "n \propto 2" or "n ∝ 2" -> "n \ge 2"
      processed = processed.replace(OCR_PROPORTIONAL_REGEX, "$1 \\ge $2");

      // Wrap parenthesized inequalities: e.g. (n >= 2), (n \ge 2) -> ($n \ge 2$)
      processed = processed.replace(PAREN_INEQUALITY_REGEX, (_match, variable, num) => {
        return `($${variable} \\ge ${num}$)`;
      });

      // Standalone inequalities without parens: e.g. n >= 2 -> $n \ge 2$
      processed = processed.replace(STANDALONE_INEQUALITY_REGEX, (_match, variable, num) => {
        return `$${variable} \\ge ${num}$`;
      });

      // Complex expressions with exponents like 2(2^n - 2), (2^n - 1), 2^n - 1, 2^n - 2, 2^{n+1}, x^2
      processed = processed.replace(CARET_EXPRESSION_REGEX, (_match, expr) => {
        return `$${expr.trim()}$`;
      });

      // Wrap standalone Greek or LaTeX math commands (e.g. \theta(n+e), \Omega(n), \log n, \sqrt{n})
      processed = processed.replace(GREEK_LATEX_COMMAND_REGEX, (_match, expr) => {
        return `$${expr.trim()}$`;
      });

      return processed;
    })
    .join("");

  return text;
}

const PAIR_LOOKAHEAD_SPLIT_REGEX = /[,;\s]+(?=[a-dA-D1-9]\s*[-–—→>])/;
const COMMA_SPLIT_REGEX = /\s*,\s*/;
const MATCHING_PAIR_TEST_REGEX = /^[(\[]?[a-dA-D1-9][)\]]?\s*[-–—→>:=]\s*[(\[]?[a-dA-D1-9ivxIVX]+[)\]]?$/;
const MATCHING_PAIR_CAPTURE_REGEX = /^([(\[]?[a-dA-D1-9][)\]]?)\s*[-–—→>:=]\s*([(\[]?[a-dA-D1-9ivxIVX]+[)\]]?)$/;
const BRACKET_STRIP_REGEX = /[()[\]]/g;

/**
 * Checks if a string contains pair-matching options (e.g. "a-3, b-1, c-2, d-4" or "A->3, B->1")
 * and extracts cleanly structured left/right pairs.
 *
 * @param text The candidate option text string.
 * @returns Array of structured pairs or null if not a matching format.
 */
export function parseMatchingPairs(text: string): Array<{ left: string; right: string }> | null {
  if (!text) return null;
  const trimmed = text.trim();

  // Split on pair boundary lookahead
  const parts = trimmed.split(PAIR_LOOKAHEAD_SPLIT_REGEX).map((p) => p.trim()).filter(Boolean);

  if (parts.length < 2) {
    // Try comma-separated split
    const commaParts = trimmed.split(COMMA_SPLIT_REGEX);
    if (commaParts.length >= 2 && commaParts.every((p) => MATCHING_PAIR_TEST_REGEX.test(p.trim()))) {
      return commaParts.map((p) => {
        const match = p.match(MATCHING_PAIR_CAPTURE_REGEX);
        return {
          left: match ? match[1].replace(BRACKET_STRIP_REGEX, "").trim() : p,
          right: match ? match[2].replace(BRACKET_STRIP_REGEX, "").trim() : "",
        };
      });
    }
    return null;
  }

  const pairs: Array<{ left: string; right: string }> = [];
  for (const part of parts) {
    const match = part.match(MATCHING_PAIR_CAPTURE_REGEX);
    if (match) {
      pairs.push({
        left: match[1].replace(BRACKET_STRIP_REGEX, "").trim(),
        right: match[2].replace(BRACKET_STRIP_REGEX, "").trim(),
      });
    } else {
      return null;
    }
  }

  return pairs.length >= 2 ? pairs : null;
}
