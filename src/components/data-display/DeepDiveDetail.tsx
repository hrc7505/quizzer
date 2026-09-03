"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";

import { LinkButton } from "@/components/ui/LinkButton";
import { DeepDiveBody } from "@/components/data-display/DeepDiveBody";

interface Question {
  id: string;
  text: string;
  correctAnswer: string;
  options: string[];
  elaboration: string | null;
  language?: string;
  topic: { id: string; title: string };
  quiz: { id: string; title: string; difficulty: string } | null;
}

interface DeepDiveDetailProps {
  /** Full question record including elaboration from DB. */
  question: Question;
}

/**
 * DeepDiveDetail — individual deep dive page client component.
 * Renders the saved elaboration from DB with real-time multi-language switching.
 */
export function DeepDiveDetail({ question }: DeepDiveDetailProps) {
  const initialLang = question.language || "en";
  const [selectedLang, setSelectedLang] = React.useState<string>(initialLang);
  const [loadingLanguage, setLoadingLanguage] = React.useState(false);

  const [elaborationCache, setElaborationCache] = React.useState<Record<string, string>>(() => {
    return question.elaboration ? { [initialLang]: question.elaboration } : {};
  });

  const handleSelectLanguage = React.useCallback(
    async (targetLang: string) => {
      if (targetLang === selectedLang) return;
      setSelectedLang(targetLang);

      if (elaborationCache[targetLang]) {
        return;
      }

      setLoadingLanguage(true);
      try {
        const res = await fetch("/api/admin/elaborate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId: question.id, targetLanguage: targetLang }),
        });
        const json = await res.json();
        if (json.success && json.markdown) {
          setElaborationCache((prev) => ({ ...prev, [targetLang]: json.markdown }));
        }
      } catch (err) {
        console.error("Failed to generate elaboration in target language:", err);
      } finally {
        setLoadingLanguage(false);
      }
    },
    [question.id, selectedLang, elaborationCache]
  );

  const currentElaboration = elaborationCache[selectedLang] || (selectedLang === initialLang ? question.elaboration : null);

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Back navigation */}
      <div className="flex">
        <LinkButton
          href="/deep-dives"
          variant="ghost"
          size="sm"
          className="gap-1.5 h-8 px-3 font-semibold text-xs border border-border/40 hover:bg-surface-hover hover:border-border/80"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Library</span>
        </LinkButton>
      </div>

      {/* Reusable Deep Dive Body content with language switcher */}
      <DeepDiveBody
        question={{
          ...question,
          language: selectedLang,
          elaboration: currentElaboration,
        }}
        selectedLanguage={selectedLang}
        onSelectLanguage={handleSelectLanguage}
        loadingLanguage={loadingLanguage}
      />
    </div>
  );
}
