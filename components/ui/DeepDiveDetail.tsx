"use client";

import { useState } from "react";
import { Text, Button, Badge, Card, Spinner, MessageBar, MessageBarBody } from "@fluentui/react-components";
import { ArrowLeft20Regular, ArrowSync20Regular, Brain20Regular, BookOpen20Regular } from "@fluentui/react-icons";
import { LinkButton } from "./LinkButton";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

interface Question {
  id: string;
  text: string;
  correctAnswer: string;
  options: string[];
  elaboration: string | null;
  topic: { id: string; title: string };
  quiz: { id: string; title: string; difficulty: string } | null;
}

interface DeepDiveDetailProps {
  /** Full question record including elaboration from DB. */
  question: Question;
}

/**
 * DeepDiveDetail — individual deep dive page client component.
 * Renders the saved elaboration from DB and provides a Regenerate action.
 */
export function DeepDiveDetail({ question }: DeepDiveDetailProps) {
  const router = useRouter();
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const difficultyColor = (d: string): "success" | "warning" | "danger" =>
    d === "Easy" ? "success" : d === "Hard" ? "danger" : "warning";

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/elaborate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, force: true })
      });
      const json = await res.json();
      if (json.success) {
        router.refresh(); // Re-run server component to show new content
      } else {
        setError(json.error || "Failed to regenerate");
      }
    } catch {
      setError("Network error during regeneration");
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "28px",
        fontFamily: "var(--font-winky)",
      }}
    >

      {/* Back navigation */}
      <LinkButton href="/deep-dives" appearance="subtle" icon={<ArrowLeft20Regular />} size="small" style={{ color: "#667eea", width: "fit-content" }}>
        Back to Library
      </LinkButton>

      {/* Header card */}
      <Card style={{
        borderRadius: "16px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 4px 16px rgba(102,126,234,0.08)",
        overflow: "hidden",
        padding: 0
      }}>
        {/* Gradient banner */}
        <div style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "24px 28px",
          display: "flex", alignItems: "flex-start", gap: "16px"
        }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "12px",
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0
          }}>
            <Brain20Regular style={{ color: "white", fontSize: "24px" }} />
          </div>
          <div style={{ flex: 1 }}>
            <Text size={600} weight="bold" style={{ color: "white", display: "block", lineHeight: "1.3" }}>
              {question.text}
            </Text>
          </div>
        </div>

        {/* Meta + actions row */}
        <div style={{
          padding: "16px 28px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "12px",
          borderBottom: "1px solid #f3f4f6"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <BookOpen20Regular style={{ color: "#667eea" }} />
            <Text size={300} weight="semibold" style={{ color: "#374151" }}>{question.topic.title}</Text>
            {question.quiz && (
              <>
                <Text size={200} style={{ color: "#9ca3af" }}>·</Text>
                <Badge appearance="tint" color="informative">{question.quiz.title}</Badge>
                <Badge appearance="filled" color={difficultyColor(question.quiz.difficulty)}>
                  {question.quiz.difficulty}
                </Badge>
              </>
            )}
          </div>
          <Button
            appearance="outline"
            icon={regenerating ? <Spinner size="tiny" /> : <ArrowSync20Regular />}
            onClick={handleRegenerate}
            disabled={regenerating}
            size="small"
          >
            {regenerating ? "Regenerating…" : "Regenerate"}
          </Button>
        </div>

        {/* Correct answer */}
        <div style={{ padding: "12px 28px", background: "#f0fdf4", borderBottom: "1px solid #e5e7eb" }}>
          <Text size={300} style={{ color: "#15803d" }}>
            <strong>✓ Correct Answer:</strong> {question.correctAnswer}
          </Text>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      {/* Elaboration content */}
      {question.elaboration ? (
        <Card style={{
          borderRadius: "16px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          padding: "32px"
        }}>
          <div className="markdown-body" style={{ lineHeight: "1.7", color: "#1f2937" }}>
            <ReactMarkdown>{question.elaboration}</ReactMarkdown>
          </div>
        </Card>
      ) : (
        <Card style={{
          borderRadius: "16px", padding: "48px",
          textAlign: "center", border: "1px dashed #d1d5db"
        }}>
          <Text size={400} style={{ color: "#9ca3af" }}>
            No elaboration saved yet. Use the <strong>🤖 AI Deep Dive</strong> button in quiz results to generate one.
          </Text>
        </Card>
      )}

    </div>
  );
}
