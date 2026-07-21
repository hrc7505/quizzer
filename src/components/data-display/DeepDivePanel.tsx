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
}

export function DeepDivePanel({
  question,
  quiz,
  initialElaboration,
  initialError,
}: DeepDivePanelProps) {
  const [loading, setLoading] = React.useState(!initialElaboration && !initialError);
  const [data, setData] = React.useState<string | undefined>(initialElaboration);
  const [error, setError] = React.useState<string | undefined>(initialError);

  React.useEffect(() => {
    if (initialElaboration || initialError) return;
    if (!question) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/admin/elaborate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId: question.id }),
          signal: controller.signal,
        });
        const json = await res.json();
        if (json.success) setData(json.markdown);
        else setError(json.error);
      } catch {
        setError("Failed to load deep dive.");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
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