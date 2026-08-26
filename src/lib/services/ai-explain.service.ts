import { executeWithGeminiFailover, GEMINI_MODEL, FALLBACK_MODELS } from "@/lib/gemini";

import fs from "fs/promises";
import path from "path";

/**
 * Safely parse JSON strings returned by AI, automatically fixing unescaped LaTeX backslashes
 */
function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw);
  } catch {
    try {
      // Fix unescaped backslashes (e.g. LaTeX \Omega, \frac, \Delta) that are not valid JSON escapes
      const sanitized = raw.replace(/\\([^"\\\/bfnrtu])/g, "\\\\$1");
      return JSON.parse(sanitized);
    } catch {
      return fallback;
    }
  }
}

/**
 * Safely extracts an image payload from a base64 Data URI or local filesystem path
 * and converts it into a base64 payload and MIME type suitable for Gemini vision models.
 * 
 * Outbound server-side HTTP requests are avoided to guarantee zero Server-Side Request Forgery (SSRF) risk.
 *
 * @param imageUrl The image data URI or local relative path.
 * @returns Object with base64 data and mimeType, or null if unreachable.
 */
export async function fetchImageAsBase64(
  imageUrl?: string | null
): Promise<{ base64: string; mimeType: string } | null> {
  if (!imageUrl || typeof imageUrl !== "string") return null;

  try {
    const trimmed = imageUrl.trim();

    // Case 1: Base64 Data URI (e.g. data:image/png;base64,...)
    if (trimmed.startsWith("data:image/")) {
      const match = trimmed.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        return {
          mimeType: match[1],
          base64: match[2],
        };
      }
    }

    // Case 2: Local relative public path (e.g. /uploads/... or /diagrams/...)
    if (trimmed.startsWith("/")) {
      const publicDir = path.resolve(process.cwd(), "public");
      const filename = path.basename(trimmed);

      // Strictly allow only valid alphanumeric image filenames
      if (!/^[a-zA-Z0-9_\-.]+\.(png|jpg|jpeg|webp|svg|gif)$/i.test(filename)) {
        return null;
      }

      const resolvedPath = path.resolve(publicDir, "uploads", filename);
      if (!resolvedPath.startsWith(publicDir)) {
        console.warn(`[Path Guard] Blocked path traversal attempt: ${trimmed}`);
        return null;
      }

      const ext = path.extname(filename).toLowerCase();
      const mimeMap: Record<string, string> = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
        ".gif": "image/gif",
      };

      if (!mimeMap[ext]) {
        return null;
      }

      try {
        const buffer = await fs.readFile(resolvedPath);
        return {
          base64: buffer.toString("base64"),
          mimeType: mimeMap[ext],
        };
      } catch {
        return null;
      }
    }

    return null;
  } catch (error) {
    console.warn("Could not load image for AI vision:", error);
    return null;
  }
}

export interface GenerateExplanationParams {
  text: string;
  options: string[];
  correctAnswer: string;
  imageUrl?: string | null;
  topicTitle?: string;
  language?: string;
}

export interface GenerateExplanationResult {
  explanation: string;
  hint: string;
}

/**
 * Generates an accurate, context-aware step-by-step explanation and hint for a question
 * using Gemini Multimodal Vision if an image/diagram is attached.
 *
 * @param params Question details, optional diagram URL, and language.
 * @returns Generated explanation and hint in the target language.
 */
