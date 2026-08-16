import { executeWithGeminiFailover, GEMINI_MODEL, FALLBACK_MODELS } from "@/lib/gemini";
import fs from "fs/promises";
import path from "path";

/**
 * Validates whether a hostname is safe against Server-Side Request Forgery (SSRF).
 * Blocks loopback, private subnets, and cloud instance metadata endpoints.
 */
function isSafePublicHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();

  // Block localhost, loopback, and cloud metadata hostnames
  if (
    lower === "localhost" ||
    lower === "127.0.0.1" ||
    lower === "::1" ||
    lower === "0.0.0.0" ||
    lower === "169.254.169.254" ||
    lower === "metadata.google.internal" ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal")
  ) {
    return false;
  }

  // Block IPv4 private address ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x, 100.64-127.x.x
  const ipv4Match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (a === 10) return false;
    if (a === 127) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
    if (a === 0) return false;
  }

  return true;
}

/**
 * Fetches an image from an absolute HTTPS URL, relative local path, or base64 data URI
 * and converts it into a base64 payload and MIME type suitable for Gemini vision models.
 * Includes strict SSRF protection and path traversal guards.
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
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(trimmed);
      } catch {
        return null;
      }

      // Enforce safe public hosts to prevent SSRF
      if (!isSafePublicHost(parsedUrl.hostname)) {
        console.warn(`[SSRF Guard] Blocked request to internal/restricted host: ${parsedUrl.hostname}`);
        return null;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

      const res = await fetch(parsedUrl.href, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn(`Failed to fetch diagram image (${res.status}): ${parsedUrl.href}`);
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
