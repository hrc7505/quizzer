"use client";

import React from "react";
import { Loader2 } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { DeepDiveBody } from "@/components/data-display/DeepDiveBody";
import { ModelCapabilityError } from "@/components/ui/ModelCapabilityError";
import { getAiErrorMeta } from "@/lib/gemini";

import type { QuestionData } from "@/components/data-display/interfaces/QuizResults.interface";

interface DeepDivePanelProps {
  question: QuestionData | null;
  quiz: { id: string; title: string; difficulty?: string };
  initialElaboration?: string;
  initialError?: string;
  onSave?: (result: { loading: boolean; data?: string; error?: string }) => void;
}

export function DeepDivePanel({
  question,
  quiz,
  initialElaboration,
  initialError,
  onSave,
}: DeepDivePanelProps) {
  const initialLang = (question as { language?: string })?.language || "en";
  const [selectedLang, setSelectedLang] = React.useState<string>(initialLang);

  // Multi-language local cache so switching back and forth is instantaneous
  const [elaborationCache, setElaborationCache] = React.useState<Record<string, string>>(() => {
    return initialElaboration ? { [initialLang]: initialElaboration } : {};
  });

  const [loading, setLoading] = React.useState(!initialElaboration && !initialError);
  const [loadingLanguage, setLoadingLanguage] = React.useState(false);
  const [data, setData] = React.useState<string | undefined>(initialElaboration);
  const [error, setError] = React.useState<string | undefined>(initialError);

  const onSaveRef = React.useRef(onSave);
  React.useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  // Initial load for current language if not pre-seeded
  React.useEffect(() => {
    if (initialElaboration || initialError || !question) return;

    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/admin/elaborate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId: question.id, targetLanguage: initialLang }),
          signal: controller.signal,
        });
        const json = await res.json();
        if (cancelled) return;
        if (json.success) {
          setData(json.markdown);
          setElaborationCache((prev) => ({ ...prev, [initialLang]: json.markdown }));
          onSaveRef.current?.({ loading: false, data: json.markdown });
        } else {
          setError(json.error);
          onSaveRef.current?.({ loading: false, error: json.error });
        }
      } catch {
        if (cancelled) return;
        setError("Failed to load deep dive.");
        onSaveRef.current?.({ loading: false, error: "Failed to load deep dive." });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [question, initialElaboration, initialError, initialLang]);

  // Handle switching explanation language on the fly
  const handleSelectLanguage = React.useCallback(
    async (targetLang: string) => {
      if (!question || targetLang === selectedLang) return;
      setSelectedLang(targetLang);
      setError(undefined);

      // Check if already in cache
      if (elaborationCache[targetLang]) {
        setData(elaborationCache[targetLang]);
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
          setData(json.markdown);
          setElaborationCache((prev) => ({ ...prev, [targetLang]: json.markdown }));
          if (targetLang === initialLang) {
            onSaveRef.current?.({ loading: false, data: json.markdown });
          }
        } else {
          setError(json.error || `Failed to generate deep dive in ${targetLang}.`);
        }
      } catch {
        setError(`Failed to generate deep dive in ${targetLang}.`);
      } finally {
        setLoadingLanguage(false);
      }
    },
    [question, selectedLang, elaborationCache, initialLang]
  );

  if (!question) return null;

  return (
    <div className="flex flex-col h-full">
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span>AI is formulating detailed concept breakdown…</span>
        </div>
      )}
      {error && (() => {
        const meta = getAiErrorMeta(error);
        if (meta.icon === "image-off") {
          return <ModelCapabilityError message={error} />;
        }
        return (
          <Alert variant={meta.variant} title="Error">
            {error}
          </Alert>
        );
      })()}
      {!loading && question && (
        <DeepDiveBody
          question={{
            ...question,
            elaboration: data || null,
            language: selectedLang,
            quiz: { id: quiz.id, title: quiz.title, difficulty: quiz.difficulty || "Medium" },
            topic: question.topic || { id: "", title: "General" },
          }}
          selectedLanguage={selectedLang}
          onSelectLanguage={handleSelectLanguage}
          loadingLanguage={loadingLanguage}
        />
      )}
    </div>
  );
}

export default DeepDivePanel;