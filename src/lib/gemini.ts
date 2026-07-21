import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GOOGLE_GENAI_API_KEY;

export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

if (!apiKey) {
  console.warn("GOOGLE_GENAI_API_KEY is not set!");
}

export const GEMINI_MODEL = "gemini-2.5-flash";

export type AiErrorIcon = "image-off" | "alert-circle" | "alert-triangle" | "info";

export interface AiErrorMeta {
  icon: AiErrorIcon;
  variant: "danger" | "warning" | "info";
}

const IMAGE_ERROR_ICON: AiErrorIcon = "image-off";
const DEFAULT_ERROR_ICON: AiErrorIcon = "alert-circle";

/**
 * Maps an AI error message to a display-friendly icon and Alert variant.
 */
export function getAiErrorMeta(message: string): AiErrorMeta {
  if (/cannot read|does not support image|image input|unsupported.*(image|file)/i.test(message)) {
    return { icon: IMAGE_ERROR_ICON, variant: "warning" };
  }
  if (/timeout|aborted|deadline/i.test(message)) {
    return { icon: DEFAULT_ERROR_ICON, variant: "warning" };
  }
  if (/api key|authentication|unauthorized|permission/i.test(message)) {
    return { icon: DEFAULT_ERROR_ICON, variant: "danger" };
  }
  return { icon: DEFAULT_ERROR_ICON, variant: "danger" };
}

export interface AiErrorResult {
  message: string;
  meta: AiErrorMeta;
}

/**
 * Translate raw Gemini/SDK errors into a clear, user-facing message + metadata.
 * Keeps model/transport details out of what's shown to end users.
 */
export function describeAiError(error: unknown): AiErrorResult {
  const raw = error instanceof Error ? error.message : String(error);
  const message = typeof raw === "string" ? raw : "";

  if (/cannot read|does not support image|image input|unsupported.*(image|file)/i.test(message)) {
    return {
      message: "This model cannot read images. Upload a text-based PDF or use the text/topic input instead.",
      meta: { icon: IMAGE_ERROR_ICON, variant: "warning" },
    };
  }
  if (/timeout|aborted|deadline/i.test(message)) {
    return {
      message: "The AI request timed out. Try again with smaller input.",
      meta: { icon: DEFAULT_ERROR_ICON, variant: "warning" },
    };
  }
  if (/api key|authentication|unauthorized|permission/i.test(message)) {
    return {
      message: "The AI service could not be reached. Please try again later.",
      meta: { icon: DEFAULT_ERROR_ICON, variant: "danger" },
    };
  }
  return {
    message: message || "Failed to generate content",
    meta: { icon: DEFAULT_ERROR_ICON, variant: "danger" },
  };
}
