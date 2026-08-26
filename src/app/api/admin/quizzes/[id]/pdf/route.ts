import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";

import { prisma } from "@/lib/prisma";

// In-memory font cache so TTF is only fetched once on server startup
let fontBase64Cache: string | null = null;

async function getGujaratiFontBase64(): Promise<string | null> {
  if (fontBase64Cache) return fontBase64Cache;
  try {
    const fontUrl =
      "https://fonts.gstatic.com/s/anekgujarati/v17/l7g_bj5oysqknvkCo2T_8FuiIRBA7lncQUmbIBEtPKiYYQhRwyBxCD-0F5C7ww.ttf";
    const res = await fetch(fontUrl, { cache: "force-cache" });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    fontBase64Cache = buf.toString("base64");
    return fontBase64Cache;
  } catch (err) {
    console.error("Failed to load Gujarati font for PDF:", err);
    return null;
  }
}

/**
 * Clean LaTeX and Markdown markers for clean vector PDF printing.
 */
function cleanTextForPdf(text?: string | null): string {
  if (!text) return "";
  let clean = text;
  // Replace standard LaTeX inline markers
  clean = clean.replace(/\\(?:theta|alpha|beta|gamma|lambda|sigma|omega|delta|pi|mu|tau|phi)/gi, (m) => m.slice(1));
  clean = clean.replace(/\\log/g, "log");
  clean = clean.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1 / $2)");
  clean = clean.replace(/\\cdot/g, "·");
  clean = clean.replace(/\\times/g, "×");
  clean = clean.replace(/\\le/g, "≤");
  clean = clean.replace(/\\ge/g, "≥");
  clean = clean.replace(/\\ne/g, "≠");
  clean = clean.replace(/\\approx/g, "≈");
  clean = clean.replace(/\\dots/g, "...");
  clean = clean.replace(/[\$\{\}\\]/g, "");
  // Markdown bold/italics/code
  clean = clean.replace(/\*\*([^*]+)\*\*/g, "$1");
  clean = clean.replace(/\*([^*]+)\*/g, "$1");
  clean = clean.replace(/`([^`]+)`/g, "$1");
  return clean.trim();
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "en"; // "en" | "gu" | "hi" | "bilingual_gu" | "bilingual_hi"

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const getTime = (q: { createdAt: Date | string | null }) => {
      return q.createdAt ? new Date(q.createdAt).getTime() : 0;
    };

    // Separate by language
    const enQuestions = quiz.questions
      .filter(
        (q) =>
          q.language === "en" ||
          (!q.language && !/[\u0A80-\u0AFF]/.test(q.text) && !/[\u0900-\u097F]/.test(q.text))
      )
      .sort((a, b) => getTime(a) - getTime(b));

    const rawGuList = quiz.questions.filter(
      (q) => q.language === "gu" || (!q.language && /[\u0A80-\u0AFF]/.test(q.text))
    );
    const rawHiList = quiz.questions.filter(
      (q) => q.language === "hi" || (!q.language && /[\u0900-\u097F]/.test(q.text))
    );

    const guMap = new Map<string, typeof quiz.questions[0]>();
    for (const q of rawGuList) {
      if (q.sourceQuestionId) guMap.set(q.sourceQuestionId, q);
    }

    const hiMap = new Map<string, typeof quiz.questions[0]>();
    for (const q of rawHiList) {
      if (q.sourceQuestionId) hiMap.set(q.sourceQuestionId, q);
    }

    const guQuestions =
      enQuestions.length > 0 && guMap.size > 0
        ? enQuestions.map((enQ) => guMap.get(enQ.id) || enQ)
        : rawGuList;

    const hiQuestions =
      enQuestions.length > 0 && hiMap.size > 0
        ? enQuestions.map((enQ) => hiMap.get(enQ.id) || enQ)
        : rawHiList;

    // Determine dataset
    const isBilingual = mode === "bilingual_gu" || mode === "bilingual_hi";
    const targetMap = mode === "bilingual_gu" ? guMap : hiMap;
    const activeQuestions =
      mode === "gu"
        ? guQuestions
        : mode === "hi"
        ? hiQuestions
        : isBilingual
        ? enQuestions
        : enQuestions.length > 0
        ? enQuestions
        : quiz.questions;

    const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
    const fontB64 = await getGujaratiFontBase64();

    if (fontB64) {
      doc.addFileToVFS("AnekGujarati.ttf", fontB64);
      doc.addFont("AnekGujarati.ttf", "AnekGujarati", "normal");
      doc.setFont("AnekGujarati");
    }

    const PAGE_WIDTH = 595.28;
    const PAGE_HEIGHT = 841.89;
    const MARGIN_X = 36;
    const MARGIN_Y = 36;
    const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
    const FOOTER_Y = PAGE_HEIGHT - 24;

    const currentYear = new Date().getFullYear();
    const letters = ["A", "B", "C", "D", "E", "F"];

    let y = MARGIN_Y;

    const drawHeader = (sectionTitle: string) => {
      doc.setFontSize(16);
      doc.setTextColor(79, 70, 229); // Indigo #4f46e5
      doc.text("Quizzer", MARGIN_X, MARGIN_Y + 10);

      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184); // Slate-400
      doc.text("|", MARGIN_X + 62, MARGIN_Y + 9);

      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42); // Slate-900
      const truncatedTitle =
        quiz.title.length > 42 ? quiz.title.slice(0, 40) + "..." : quiz.title;
      doc.text(truncatedTitle, MARGIN_X + 74, MARGIN_Y + 9);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(sectionTitle, PAGE_WIDTH - MARGIN_X, MARGIN_Y + 9, { align: "right" });

      // Header rule
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(1.5);
      doc.line(MARGIN_X, MARGIN_Y + 18, PAGE_WIDTH - MARGIN_X, MARGIN_Y + 18);

      y = MARGIN_Y + 36;
    };

    // Draw initial header
    drawHeader(isBilingual ? "Bilingual Exam Paper" : "Exam Paper");

    // 1. Render Questions
    activeQuestions.forEach((q, idx) => {
      const qNum = idx + 1;
      const primaryText = cleanTextForPdf(q.text);
      const companion = isBilingual ? targetMap.get(q.id) : null;
      const secondaryText = companion ? cleanTextForPdf(companion.text) : "";

      // Calculate required height for this question block
      const titleLines = doc.splitTextToSize(`${qNum}. ${primaryText}`, CONTENT_WIDTH);
      const secTitleLines = secondaryText
        ? doc.splitTextToSize(secondaryText, CONTENT_WIDTH - 16)
        : [];

      let optionsHeight = 0;
      q.options.forEach((opt, oIdx) => {
        const primaryOpt = cleanTextForPdf(opt);
        const secOpt = companion?.options[oIdx] ? cleanTextForPdf(companion.options[oIdx]) : "";
        const optLines = doc.splitTextToSize(`${letters[oIdx] || oIdx + 1}) ${primaryOpt}`, CONTENT_WIDTH - 20);
        const secOptLines = secOpt && secOpt !== primaryOpt
          ? doc.splitTextToSize(secOpt, CONTENT_WIDTH - 20)
          : [];
        optionsHeight += optLines.length * 13 + (secOptLines.length ? secOptLines.length * 11 + 4 : 0) + 8;
      });

      const totalItemHeight =
        titleLines.length * 14 +
        (secTitleLines.length ? secTitleLines.length * 12 + 6 : 0) +
        optionsHeight +
        20;

      // Check page break
      if (y + totalItemHeight > FOOTER_Y - 20) {
        doc.addPage();
        drawHeader(isBilingual ? "Bilingual Exam Paper" : "Exam Paper");
      }

      // Draw Question Title
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(titleLines, MARGIN_X, y);
      y += titleLines.length * 13 + 3;

      if (secTitleLines.length > 0) {
        doc.setFontSize(9.5);
        doc.setTextColor(71, 85, 105);
        doc.text(secTitleLines, MARGIN_X + 12, y);
        y += secTitleLines.length * 12 + 4;
      }

      y += 3;

      // Draw Options
      q.options.forEach((opt, oIdx) => {
        const primaryOpt = cleanTextForPdf(opt);
        const secOpt = companion?.options[oIdx] ? cleanTextForPdf(companion.options[oIdx]) : "";

        const optLines = doc.splitTextToSize(primaryOpt, CONTENT_WIDTH - 30);
        const secOptLines = secOpt && secOpt !== primaryOpt
          ? doc.splitTextToSize(secOpt, CONTENT_WIDTH - 30)
          : [];

        const boxH = optLines.length * 12 + (secOptLines.length ? secOptLines.length * 11 + 4 : 0) + 8;

        // Option Background Card
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(241, 245, 249);
        doc.roundedRect(MARGIN_X, y - 2, CONTENT_WIDTH, boxH, 4, 4, "FD");

        // Letter Badge
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(MARGIN_X + 5, y + 2, 16, 14, 3, 3, "F");
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text(letters[oIdx] || `${oIdx + 1}`, MARGIN_X + 9, y + 12);

        // Option Text
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        doc.text(optLines, MARGIN_X + 28, y + 9);
        y += optLines.length * 12 + 2;

        if (secOptLines.length > 0) {
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          doc.text(secOptLines, MARGIN_X + 28, y + 8);
          y += secOptLines.length * 11 + 4;
        }

        y += 4;
      });

      // Divider line
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.75);
      doc.line(MARGIN_X, y + 4, PAGE_WIDTH - MARGIN_X, y + 4);
      y += 14;
    });

    // 2. Answer Key & Solutions Section (Starts on a fresh page)
    doc.addPage();
    drawHeader(isBilingual ? "Bilingual Answer Key & Solutions" : "Answer Key & Solutions");

    activeQuestions.forEach((q, idx) => {
      const qNum = idx + 1;
      const companion = isBilingual ? targetMap.get(q.id) : null;
      const correctIdx = q.options.indexOf(q.correctAnswer);
      const letter = correctIdx >= 0 ? letters[correctIdx] : "";
      const primaryAns = cleanTextForPdf(q.correctAnswer);
      const secAns = companion ? cleanTextForPdf(companion.correctAnswer) : "";

      const primaryDesc = cleanTextForPdf(q.description);
      const secDesc = companion ? cleanTextForPdf(companion.description) : "";

      const descLines = primaryDesc ? doc.splitTextToSize(primaryDesc, CONTENT_WIDTH - 24) : [];
      const secDescLines = secDesc && secDesc !== primaryDesc
        ? doc.splitTextToSize(secDesc, CONTENT_WIDTH - 24)
        : [];

      const boxH =
        18 +
        (descLines.length ? descLines.length * 11 + 10 : 0) +
        (secDescLines.length ? secDescLines.length * 11 + 8 : 0);

      if (y + boxH > FOOTER_Y - 20) {
        doc.addPage();
        drawHeader(isBilingual ? "Bilingual Answer Key & Solutions" : "Answer Key & Solutions");
      }

      // Q Number Badge
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Q${qNum}:`, MARGIN_X, y + 10);

      // Correct Answer Emerald Pill
      const ansText = `${letter ? `${letter}) ` : ""}${primaryAns}`;
      const pillWidth = Math.min(doc.getTextWidth(ansText) + 16, CONTENT_WIDTH - 50);

      doc.setFillColor(236, 253, 245); // Emerald-50
      doc.setDrawColor(167, 243, 208); // Emerald-200
      doc.roundedRect(MARGIN_X + 28, y, pillWidth, 16, 4, 4, "FD");

      doc.setFontSize(9);
      doc.setTextColor(5, 150, 105); // Emerald-600
      doc.text(ansText, MARGIN_X + 36, y + 11);

      if (secAns && secAns !== primaryAns) {
        const secPillW = Math.min(doc.getTextWidth(secAns) + 14, CONTENT_WIDTH - pillWidth - 60);
        doc.setFillColor(240, 253, 244);
        doc.setDrawColor(187, 247, 208);
        doc.roundedRect(MARGIN_X + 34 + pillWidth, y, secPillW, 16, 4, 4, "FD");

        doc.setFontSize(8.5);
        doc.setTextColor(22, 101, 52);
        doc.text(secAns, MARGIN_X + 40 + pillWidth, y + 11);
      }

      y += 20;

      // Explanation Box
      if (descLines.length > 0 || secDescLines.length > 0) {
        const explH = (descLines.length * 11) + (secDescLines.length ? secDescLines.length * 11 + 10 : 0) + 16;
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(MARGIN_X + 10, y, CONTENT_WIDTH - 10, explH, 4, 4, "FD");

        // Indigo left border indicator
        doc.setFillColor(99, 102, 241);
        doc.roundedRect(MARGIN_X + 10, y, 3.5, explH, 1, 1, "F");

        doc.setFontSize(8);
        doc.setTextColor(99, 102, 241);
        doc.text("EXPLANATION / સ્પષ્ટીકરણ", MARGIN_X + 20, y + 11);

        let explY = y + 22;
        if (descLines.length > 0) {
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);
          doc.text(descLines, MARGIN_X + 20, explY);
          explY += descLines.length * 11 + 4;
        }

        if (secDescLines.length > 0) {
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);
          doc.text(secDescLines, MARGIN_X + 20, explY);
        }

        y += explH + 8;
      }

      // Divider line
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.5);
      doc.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y);
      y += 10;
    });

    // Draw Footer and Page Numbers on all pages
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.75);
      doc.line(MARGIN_X, FOOTER_Y - 6, PAGE_WIDTH - MARGIN_X, FOOTER_Y - 6);

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `© ${currentYear} Quizzer. All rights reserved. • Made with ♥ by Hardik Chaudhari`,
        MARGIN_X,
        FOOTER_Y + 6
      );
      doc.text(`Page ${p} of ${totalPages}`, PAGE_WIDTH - MARGIN_X, FOOTER_Y + 6, {
        align: "right",
      });
    }

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    const filename = `quiz-${quiz.title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.pdf`;

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Failed to generate server PDF:", error);
    return NextResponse.json({ error: "Failed to generate PDF booklet" }, { status: 500 });
  }
}
