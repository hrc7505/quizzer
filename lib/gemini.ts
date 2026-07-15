import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GOOGLE_GENAI_API_KEY;

if (!apiKey) {
  console.warn("GOOGLE_GENAI_API_KEY is not set!");
}

export const ai = new GoogleGenAI({ apiKey });

export const GEMINI_MODEL = "gemini-2.5-flash";

/**
 * Translate raw Gemini/SDK errors into a clear, user-facing message.
 * Keeps model/transport details out of what's shown to end users.
 */
export function describeAiError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (/image input|does not support image|unsupported.*(image|file)/i.test(message)) {
    return "This model can only process text. Upload a text-based PDF or use the text/topic input instead.";
  }
  if (/timeout|aborted|deadline/i.test(message)) {
    return "The AI request timed out. Try again with smaller input.";
  }
  if (/api key|authentication|unauthorized|permission/i.test(message)) {
    return "The AI service could not be reached. Please try again later.";
  }
  return message || "Failed to generate content";
}
