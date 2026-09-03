/**
 * Language enumerations, configuration types, and utilities for the application.
 */

/**
 * Standard supported language codes across Quizzer.
 */
export enum LanguageCode {
  ENGLISH = "en",
  GUJARATI = "gu",
  HINDI = "hi",
}

/**
 * Type alias representing supported language code strings.
 */
export type SupportedLanguageCode = "en" | "gu" | "hi";

/**
 * Language metadata descriptor.
 */
export interface LanguageConfig {
  code: SupportedLanguageCode;
  label: string;
  nativeLabel: string;
  glyph: string;
  promptName: string;
  typographyDesc: string;
}

/**
 * Canonical registry of supported translation target languages with native script glyphs.
 */
export const TRANSLATION_LANGUAGES: Record<SupportedLanguageCode, LanguageConfig> = {
  [LanguageCode.GUJARATI]: {
    code: LanguageCode.GUJARATI,
    label: "Gujarati",
    nativeLabel: "ગુજરાતી",
    glyph: "અ",
    promptName: "Gujarati (ગુજરાતી)",
    typographyDesc: "Anek Gujarati font typography",
  },
  [LanguageCode.HINDI]: {
    code: LanguageCode.HINDI,
    label: "Hindi",
    nativeLabel: "हिन्दी",
    glyph: "अ",
    promptName: "Hindi (हिन्दी)",
    typographyDesc: "Hind font typography",
  },
  [LanguageCode.ENGLISH]: {
    code: LanguageCode.ENGLISH,
    label: "English",
    nativeLabel: "English",
    glyph: "A",
    promptName: "English",
    typographyDesc: "Winky Sans font typography",
  },
};

/**
 * Array list of translation languages for UI rendering.
 */
export const TRANSLATION_LANGUAGES_LIST: LanguageConfig[] = [
  TRANSLATION_LANGUAGES[LanguageCode.GUJARATI],
  TRANSLATION_LANGUAGES[LanguageCode.HINDI],
  TRANSLATION_LANGUAGES[LanguageCode.ENGLISH],
];

/**
 * Helper to get the AI prompt-friendly display name for a language code.
 *
 * @param code Language code (e.g. 'gu', 'hi', 'en')
 * @returns Formatted language name for LLM system prompts
 */
export function getLanguagePromptName(code: string): string {
  const lang = TRANSLATION_LANGUAGES[code as SupportedLanguageCode];
  return lang ? lang.promptName : "English";
}

/**
 * Helper to get human label for a language code.
 *
 * @param code Language code (e.g. 'gu', 'hi', 'en')
 * @returns Human label like 'Gujarati' or 'English'
 */
export function getLanguageLabel(code: string): string {
  const lang = TRANSLATION_LANGUAGES[code as SupportedLanguageCode];
  return lang ? lang.label : "English";
}

/**
 * Helper to get native script glyph badge for a language code.
 *
 * @param code Language code (e.g. 'gu', 'hi', 'en')
 * @returns Native character glyph e.g. 'A', 'અ', 'अ'
 */
export function getLanguageGlyph(code: string): string {
  const lang = TRANSLATION_LANGUAGES[code as SupportedLanguageCode];
  return lang ? lang.glyph : "A";
}
