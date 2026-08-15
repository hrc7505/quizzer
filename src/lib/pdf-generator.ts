/**
 * PDF generation utility for quiz results.
 * Extracted from QuizResults.tsx to reduce component size and enable lazy loading.
 */

interface PDFQuestion {
  text: string;
  options: string[];
  correctAnswer: string;
  description?: string | null;
}

interface PDFQuiz {
  title: string;
  questions: PDFQuestion[];
}

/**
 * Generate and download a PDF report for a quiz attempt.
 */
export async function generateQuizPDF(quiz: PDFQuiz): Promise<void> {
  const { jsPDF, GState } = await import("jspdf");
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const headerHeight = 18;

  // Load logo
  const logoRes = await fetch("/quizzer.svg");
  const logoText = await logoRes.text();
  const logoBlob = new Blob([logoText], { type: "image/svg+xml" });
  const logoUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(logoBlob);
  });

  const svgToPng = (svgUrl: string): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context unavailable"));
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Failed to load SVG for PDF watermark"));
      img.src = svgUrl;
    });

  const logoPng = await svgToPng(logoUrl);
  const logoAspect = 833 / 280;
  const headerLogoWidth = 24;
  const headerLogoHeight = headerLogoWidth / logoAspect;

  // Try to load WinkySans font
  let useWinkySans = false;
  try {
    const fontRes = await fetch(
      "https://raw.githubusercontent.com/google/fonts/main/ofl/winkysans/WinkySans%5Bwght%5D.ttf"
    );
    if (fontRes.ok) {
      const fontBuffer = await fontRes.arrayBuffer();
      const fontBase64 = btoa(
        Array.from(new Uint8Array(fontBuffer))
          .map((byte) => String.fromCharCode(byte))
          .join("")
      );
      pdf.addFileToVFS("WinkySans.ttf", fontBase64);
      pdf.addFont("WinkySans.ttf", "WinkySans", "normal");
      pdf.addFont("WinkySans.ttf", "WinkySans", "bold");
      useWinkySans = true;
    }
  } catch {
    useWinkySans = false;
  }

  const fontFamily = useWinkySans ? "WinkySans" : "helvetica";

  const drawHeader = () => {
    pdf.setFillColor(248, 249, 250);
    pdf.rect(0, 0, pageWidth, headerHeight, "F");
    pdf.setDrawColor(230, 232, 235);
    pdf.line(0, headerHeight, pageWidth, headerHeight);
    const logoY = (headerHeight - headerLogoHeight) / 2;
    pdf.addImage(logoPng, "PNG", margin, logoY, headerLogoWidth, headerLogoHeight);
    pdf.setFont(fontFamily, "bold");
    pdf.setFontSize(14);
    const titleText = quiz.title;
    const titleX = margin + headerLogoWidth + 6;
    const titleY = headerHeight - 6;
    pdf.setTextColor(30, 41, 59);
    pdf.text(titleText, titleX, titleY);
    pdf.setTextColor(0, 0, 0);
  };

  const addWatermark = () => {
    const wmWidth = 120;
    const wmHeight = wmWidth / logoAspect;
    const wmX = (pageWidth - wmWidth) / 2;
    const wmY = (pageHeight - wmHeight) / 2;
    pdf.setGState(new GState({ opacity: 0.12 }));
    pdf.addImage(logoPng, "PNG", wmX, wmY, wmWidth, wmHeight);
    pdf.setGState(new GState({ opacity: 1 }));
  };

  drawHeader();
  addWatermark();

  let y = headerHeight + 12;
  pdf.setFontSize(12);
  pdf.setFont(fontFamily, "normal");

  // Questions
  quiz.questions.forEach((q, i) => {
    const qText = `${i + 1}. ${q.text}`;
    const splitText = pdf.splitTextToSize(qText, pageWidth - 2 * margin);

    if (y + splitText.length * 6 > pageHeight - margin) {
      pdf.addPage();
      drawHeader();
      addWatermark();
      y = headerHeight + 12;
    }

    pdf.setFont(fontFamily, "bold");
    pdf.setFontSize(12);
    pdf.text(splitText, margin, y);
    y += splitText.length * 6;

    pdf.setFont(fontFamily, "normal");
    pdf.setFontSize(12);
    const letters = ["A", "B", "C", "D"];
    q.options.forEach((opt, optIndex) => {
      const optText = `   ${letters[optIndex]}) ${opt}`;
      const splitOpt = pdf.splitTextToSize(optText, pageWidth - 2 * margin);

      if (y + splitOpt.length * 6 > pageHeight - margin) {
        pdf.addPage();
        drawHeader();
        addWatermark();
        y = headerHeight + 12;
        pdf.setFont(fontFamily, "normal");
        pdf.setFontSize(12);
      }

      pdf.text(splitOpt, margin, y);
      y += splitOpt.length * 6;
    });

    y += 6;
  });

  // Answer Key
  pdf.addPage();
  drawHeader();
  addWatermark();
  y = headerHeight + 12;
  pdf.setFontSize(16);
  pdf.setFont(fontFamily, "bold");
  pdf.text("Answer Key", margin, y);
  y += 12;

  pdf.setFontSize(12);
  pdf.setFont(fontFamily, "normal");

  quiz.questions.forEach((q, i) => {
    const letters = ["A", "B", "C", "D"];
    const correctIndex = q.options.indexOf(q.correctAnswer);
    const correctLetter = correctIndex >= 0 ? letters[correctIndex] : "";

    const ansText = `${i + 1}. ${correctLetter} - ${q.correctAnswer}`;
    const splitAns = pdf.splitTextToSize(ansText, pageWidth - 2 * margin);

    if (y + splitAns.length * 6 > pageHeight - margin) {
      pdf.addPage();
      drawHeader();
      addWatermark();
      y = headerHeight + 12;
      pdf.setFont(fontFamily, "normal");
      pdf.setFontSize(12);
    }

    pdf.setFont(fontFamily, "bold");
    pdf.setFontSize(12);
    pdf.text(splitAns, margin, y);
    y += splitAns.length * 6;

    if (q.description) {
      const descLines = q.description.split("\n");
      descLines.forEach((line) => {
        const bulletText = line.trim();
        if (!bulletText) return;
        const splitBullet = pdf.splitTextToSize(bulletText, pageWidth - 2 * (margin + 8));
        const lineCount = splitBullet.length;
        const lineHeight = 4.5;
        const boxPadding = 3;
        const boxHeight = lineCount * lineHeight + boxPadding * 2;

        if (y + boxHeight > pageHeight - margin) {
          pdf.addPage();
          drawHeader();
          addWatermark();
          y = headerHeight + 12;
          pdf.setFont(fontFamily, "normal");
          pdf.setFontSize(9);
        }

        pdf.setFillColor(240, 249, 255);
        pdf.setGState(new GState({ opacity: 0.6 }));
        pdf.roundedRect(margin + 2, y, pageWidth - 2 * (margin + 2), boxHeight, 2, 2, "F");
        pdf.setGState(new GState({ opacity: 1 }));
        pdf.setFont(fontFamily, "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(15, 23, 42);

        const circleX = margin + 7;
        const circleY = y + boxPadding + 1;
        pdf.setFillColor(16, 185, 129);
        pdf.circle(circleX, circleY, 1, "F");
        pdf.text(splitBullet, margin + 11, y + boxPadding + 2.5);

        pdf.setTextColor(0, 0, 0);
        y += boxHeight;
      });

      y += 4;
    }

    y += 4;
  });

  pdf.save(`quiz-${quiz.title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.pdf`);
}