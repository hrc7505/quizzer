/**
 * PDF generation utility for quiz results.
 * Produces 100% pixel-accurate PDF reports with KaTeX-rendered mathematical equations,
 * circuit diagrams, styled option cards, and high-fidelity explanation containers.
 */

import katex from "katex";

export interface PDFQuestion {
  text: string;
  imageUrl?: string | null;
  options: string[];
  correctAnswer: string;
  description?: string | null;
  hint?: string | null;
}

export interface PDFQuiz {
  title: string;
  questions: PDFQuestion[];
}

/**
 * Converts Markdown text and LaTeX math formulas ($...$ and $$...$$) into
 * HTML with real KaTeX-rendered mathematical typography.
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
      const rendered = katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false,
      });
      return `<div style="margin: 8px 0; text-align: center; overflow-x: auto;">${rendered}</div>`;
    } catch {
      return math;
    }
  });

  // 2. Render Inline Math: $ ... $ or \( ... \)
  processed = processed.replace(/(?:\$|\\\()([^$\n\\]+?)(?:\$|\\\))/g, (_, math) => {
    try {
      const rendered = katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false,
      });
      return `<span style="display: inline-block; vertical-align: middle; padding: 0 1px;">${rendered}</span>`;
    } catch {
      return math;
    }
  });

  // 3. Format code blocks (```...```)
  processed = processed.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, _lang, code) => {
    return `<pre style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; font-family: monospace; font-size: 10.5px; margin: 6px 0; overflow-x: auto; color: #0f172a;"><code>${code.trim()}</code></pre>`;
  });

  // 4. Format bold, italic, inline code
  processed = processed.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  processed = processed.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  processed = processed.replace(/`([^`]+)`/g, "<code style=\"background: #f1f5f9; padding: 1px 4px; border-radius: 4px; font-family: monospace; font-size: 10.5px;\">$1</code>");

  // 5. Format step-by-step point cards
  const lines = processed.split("\n");
  const formattedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const itemContent = trimmed.substring(2);
      return `<div style="display: flex; align-items: flex-start; gap: 8px; margin: 4px 0; padding: 6px 10px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.03);"><span style="color: #4f46e5; font-weight: 700; font-size: 11px; line-height: 1.4; flex-shrink: 0;">✓</span><div style="flex: 1; font-size: 11px; line-height: 1.5; color: #1e293b;">${itemContent}</div></div>`;
    }
    return line;
  });
  processed = formattedLines.join("\n");

  // 6. Format paragraphs
  const paragraphs = processed.split(/\n\s*\n/);
  return paragraphs
    .map((para) => {
      const withBr = para.replace(/\n/g, "<br/>");
      return `<div style="margin: 3px 0; line-height: 1.55;">${withBr}</div>`;
    })
    .join("");
}

/**
 * Generate and download a PDF report for a quiz attempt.
 */
