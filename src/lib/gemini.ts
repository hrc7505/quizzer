/**
 * Google Gemini API Client Configuration & Multi-Subscription Key Manager.
 * 
 * Supports pooling multiple API keys from environment variables and automatically
 * failing over to subsequent subscription keys upon quota exhaustion, rate limits,
 * or authentication/service errors.
 */

import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
export const FALLBACK_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-flash-latest",
  "gemini-3.5-flash",
  "gemini-3.7-flash",
  "gemini-2.5-flash",
];

export type AiErrorIcon = "image-off" | "alert-circle" | "alert-triangle" | "info";

export interface AiErrorMeta {
  icon: AiErrorIcon;
  variant: "danger" | "warning" | "info";
}

const IMAGE_ERROR_ICON: AiErrorIcon = "image-off";
const DEFAULT_ERROR_ICON: AiErrorIcon = "alert-circle";

/**
 * Extracts and deduplicates all configured Google Gemini API keys from environment variables.
 * Supported env vars:
 * - `GOOGLE_GENAI_API_KEYS` / `GEMINI_API_KEYS` (comma/semicolon/newline-separated)
 * - `GOOGLE_GENAI_API_KEY` / `GEMINI_API_KEY` (single or comma-separated)
 * - Numbered keys: `GOOGLE_GENAI_API_KEY_1`, `GOOGLE_GENAI_API_KEY_2`, etc.
 * 
 * @returns Array of unique, non-empty Gemini API keys.
 */
export function getGeminiApiKeys(): string[] {
  const keys: string[] = [];

  const rawEnvSources = [
    process.env.GOOGLE_GENAI_API_KEYS,
    process.env.GEMINI_API_KEYS,
    process.env.GOOGLE_GENAI_API_KEY,
    process.env.GEMINI_API_KEY,
  ];

  for (const src of rawEnvSources) {
    if (src) {
      const split = src.split(/[,\n;]+/).map((k) => k.trim()).filter(Boolean);
      keys.push(...split);
    }
  }

  // Check for indexed environment variables (e.g. GOOGLE_GENAI_API_KEY_1, GOOGLE_GENAI_API_KEY_2, etc.)
  for (const [keyName, val] of Object.entries(process.env)) {
    if (
      val &&
      /^(GOOGLE_GENAI_API_KEY|GEMINI_API_KEY)(_\d+)?$/i.test(keyName) &&
      !rawEnvSources.includes(val)
    ) {
      const split = val.split(/[,\n;]+/).map((k) => k.trim()).filter(Boolean);
      keys.push(...split);
    }
  }

  return Array.from(new Set(keys));
}

// Client cache keyed by API key string to avoid recreating SDK instances
const clientsMap = new Map<string, GoogleGenAI>();

/**
 * Gets or instantiates a GoogleGenAI SDK client for a given API key.
 * 
 * @param apiKey - The Gemini API key.
 * @returns An instance of GoogleGenAI.
 */
export function getGeminiClientForKey(apiKey: string): GoogleGenAI {
  let client = clientsMap.get(apiKey);
  if (!client) {
    client = new GoogleGenAI({ apiKey });
    clientsMap.set(apiKey, client);
  }
  return client;
}

// Global pointer for round-robin / active key position
let currentKeyIndex = 0;

/**
 * Masks an API key for safe logging.
 * 
 * @param key - The raw API key string.
 * @returns Masked key string (e.g. AIza••••ILEs).
 */
export function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

/**
 * Checks whether an error is suitable for triggering failover to the next API subscription key.
 * 
 * @param error - The caught error object or message.
 * @returns True if error is a rate limit, quota exhaustion, auth failure, or temporary server issue.
 */
export function isRetryableGeminiError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();

  // Rate limiting / Quota / Resource exhausted / Billing
  if (
    lower.includes("429") ||
    lower.includes("resource_exhausted") ||
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("rate_limit") ||
    lower.includes("exceeded") ||
    lower.includes("billing")
  ) {
    return true;
  }

  // Authentication / Invalid key / Expired key / Permission / Forbidden
  if (
    lower.includes("403") ||
    lower.includes("401") ||
    lower.includes("api_key_invalid") ||
    lower.includes("api key not valid") ||
    lower.includes("unauthorized") ||
    lower.includes("permission_denied") ||
    lower.includes("permission denied") ||
    lower.includes("expired") ||
    lower.includes("forbidden")
  ) {
    return true;
  }

  // Temporary network/service errors
  if (
    lower.includes("503") ||
    lower.includes("500") ||
    lower.includes("service_unavailable") ||
    lower.includes("overloaded") ||
    lower.includes("try again") ||
    lower.includes("internal error") ||
    lower.includes("fetch failed") ||
    lower.includes("econnreset")
  ) {
    return true;
  }

  // Model availability / not found on new/old project
  if (
    lower.includes("404") ||
    lower.includes("not_found") ||
    lower.includes("not found") ||
    lower.includes("no longer available")
  ) {
    return true;
  }

  return false;
}

