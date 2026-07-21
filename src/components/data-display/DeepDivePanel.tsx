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
  const [loading, setLoading] = React.useState(!initialElaboration && !initialError);
  const [data, setData] = React.useState<string | undefined>(initialElaboration);
  const [error, setError] = React.useState<string | undefined>(initialError);

  const onSaveRef = React.useRef(onSave);

  React.useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  React.useEffect(() => {
    if (initialElaboration || initialError || !question) return;

    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/admin/elaborate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId: question.id }),
          signal: controller.signal,
        });
        const json = await res.json();
        if (cancelled) return;
        if (json.success) {
          setData(json.markdown);
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
  }, [question, initialElaboration, initialError]);

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
      {data && question && (
        <DeepDiveBody
          question={{
            ...question,
            elaboration: data,
            quiz: { id: quiz.id, title: quiz.title, difficulty: quiz.difficulty || "Medium" },
            topic: question.topic || { id: "", title: "General" },
          }}
        />
      )}
    </div>
  );
}

export default DeepDivePanel;