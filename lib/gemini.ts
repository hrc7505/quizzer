import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GOOGLE_GENAI_API_KEY;

if (!apiKey) {
  console.warn("GOOGLE_GENAI_API_KEY is not set!");
}

export const ai = new GoogleGenAI({ apiKey });

export const GEMINI_MODEL = "gemini-2.5-flash";
