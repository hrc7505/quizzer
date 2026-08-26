/**
 * Ultra-fast, vector-crisp PDF Booklet and Print engine for Quizzer.
 * Renders flawless Gujarati & Hindi complex text shaping (જોડાક્ષર, માત્રા) and KaTeX math formulas.
 * Paginates questions safely into A4 sheets with centered Watermark, Header, and 3-column Footer with exact 'Page N of M'.
 */

import katex from "katex";

export interface PDFQuestion {
  text: string;
  secondaryText?: string | null;
  secondaryLanguage?: string | null;
  imageUrl?: string | null;
  options: string[];
  secondaryOptions?: string[];
  correctAnswer: string;
  secondaryCorrectAnswer?: string | null;
  description?: string | null;
  secondaryDescription?: string | null;
  hint?: string | null;
  language?: string | null;
}

export interface PDFQuiz {
  title: string;
  language?: string | null;
  isBilingual?: boolean;
  questions: PDFQuestion[];
}

/**
 * Converts Markdown text and LaTeX math formulas into HTML with real KaTeX typography.
 */
export function renderMarkdownAndMathToHtml(text?: string | null): string {
  if (!text) return "";

  let processed = text;

  // Clean trailing stray '<' or '>' characters
  processed = processed.replace(/^\s*[<>]\s*$/gm, "");
  processed = processed.replace(/([A-Za-z0-9}\]])\s*[<>](?=\s*(\n|$))/g, "$1");
  processed = processed.replace(/[<>](?=\s*$)/g, "");

  // 1. Render Block Math: $$ ... $$ or \[ ... \]
  processed = processed.replace(/(?:\$\$|\\\[)([\s\S]*?)(?:\$\$|\\\])/g, (_, math) => {
    try {
      if (/[\u0A80-\u0AFF\u0900-\u097F]/.test(math)) {
        return `<div class="katex-block" style="margin: 4px 0; text-align: center; overflow-x: auto; background: transparent;">${math}</div>`;
      }
      const rendered = katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false,
        strict: "ignore",
      });
      return `<div class="katex-block" style="margin: 4px 0; text-align: center; overflow-x: auto; background: transparent;">${rendered}</div>`;
    } catch {
      return math;
    }
  });

  // 2. Render Inline Math: $ ... $ or \( ... \)
  processed = processed.replace(/(?:\$|\\\()((?:\\\$|[^\$\n])+?)(?:\$|\\\))/g, (_, math) => {
    try {
      if (/[\u0A80-\u0AFF\u0900-\u097F]/.test(math)) {
        return math;
      }
      const rendered = katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false,
        strict: "ignore",
      });
      return `<span class="katex-inline" style="display: inline-block; vertical-align: middle; padding: 0 1px; background: transparent;">${rendered}</span>`;
    } catch {
      return math;
    }
  });

  // 3. Format code blocks (```...```)
  processed = processed.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, _lang, code) => {
    return `<pre style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px 8px; font-family: ui-monospace, monospace; font-size: 11px; margin: 3px 0; overflow-x: auto; color: #0f172a; white-space: pre-wrap; background: transparent;"><code>${code.trim()}</code></pre>`;
  });

  // 4. Format bold, italic, inline code
  processed = processed.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  processed = processed.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  processed = processed.replace(
    /`([^`]+)`/g,
    '<code style="padding: 1px 4px; border: 1px solid #e2e8f0; border-radius: 4px; font-family: ui-monospace, monospace; font-size: 11px; background: transparent;">$1</code>'
  );

  // 5. Clean escaped LaTeX braces and dots outside math
  processed = processed.replace(/\\\{/g, "{");
  processed = processed.replace(/\\\}/g, "}");
  processed = processed.replace(/\\dots/g, "...");

  // 6. Format step-by-step point cards
  const lines = processed.split("\n");
  const formattedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const itemContent = trimmed.substring(2);
      return `<div style="display: flex; align-items: flex-start; gap: 6px; margin: 2px 0; background: transparent;"><span style="color: #4f46e5; font-weight: 700; font-size: 11px; line-height: 1.48; flex-shrink: 0;">•</span><div style="flex: 1; font-size: 13px; line-height: 1.48; color: #1e293b; background: transparent;">${itemContent}</div></div>`;
    }
    return line;
  });
  processed = formattedLines.join("\n");

  // 7. Format paragraphs
  const paragraphs = processed.split(/\n\s*\n/);
  return paragraphs
    .map((para, pIdx) => {
      const withBr = para.replace(/\n/g, "<br/>");
      return `<div style="${pIdx > 0 ? "margin-top: 4px;" : ""} line-height: inherit; background: transparent;">${withBr}</div>`;
    })
    .join("");
}

/**
 * Builds the complete print booklet HTML with dynamic pagination and Page N of M footer.
 */
function buildPrintBookletHtml(quiz: PDFQuiz): string {
  const letters = ["A", "B", "C", "D", "E", "F"];
  const currentYear = new Date().getFullYear();
  const isBilingual = Boolean(quiz.isBilingual);

  // Build Question Cards with 100% transparent backgrounds
  const questionsHtml = quiz.questions
    .map((q, i) => {
      const renderedTitle = renderMarkdownAndMathToHtml(q.text);
      const renderedSecondaryTitle = q.secondaryText
        ? renderMarkdownAndMathToHtml(q.secondaryText)
        : "";

      const imageHtml = q.imageUrl
        ? `<div style="margin: 5px 0 7px 0; display: flex; justify-content: flex-start; background: transparent;">
            <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 3px; max-width: 300px; background: transparent;">
              <img src="${q.imageUrl}" style="max-height: 120px; width: auto; max-width: 100%; object-fit: contain; display: block;" alt="Question diagram" crossorigin="anonymous" />
            </div>
          </div>`
        : "";

      const correctIdx = q.options.indexOf(q.correctAnswer);
      const maxOptLength = Math.max(...q.options.map((o) => o.length));
      const useTwoCols = maxOptLength <= 30 && q.options.length === 4;

      const optionsHtml = q.options
        .map((opt, oIdx) => {
          const isCorrect = oIdx === correctIdx || opt.trim() === q.correctAnswer.trim();
          const renderedOpt = renderMarkdownAndMathToHtml(opt);
          const rawSecOpt = q.secondaryOptions ? q.secondaryOptions[oIdx] : undefined;

          // Only show secondary translation if it has actual Indic (Gujarati/Hindi) translated characters
          const hasIndicChars = rawSecOpt && /[\u0A80-\u0AFF\u0900-\u097F]/.test(rawSecOpt);
          const shouldShowSec =
            isBilingual &&
            hasIndicChars &&
            rawSecOpt !== opt;

          const renderedSecondaryOpt = shouldShowSec
            ? renderMarkdownAndMathToHtml(rawSecOpt)
            : "";

          return `
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; padding: 6px 11px; border: ${
              isCorrect ? "2px solid #059669" : "1px solid #cbd5e1"
            }; border-radius: 6px; background-color: transparent !important; box-sizing: border-box;">
              <div style="display: flex; align-items: flex-start; gap: 8px; flex: 1; background: transparent;">
                <span style="display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 5px; background-color: ${
                  isCorrect ? "#10b981" : "#f1f5f9"
                } !important; font-weight: 700; font-size: 11px; color: ${
            isCorrect ? "#ffffff" : "#475569"
          }; flex-shrink: 0; margin-top: 1px;">
                  ${letters[oIdx] || oIdx + 1}
                </span>
                <div style="flex: 1; line-height: 1.45; background: transparent;">
                  <div style="font-size: 13.5px; color: ${
                    isCorrect ? "#065f46" : "#0f172a"
                  }; font-weight: ${isCorrect ? "700" : "500"}; background: transparent;">${renderedOpt}</div>
                  ${
                    renderedSecondaryOpt
                      ? `<div style="font-size: 12.5px; color: ${
                          isCorrect ? "#047857" : "#334155"
                        }; margin-top: 2px; border-top: 1px dashed #cbd5e1; padding-top: 2px; font-weight: 500; background: transparent;">${renderedSecondaryOpt}</div>`
                      : ""
                  }
                </div>
              </div>
              ${
                isCorrect
                  ? `<span style="color: #059669; font-weight: 900; font-size: 15px; line-height: 1.45; flex-shrink: 0; background: transparent;">✓</span>`
                  : ""
              }
            </div>
          `;
        })
        .join("");

      // Explanation block with 100% transparent background
      const renderedDesc = q.description ? renderMarkdownAndMathToHtml(q.description) : "";
      const rawSecDesc = q.secondaryDescription;
      const hasIndicDesc = rawSecDesc && /[\u0A80-\u0AFF\u0900-\u097F]/.test(rawSecDesc);
      const renderedSecondaryDesc =
        isBilingual && hasIndicDesc && rawSecDesc !== q.description
          ? renderMarkdownAndMathToHtml(rawSecDesc)
          : "";

      const explanationHtml =
        renderedDesc || renderedSecondaryDesc
          ? `<div class="explanation-block" style="margin-top: 8px; border-left: 3.5px solid #6366f1; border-top: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; border-radius: 0 6px 6px 0; padding: 8px 14px; font-size: 13.5px; color: #1e293b; line-height: 1.5; background-color: transparent !important;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; background: transparent;">
                <span style="color: #6366f1; font-weight: 800; font-size: 13px;">✨</span>
                <strong style="color: #6366f1; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Explanation / સ્પષ્ટીકરણ</strong>
              </div>
              <div style="font-size: 13.5px; color: #0f172a; background: transparent;">${renderedDesc}</div>
              ${
                renderedSecondaryDesc
                  ? `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #cbd5e1; color: #334155; font-size: 13px; font-weight: 500; background: transparent;">${renderedSecondaryDesc}</div>`
                  : ""
              }
            </div>`
          : "";

      return `
        <div class="question-unit" style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; background: transparent;">
          <!-- Main Question Block: Question Title + All Options Stay Strictly Together -->
          <div class="question-main-block" style="background: transparent;">
            <div style="font-weight: 700; font-size: 14.5px; color: #0f172a; margin-bottom: 6px; display: flex; align-items: baseline; gap: 6px; line-height: 1.45; background: transparent;">
              <span style="color: #4f46e5; flex-shrink: 0; font-weight: 800; line-height: 1.45;">${i + 1}.</span>
              <div style="flex: 1; line-height: 1.45; background: transparent;">
                <div style="color: #0f172a; line-height: 1.45; background: transparent;">${renderedTitle}</div>
                ${
                  renderedSecondaryTitle
                    ? `<div style="color: #334155; font-size: 13.5px; margin-top: 3px; font-weight: 600; line-height: 1.45; background: transparent;">${renderedSecondaryTitle}</div>`
                    : ""
                }
              </div>
            </div>
            ${imageHtml}
            <div style="margin-top: 6px; background: transparent; ${
              useTwoCols
                ? "display: grid; grid-template-columns: 1fr 1fr; gap: 6px;"
                : "display: flex; flex-direction: column; gap: 4px;"
            }">
              ${optionsHtml}
            </div>
          </div>
          <!-- Explanation Block -->
          ${explanationHtml}
        </div>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${quiz.title} - PDF Booklet</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Anek+Gujarati:wght@400;500;600;700;800&family=Hind:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Anek Gujarati', 'Hind', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #ffffff;
      color: #0f172a;
      line-height: 1.45;
      font-size: 13px;
    }
    @page {
      size: A4 portrait;
      margin: 0;
    }
    .print-page {
      width: 210mm;
      min-height: 297mm;
      padding: 10mm 12mm 10mm 12mm;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      break-after: page;
      background-color: #ffffff;
      position: relative;
    }
    .print-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .pdf-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 10px;
      background: transparent;
      flex-shrink: 0;
      position: relative;
      z-index: 1;
    }
    .pdf-content {
      flex: 1;
      background: transparent;
      position: relative;
      z-index: 1;
    }
    .pdf-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      margin-top: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 9px;
      color: #64748b;
      background: transparent;
      flex-shrink: 0;
      position: relative;
      z-index: 1;
    }
    .page-watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      opacity: 0.11;
      z-index: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
      width: 440px;
      max-width: 85%;
    }
    #raw-container {
      width: calc(210mm - 24mm);
      background: transparent;
      display: block;
    }
  </style>
