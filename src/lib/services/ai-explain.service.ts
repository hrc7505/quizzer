import { executeWithGeminiFailover, GEMINI_MODEL, FALLBACK_MODELS } from "@/lib/gemini";
import fs from "fs/promises";
import path from "path";

/**
 * Fetches an image from an absolute HTTPS URL, relative local path, or base64 data URI
 * and converts it into a base64 payload and MIME type suitable for Gemini vision models.
 *
 * @param imageUrl The image URL or data URI.
 * @returns Object with base64 data and mimeType, or null if unreachable.
 */
export async function fetchImageAsBase64(
  imageUrl?: string | null
): Promise<{ base64: string; mimeType: string } | null> {
  if (!imageUrl || typeof imageUrl !== "string") return null;

  try {
    const trimmed = imageUrl.trim();

    // Case 1: Data URI (e.g. data:image/png;base64,...)
    if (trimmed.startsWith("data:image/")) {
      const match = trimmed.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        return {
          mimeType: match[1],
          base64: match[2],
        };
      }
    }

    // Case 2: Remote HTTPS / HTTP URL (e.g. Cloudinary, ImgBB, GitHub)
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

      const res = await fetch(trimmed, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn(`Failed to fetch diagram image (${res.status}): ${trimmed}`);
        return null;
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const mimeType = res.headers.get("content-type") || "image/png";
      const cleanMime = mimeType.split(";")[0].trim();

      return {
        base64: buffer.toString("base64"),
        mimeType: cleanMime,
      };
    }

    // Case 3: Local relative public path (e.g. /uploads/... or /diagrams/...)
    if (trimmed.startsWith("/")) {
      const localPath = path.join(process.cwd(), "public", trimmed);
      const buffer = await fs.readFile(localPath);
      const ext = path.extname(trimmed).toLowerCase();
      const mimeMap: Record<string, string> = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
        ".gif": "image/gif",
      };
      return {
        base64: buffer.toString("base64"),
        mimeType: mimeMap[ext] || "image/png",
      };
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
}

export interface GenerateExplanationResult {
  explanation: string;
  hint: string;
}

/**
 * Generates an accurate, context-aware step-by-step explanation and hint for a question
 * using Gemini Multimodal Vision if an image/diagram is attached.
 *
 * @param params Question details and optional diagram URL.
 * @returns Generated explanation and hint.
 */
export async function generateQuestionExplanation(
  params: GenerateExplanationParams
): Promise<GenerateExplanationResult> {
  const { text, options, correctAnswer, imageUrl, topicTitle } = params;

  // Attempt to load the image for Gemini multimodal inspection
  const imageData = imageUrl ? await fetchImageAsBase64(imageUrl) : null;

  const prompt = `You are a distinguished professor and master technical tutor.
Analyze the following multiple-choice question, options, correct answer, and the attached diagram/schematic image${imageData ? " (provided in the image payload)" : ""}.

${topicTitle ? `Topic: ${topicTitle}` : ""}
Question: ${text}
Options:
${options.map((opt, i) => `Option ${i + 1}: ${opt}`).join("\n")}
Correct Answer: ${correctAnswer}

Instructions:
1. ${imageData ? "CRITICAL: Carefully inspect the attached diagram. Reference specific components (diode orientations, capacitors, resistors, nodes, voltages, logic gates, waveforms, etc.)." : "Break down the core concept step-by-step."}
2. Structure the explanation strictly as a structured point-by-point Markdown list:
   - **Concept Overview:** 1-sentence fundamental principle.
   - **Step 1 — [Title]:** Specific analytical or mathematical step.
   - **Step 2 — [Title]:** Next step or formula derivation.
   - **Step 3 — [Title]:** Calculation or substitution (if applicable).
   - **Conclusion:** Why '${correctAnswer}' is undeniably correct and why other options fail.
3. Formatting Rules:
   - Mathematical expressions: Use standard LaTeX: inline $term$ (e.g. $V_A$, $4\\,\\Omega$, $I$) and block math $$\\frac{a}{b}$$ on its own separate line.
   - Code snippets: Wrap programming code in triple backtick markdown blocks \`\`\`language ... \`\`\`.
   - Never output raw unparsed HTML or stray '<' / '>' symbols.
4. Hint:
   - Provide a concise 1-2 sentence hint pointing toward the key observation.

Respond ONLY with a valid JSON object matching this exact structure:
{
  "explanation": "- **Concept Overview:** ...\\n- **Step 1 — [Title]:** ...\\n- **Step 2 — [Title]:** ...\\n- **Conclusion:** ...",
  "hint": "Concise 1-2 sentence hint..."
}`;

  return executeWithGeminiFailover(async (client) => {
    const contents: any[] = [];

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
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.explanation) {
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