export interface GeminiKeyMeta {
  key: string;
  index: number;
  total: number;
  maskedKey: string;
}

/**
 * Executes an AI operation with automatic failover across all configured Gemini API keys.
 * If one key encounters a quota limit or error, the next key is tried automatically.
 * 
 * @param operation - Function that performs the API call given a GoogleGenAI client instance.
 * @returns The resolved result from the successful API key.
 */
export async function executeWithGeminiFailover<T>(
  operation: (client: GoogleGenAI, meta: GeminiKeyMeta) => Promise<T>
): Promise<T> {
  const keys = getGeminiApiKeys();
  if (keys.length === 0) {
    throw new Error(
      "No Google Gemini API key configured. Please set GOOGLE_GENAI_API_KEY or GOOGLE_GENAI_API_KEYS in your environment variables."
    );
  }

  let lastError: unknown = null;
  const totalKeys = keys.length;

  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const activeIndex = (currentKeyIndex + attempt) % totalKeys;
    const apiKey = keys[activeIndex];
    const client = getGeminiClientForKey(apiKey);
    const masked = maskApiKey(apiKey);

    try {
      const result = await operation(client, {
        key: apiKey,
        index: activeIndex,
        total: totalKeys,
        maskedKey: masked,
      });

      // On successful request, persist activeIndex for subsequent requests
      currentKeyIndex = activeIndex;
      return result;
    } catch (err) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[Gemini Failover] Key #${activeIndex + 1}/${totalKeys} (${masked}) error: ${errMsg}`
      );

      // If more keys are available and error is retryable, rotate to next subscription
      if (attempt < totalKeys - 1 && isRetryableGeminiError(err)) {
        console.info(
          `[Gemini Failover] Rotating to subscription key #${((activeIndex + 1) % totalKeys) + 1}/${totalKeys}...`
        );
        continue;
      }

      // If error is not retryable (e.g. fatal prompt schema mismatch), rethrow
      if (!isRetryableGeminiError(err)) {
        throw err;
      }
    }
  }

  throw new Error(
    `All ${totalKeys} configured Gemini API key subscriptions were exhausted. Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}

/**
 * Universal `ai` client interface with automatic multi-key failover and model fallback support.
 */
export const ai = {
  models: {
    generateContent: async (
      params: Parameters<GoogleGenAI["models"]["generateContent"]>[0]
    ): ReturnType<GoogleGenAI["models"]["generateContent"]> => {
      return executeWithGeminiFailover(async (client) => {
        const requestedModel = params.model || GEMINI_MODEL;
        const candidateModels = Array.from(new Set([requestedModel, ...FALLBACK_MODELS]));

        let lastModelErr: unknown = null;
        for (const modelName of candidateModels) {
          try {
            return await client.models.generateContent({
              ...params,
              model: modelName,
            });
          } catch (modelErr) {
            lastModelErr = modelErr;
            const msg = modelErr instanceof Error ? modelErr.message : String(modelErr);
            if (/404|503|429|not_found|not found|no longer available|unavailable|high demand|resource_exhausted/i.test(msg)) {
              console.warn(
                `[Gemini Model Fallback] Model "${modelName}" failed, trying next candidate model...`
              );
              continue;
            }
            throw modelErr;
          }
        }
        throw lastModelErr;
      });
    },
  },
};

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
  if (/quota|rate limit|resource_exhausted|exhausted/i.test(message)) {
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
  if (/quota|rate limit|resource_exhausted|exhausted/i.test(message)) {
    return {
      message: "AI quota exceeded on all configured subscriptions. Please check your Gemini API keys.",
      meta: { icon: DEFAULT_ERROR_ICON, variant: "warning" },
    };
  }
  if (/api key|authentication|unauthorized|permission/i.test(message)) {
    return {
      message: "The AI service could not be reached. Please check your API key subscriptions.",
      meta: { icon: DEFAULT_ERROR_ICON, variant: "danger" },
    };
  }
  if (/invalid byte sequence.*0x00|invalid byte sequence for encoding|null byte/i.test(message)) {
    return {
      message: "The input contains invalid null byte characters (0x00). Please ensure pasted text is clean plain text.",
      meta: { icon: DEFAULT_ERROR_ICON, variant: "warning" },
    };
  }
  return {
    message: message || "Failed to generate content",
    meta: { icon: DEFAULT_ERROR_ICON, variant: "danger" },
  };
}