</head>
<body>
  <!-- Container for measurement -->
  <div id="raw-container">
    ${questionsHtml}
  </div>

  <!-- Container for finalized paginated sheets -->
  <div id="pages-container"></div>

  <script>
    function paginateBooklet() {
      const rawContainer = document.getElementById("raw-container");
      const pagesContainer = document.getElementById("pages-container");
      if (!rawContainer || !pagesContainer) return;

      const questionUnits = Array.from(rawContainer.children);
      if (questionUnits.length === 0) return;

      const pages = [];
      let currentPageUnits = [];
      let currentHeight = 0;
      
      // Conservative printable usable content height in px (820px ensures 0 overflow or cutting on A4)
      const MAX_CONTENT_HEIGHT = 820;

      questionUnits.forEach((unit) => {
        const unitHeight = unit.offsetHeight || unit.getBoundingClientRect().height || 180;
        if (currentHeight + unitHeight > MAX_CONTENT_HEIGHT && currentPageUnits.length > 0) {
          pages.push(currentPageUnits);
          currentPageUnits = [unit.outerHTML];
          currentHeight = unitHeight;
        } else {
          currentPageUnits.push(unit.outerHTML);
          currentHeight += unitHeight;
        }
      });

      if (currentPageUnits.length > 0) {
        pages.push(currentPageUnits);
      }

      const totalPages = pages.length;

      pagesContainer.innerHTML = pages.map((pageUnits, pageIdx) => {
        const pageNum = pageIdx + 1;
        return \`
          <div class="print-page">
            <!-- Centered Background Watermark for PDF (Logo Only) -->
            <div class="page-watermark">
              <img src="/quizzer.svg" alt="" style="width: 100%; height: auto; display: block;" />
            </div>

            <!-- Header -->
            <div class="pdf-header">
              <div style="display: flex; align-items: center; gap: 10px;">
                <img src="/quizzer.svg" alt="Quizzer Logo" style="height: 20px; width: auto; display: block;" />
                <span style="color: #cbd5e1; font-weight: 300;">|</span>
                <div style="font-weight: 800; font-size: 13.5px; color: #0f172a; letter-spacing: -0.2px;">${quiz.title}</div>
              </div>
              <div style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                ${isBilingual ? "Bilingual Exam Booklet" : "Exam Booklet"} · ${quiz.questions.length} Questions
              </div>
            </div>

            <!-- Content Area -->
            <div class="pdf-content">
              \${pageUnits.join("")}
            </div>

            <!-- Footer: 3 Columns on the EXACT same row -->
            <div class="pdf-footer">
              <!-- Left Side: Made with ♥ by Hardik Chaudhari -->
              <div style="display: flex; align-items: center; gap: 8px;">
                <svg width="22" height="20" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0;">
                  <path d="M50 82 C50 82, 12 56, 12 30 C12 16, 24 8, 36 8 C43 8, 48 13, 50 17 C52 13, 57 8, 64 8 C76 8, 88 16, 88 30 C88 56, 50 82, 50 82 Z" stroke="#c026d3" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="#fdf4ff"/>
                  <path d="M30 45 C35 38, 44 38, 50 48 C56 38, 65 38, 70 45" stroke="#db2777" stroke-width="3" stroke-linecap="round"/>
                  <circle cx="50" cy="54" r="3" fill="#e11d48"/>
                </svg>
                <div style="display: flex; flex-direction: column; justify-content: center;">
                  <span style="font-size: 10px; font-weight: 700; color: #0f172a; line-height: 1.2; font-family: 'Anek Gujarati', 'Inter', sans-serif;">
                    Made with <span style="color: #db2777; font-weight: 900;">♥</span> by <span style="color: #4f46e5; font-weight: 800;">Hardik Chaudhari</span>
                  </span>
                  <span style="font-size: 8px; color: #64748b; line-height: 1.2; margin-top: 1px;">
                    © ${currentYear} Quizzer. All rights reserved.
                  </span>
                </div>
              </div>

              <!-- Center: Exact Page Number in same row -->
              <div style="font-size: 10px; font-weight: 700; color: #475569; letter-spacing: 0.3px;">
                Page \${pageNum} of \${totalPages}
              </div>

              <!-- Right Side: Generated with Quizzer -->
              <div style="display: flex; align-items: center; gap: 5px;">
                <span style="font-size: 9px; font-weight: 600; color: #64748b; line-height: 1; display: inline-flex; align-items: center;">Generated with</span>
                <img src="/quizzer.svg" alt="Quizzer" style="height: 13px; width: auto; display: inline-block; vertical-align: middle; margin-top: -1px;" />
              </div>
            </div>
          </div>
        \`;
      }).join("");

      // Hide raw container
      rawContainer.style.display = "none";
    }

    window.paginateBooklet = paginateBooklet;
  </script>
</body>
</html>`;
}

/**
 * Spools the PDF booklet into an isolated print engine for instant 0.1s vector PDF generation.
 */
export async function generateQuizPDF(quiz: PDFQuiz): Promise<void> {
  // Create isolated visible-sized iframe offscreen so layout measurements are 100% accurate
  const iframe = document.createElement("iframe");
  iframe.id = "quizzer-pdf-print-spooler";
  iframe.style.position = "fixed";
  iframe.style.top = "0";
  iframe.style.left = "-99999px";
  iframe.style.width = "210mm";
  iframe.style.height = "297mm";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  try {
    const htmlContent = buildPrintBookletHtml(quiz);

    // Use modern standard srcdoc instead of deprecated document.write
    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve();
      iframe.srcdoc = htmlContent;
    });

    // Wait for fonts & KaTeX to render in frame
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (iframe.contentWindow?.document.fonts) {
      await iframe.contentWindow.document.fonts.ready;
    }

    // Run pagination with fully rendered fonts and dimensions
    try {
      (iframe.contentWindow as unknown as { paginateBooklet?: () => void })?.paginateBooklet?.();
    } catch {
      // fallback
    }
    await new Promise((resolve) => setTimeout(resolve, 150));

    const cleanup = () => {
      try {
        if (iframe.contentWindow) {
          iframe.contentWindow.onbeforeunload = null;
          iframe.contentWindow.onafterprint = null;
        }
        iframe.srcdoc = "";
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      } catch {
        // Safe no-op
      }
    };

    // Clean up immediately once the print dialog is closed or cancelled
    if (iframe.contentWindow) {
      iframe.contentWindow.addEventListener("afterprint", cleanup, { once: true });
    }
    window.addEventListener("afterprint", cleanup, { once: true });

    // Trigger native browser vector PDF spooler (0.1s instant render)
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  } catch (error) {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
    throw error;
  }
}