export async function generateQuizPDF(quiz: PDFQuiz): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const html2canvas = (await import("html2canvas")).default;

  // Build temporary DOM container for PDF rendering
  const container = document.createElement("div");
  container.id = "pdf-render-container";
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "794px"; // Standard A4 width at 96 DPI
  container.style.backgroundColor = "#ffffff";
  container.style.color = "#0f172a";
  container.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  container.style.fontSize = "13px";
  container.style.lineHeight = "1.5";
  container.style.padding = "28px 36px";
  container.style.boxSizing = "border-box";

  // Build HTML template
  const letters = ["A", "B", "C", "D", "E", "F"];

  const questionsHtml = quiz.questions
    .map((q, i) => {
      const renderedTitle = renderMarkdownAndMathToHtml(q.text);
      const imageHtml = q.imageUrl
        ? `<div style="margin: 10px 0; display: flex; justify-content: flex-start;">
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px; background-color: #f8fafc; max-width: 380px;">
              <img src="${q.imageUrl}" style="max-height: 160px; width: auto; max-width: 100%; object-fit: contain; display: block;" alt="Question diagram" crossorigin="anonymous" />
            </div>
          </div>`
        : "";

      const optionsHtml = q.options
        .map((opt, oIdx) => {
          const renderedOpt = renderMarkdownAndMathToHtml(opt);
          return `
            <div style="display: flex; align-items: flex-start; gap: 8px; padding: 6px 10px; margin-bottom: 4px; border: 1px solid #f1f5f9; border-radius: 6px; background-color: #ffffff;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 4px; background-color: #f1f5f9; font-weight: 700; font-size: 10px; color: #475569; flex-shrink: 0; margin-top: 1px;">
                ${letters[oIdx] || oIdx + 1}
              </span>
              <div style="font-size: 12px; color: #334155; flex: 1;">${renderedOpt}</div>
            </div>
          `;
        })
        .join("");

      return `
        <div style="margin-bottom: 22px; page-break-inside: avoid; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
          <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 8px; display: flex; gap: 6px;">
            <span style="color: #4f46e5;">${i + 1}.</span>
            <div style="flex: 1;">${renderedTitle}</div>
          </div>
          ${imageHtml}
          <div style="margin-top: 8px;">
            ${optionsHtml}
          </div>
        </div>
      `;
    })
    .join("");

  const answerKeyHtml = quiz.questions
    .map((q, i) => {
      const correctIdx = q.options.indexOf(q.correctAnswer);
      const correctLetter = correctIdx >= 0 ? letters[correctIdx] : "";
      const renderedAnswer = renderMarkdownAndMathToHtml(q.correctAnswer);
      const renderedDesc = q.description ? renderMarkdownAndMathToHtml(q.description) : "";

      return `
        <div style="margin-bottom: 18px; page-break-inside: avoid;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="font-weight: 700; font-size: 12px; color: #0f172a;">Q${i + 1}:</span>
            <span style="background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; border-radius: 6px; padding: 2px 8px; font-weight: 700; font-size: 11px;">
              ${correctLetter ? `${correctLetter}) ` : ""}${renderedAnswer}
            </span>
          </div>
          ${
            renderedDesc
              ? `<div style="border-left: 3px solid #4f46e5; background-color: #f8fafc; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; border-radius: 0 8px 8px 0; padding: 10px 14px; font-size: 11.5px; color: #1e293b;">
                  <strong style="color: #4f46e5; display: block; margin-bottom: 4px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">Explanation</strong>
                  ${renderedDesc}
                </div>`
              : ""
          }
        </div>
      `;
    })
    .join("");

  container.innerHTML = `
    <!-- Header -->
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="font-weight: 900; font-size: 20px; color: #4f46e5; letter-spacing: -0.5px;">Quizzer</div>
        <span style="color: #cbd5e1;">|</span>
        <div style="font-weight: 700; font-size: 15px; color: #0f172a;">${quiz.title}</div>
      </div>
      <div style="font-size: 11px; color: #64748b; font-weight: 500;">
        ${quiz.questions.length} Questions · Study Report
      </div>
    </div>

    <!-- Questions Section -->
    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin-bottom: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
        Questions
      </h2>
      ${questionsHtml}
    </div>

    <!-- Answer Key Section -->
    <div style="page-break-before: always; padding-top: 10px;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 18px;">
        <h2 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0;">
          Answer Key & Detailed Explanations
        </h2>
        <div style="font-size: 11px; color: #64748b;">${quiz.title}</div>
      </div>
      ${answerKeyHtml}
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2, // High resolution (retina quality)
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 794,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pdfHeight;

    // Add subsequent pages if content exceeds 1 page
    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pdfHeight;
    }

    // Add footer page numbers
    const totalPages = pdf.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      pdf.setPage(p);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(148, 163, 184);
      pdf.text(
        `Page ${p} of ${totalPages} · Generated by Quizzer`,
        pdfWidth / 2,
        pdfHeight - 6,
        { align: "center" }
      );
    }

    pdf.save(`quiz-${quiz.title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}