export async function generateQuestionExplanation(
  params: GenerateExplanationParams
): Promise<GenerateExplanationResult> {
  const { text, options, correctAnswer, imageUrl, topicTitle, language } = params;

  // Detect language if not provided
  const isGujarati =
    language === "gu" ||
    /[\u0A80-\u0AFF]/.test(text) ||
    options.some((o) => /[\u0A80-\u0AFF]/.test(o));
  const isHindi =
    language === "hi" ||
    /[\u0900-\u097F]/.test(text) ||
    options.some((o) => /[\u0900-\u097F]/.test(o));

  const targetLangName = isGujarati
    ? "Gujarati (ગુજરાતી)"
    : isHindi
    ? "Hindi (हिन्दी)"
    : "English";

  // Attempt to load the image for Gemini multimodal inspection
  const imageData = imageUrl ? await fetchImageAsBase64(imageUrl) : null;

  const prompt = `You are a distinguished professor and master technical tutor.
Analyze the following multiple-choice question, options, correct answer, and the attached diagram/schematic image${imageData ? " (provided in the image payload)" : ""}.

${topicTitle ? `Topic: ${topicTitle}` : ""}
Language: ${targetLangName}
Question: ${text}
Options:
${options.map((opt, i) => `Option ${i + 1}: ${opt}`).join("\n")}
Correct Answer: ${correctAnswer}

CRITICAL LANGUAGE REQUIREMENT:
${
  isGujarati
    ? "The question is in GUJARATI. You MUST write the entire explanation and hint completely in natural, high-quality, authentic GUJARATI (ગુજરાતી), using appropriate Gujarati academic and competitive exam terminology. Do NOT write in English."
    : isHindi
    ? "The question is in HINDI. You MUST write the entire explanation and hint completely in natural, high-quality, authentic HINDI (हिन्दी), using appropriate Hindi academic and competitive exam terminology. Do NOT write in English."
    : "Write the explanation and hint in clear, academic English."
}

Instructions:
1. ${imageData ? "CRITICAL: Carefully inspect the attached diagram. Reference specific components (diode orientations, capacitors, resistors, nodes, voltages, logic gates, waveforms, etc.)." : "Break down the core concept step-by-step."}
2. Structure the explanation strictly as a structured point-by-point Markdown list:
   - **Concept Overview:** 1-sentence fundamental principle (in ${targetLangName}).
   - **Step 1 — [Title]:** Specific analytical or mathematical step.
   - **Step 2 — [Title]:** Next step or formula derivation.
   - **Step 3 — [Title]:** Calculation or substitution (if applicable).
   - **Conclusion:** Why '${correctAnswer}' is undeniably correct and why other options fail.
3. Formatting Rules:
   - Mathematical expressions: Use standard LaTeX: inline $term$ (e.g. $V_A$, $4\\,\\Omega$, $I$) and block math $$\\frac{a}{b}$$ on its own separate line. Keep all LaTeX formulas and variable names intact.
   - Code snippets: Wrap programming code in triple backtick markdown blocks \`\`\`language ... \`\`\`.
   - Never output raw unparsed HTML or stray '<' / '>' symbols.
4. Hint:
   - Provide a concise 1-2 sentence hint in ${targetLangName} pointing toward the key observation.

Respond ONLY with a valid JSON object matching this exact structure:
{
  "explanation": "- **Concept Overview:** ...\\n- **Step 1 — [Title]:** ...\\n- **Step 2 — [Title]:** ...\\n- **Conclusion:** ...",
  "hint": "Concise 1-2 sentence hint in ${targetLangName}..."
}`;

  return executeWithGeminiFailover(async (client) => {
    const contents: Array<string | { inlineData: { mimeType: string; data: string } }> = [];

    if (imageData) {
      contents.push({
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.base64,
        },
      });
    }

    contents.push(prompt);

    const modelsToTry = [
      GEMINI_MODEL,
      "gemini-2.5-flash",
      ...FALLBACK_MODELS,
    ];

    let lastError: unknown = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        });

        const rawText = response.text || "";
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = safeJsonParse<{ explanation?: string; hint?: string } | null>(jsonMatch[0], null);
          if (parsed && parsed.explanation) {
            return {
              explanation: String(parsed.explanation).trim(),
              hint: parsed.hint ? String(parsed.hint).trim() : "",
            };
          }
        }
      } catch (err) {
        lastError = err;
        console.warn(`[AI Explain] Model ${modelName} failed, trying next fallback:`, err);
      }
    }

    throw lastError || new Error("Failed to generate explanation from AI models.");
  });
}

/**
 * Translates an existing explanation and hint into the requested target language (en, gu, or hi)
 * while preserving mathematical equations (LaTeX), markdown format, and technical accuracy.
 */
export async function translateExplanationAndHint(params: {
  explanation: string;
  hint: string;
  targetLanguage: "en" | "gu" | "hi";
}): Promise<{ explanation: string; hint: string }> {
  const { explanation, hint, targetLanguage } = params;

  if (!explanation && !hint) {
    return { explanation, hint };
  }

  const langName =
    targetLanguage === "gu"
      ? "Gujarati (ગુજરાતી)"
      : targetLanguage === "hi"
      ? "Hindi (हिन्दी)"
      : "English";

  const prompt = `You are a master academic translator specializing in engineering and competitive exam topics.
Translate the following explanation and hint into natural, authentic ${langName}.

CRITICAL INSTRUCTIONS:
1. Translate all explanatory text and conceptual explanations thoroughly into authentic ${langName}.
2. PRESERVE ALL LaTeX mathematical formulas EXACTLY as they are (e.g. $V_A$, $4\\,\\Omega$, $$\\frac{a}{b}$$). Do NOT translate formula variable names or numbers.
3. PRESERVE ALL Markdown structure (bullet points, bold titles like **Concept Overview:**, **Step 1 — ...**, **Conclusion:**).
4. Code snippets must stay inside triple-backtick markdown blocks.

Input Explanation:
${explanation}

Input Hint:
${hint}

Respond ONLY with a valid JSON object matching:
{
  "explanation": "Translated explanation in ${langName}...",
  "hint": "Translated hint in ${langName}..."
}`;

  return executeWithGeminiFailover(async (client) => {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const rawText = response.text || "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = safeJsonParse(jsonMatch[0], { explanation, hint });
      return {
        explanation: String(parsed.explanation || explanation).trim(),
        hint: String(parsed.hint || hint).trim(),
      };
    }
    return { explanation, hint };
  });
}
