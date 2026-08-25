"use client";

import * as React from "react";
import {
  dictionaries,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
  type TranslationKey,
  type LanguageOption,
} from "@/lib/i18n/dictionaries";

export interface LanguageContextType {
  /** Currently active language code */
  lang: SupportedLanguage;
  /** List of all supported languages */
  languages: LanguageOption[];
  /** Updates the active language and persists user preference */
  setLanguage: (newLang: SupportedLanguage) => void;
  /** Translation lookup helper */
  t: (key: TranslationKey, fallback?: string) => string;
}

const LanguageContext = React.createContext<LanguageContextType | null>(null);

const STORAGE_KEY = "quiz_preferred_language";

/**
 * LanguageProvider — manages global UI localization state, persistence,
 * and dynamic font attribute updates across the application.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<SupportedLanguage>("en");
  const [mounted, setMounted] = React.useState(false);

  // Initialize from localStorage or browser preferences
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage;
      if (saved && (saved === "en" || saved === "gu" || saved === "hi")) {
        setLangState(saved);
      }
      // Ensure html root remains clean default
      document.documentElement.removeAttribute("data-lang");
    } catch {
      // Ignore storage access errors in restricted modes
    }
    setMounted(true);
  }, []);

  const setLanguage = React.useCallback((newLang: SupportedLanguage) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // Ignore
    }
  }, []);

  const t = React.useCallback(
    (key: TranslationKey, fallback?: string): string => {
      const activeDict = dictionaries[lang] || dictionaries.en;
      const val = activeDict[key];
      if (val) return val;
      return fallback || dictionaries.en[key] || String(key);
    },
    [lang]
  );

  const value = React.useMemo(
    () => ({
      lang,
      languages: SUPPORTED_LANGUAGES,
      setLanguage,
      t,
    }),
    [lang, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Custom hook to access language state and translation function.
 */
export function useTranslation() {
  const context = React.useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside of provider
    return {
      lang: "en" as SupportedLanguage,
      languages: SUPPORTED_LANGUAGES,
      setLanguage: () => {},
      t: (key: TranslationKey, fallback?: string) =>
        dictionaries.en[key] || fallback || String(key),
    };
  }
  return context;
}

export default LanguageProvider;
