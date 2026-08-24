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

  // Normalize LaTeX expressions
  text = text.replace(/\\frac(?=[{\s])/g, "\\dfrac");
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, "\n$$\n$1\n$$\n");
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, "$$$1$$");

  // If text already has fenced code blocks (``` ... ```), return formatted text directly
  if (/```[\s\S]*?```/.test(text)) {
    return text;
  }

  // Pattern detection for un-fenced programming code
  const codeSignatures: Array<{ lang: string; pattern: RegExp }> = [
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

  for (const sig of codeSignatures) {
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

  // Detect and wrap inline code declarations & expressions in backticks
  const codeSegments = text.split(/(`+[^`]+`+)/g);
  text = codeSegments
    .map((seg, i) => {
      // Skip already backticked segments
      if (i % 2 === 1) return seg;

      let processed = seg;

      // 1. C/C++/Java declarations with semicolons: e.g. int *f( ); or char (*(*x( )))( ); or int a;
      processed = processed.replace(
        /(?<![A-Za-z0-9_`])((?:const\s+|static\s+|volatile\s+)?(?:int|char|float|double|void|long|short|unsigned|signed|bool|size_t|struct\s+\w+)\s+(?:\*|\(\s*\*|[a-zA-Z_])[\w\s\*\(\)\[\],]*;)/g,
        "`$1`"
      );

      // 2. Function calls or pointer syntax: printf(...), scanf(...), sizeof(...), malloc(...)
      processed = processed.replace(
        /(?<![A-Za-z0-9_`])((?:printf|scanf|sizeof|malloc|calloc|free|strlen|strcpy)\s*\([^)]*\))/g,
        "`$1`"
      );

      // 3. Pointer types: "int *", "char *", "void *"
      processed = processed.replace(
        /(?<![A-Za-z0-9_`])((?:int|char|float|double|void|long|short|unsigned)\s*\*(?:\s*\*)*)(?![A-Za-z0-9_`])/g,
        "`$1`"
      );

      return processed;
    })
    .join("");

  // Detect and wrap mathematical expressions (exponents, inequalities, greek symbols) in $...$
  const mathSegments = text.split(/(\$\$[\s\S]*?\$\$|\$[^\$\n]+\$|`+[^`]+`+)/g);
  text = mathSegments
    .map((seg, i) => {
      // Skip segments already wrapped in math ($) or code (`)
      if (i % 2 === 1) return seg;

      let processed = seg;

      // 1. Fix common OCR misrecognitions: "n \propto 2" or "n ∝ 2" -> "n \ge 2"
      processed = processed.replace(/\b([a-zA-Z])\s*(?:\\propto|∝)\s*(\d+)\b/g, "$1 \\ge $2");

      // 2. Wrap parenthesized inequalities: e.g. (n >= 2), (n \ge 2) -> ($n \ge 2$)
      processed = processed.replace(
        /(?<![$\w`])\(\s*([a-zA-Z])\s*(?:\\ge|\\le|\\geq|\\leq|>=|<=|>|<|!=|==)\s*(\d+)\s*\)(?![$\w`])/g,
        (_match, variable, num) => {
          return `($${variable} \\ge ${num}$)`;
        }
      );

      // 3. Standalone inequalities without parens: e.g. n >= 2 -> $n \ge 2$
      processed = processed.replace(
        /(?<![$\w`])\b([a-zA-Z])\s*(?:\\ge|\\le|\\geq|\\leq|>=|<=)\s*(\d+)\b(?![$\w`])/g,
        (_match, variable, num) => {
          return `$${variable} \\ge ${num}$`;
        }
      );

      // 4. Complex expressions with exponents like 2(2^n - 2), (2^n - 1), 2^n - 1, 2^n - 2, 2^{n+1}, x^2
      // MUST contain a caret (^) to ensure general English parentheticals like "(also known as...)" are never matched
      processed = processed.replace(
        /(?<![$\w`])(\d*\([a-zA-Z0-9\s\+\-\*\/]*\^[a-zA-Z0-9\s\+\-\*\/]*\)\b|\b[a-zA-Z0-9]+\^[a-zA-Z0-9\{\}]+(?:\s*[\+\-\*\/]\s*\d+)?)(?![$\w`])/g,
        (_match, expr) => {
          return `$${expr.trim()}$`;
        }
      );

      // 5. Wrap standalone Greek or LaTeX math commands (e.g. \theta(n+e), \Omega(n), \log n, \sqrt{n})
      processed = processed.replace(
        /(?<![$\w`])(\\(?:theta|alpha|beta|gamma|delta|lambda|sigma|omega|Omega|Theta|infty|sqrt|log|ln|sin|cos|tan)\b(?:\s*[\(\{\[].*?[\)\}\]])?)(?![$\w`])/g,
        (_match, expr) => {
          return `$${expr.trim()}$`;
        }
      );

      return processed;
    })
    .join("");

  return text;
}



