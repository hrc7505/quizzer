"use client";

import { useState } from "react";
import { Text, Button, Badge, Card, Spinner, MessageBar, MessageBarBody } from "@fluentui/react-components";
import { ArrowLeft20Regular, ArrowSync20Regular, Brain20Regular, BookOpen20Regular } from "@fluentui/react-icons";
import { LinkButton } from "./LinkButton";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { useDeepDiveDetailStyles } from "./styles/useDeepDiveDetailStyles";

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
  const styles = useDeepDiveDetailStyles();
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
    <div className={styles.root}>

      {/* Back navigation */}
      <LinkButton href="/deep-dives" appearance="subtle" icon={<ArrowLeft20Regular />} size="small" className={styles.backButton}>
        Back to Library
      </LinkButton>

      {/* Header card */}
      <Card className={styles.headerCard}>
        {/* Gradient banner */}
        <div className={styles.banner}>
          <div className={styles.bannerIconContainer}>
            <Brain20Regular className={styles.bannerIcon} />
          </div>
          <div>
            <Text size={600} weight="bold" className={styles.bannerTitle}>
              {question.text}
            </Text>
          </div>
        </div>

        {/* Meta + actions row */}
        <div className={styles.metaRow}>
          <div className={styles.metaLeft}>
            <BookOpen20Regular className={styles.metaIcon} />
            <Text size={300} weight="semibold" className={styles.metaTopic}>{question.topic.title}</Text>
            {question.quiz && (
              <>
                <Text size={200} className={styles.metaSeparator}>·</Text>
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
        <div className={styles.correctAnswerRow}>
          <Text size={300} className={styles.correctAnswerText}>
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
        <Card className={styles.elaborationCard}>
          <div className={styles.markdownBody}>
            <ReactMarkdown>{question.elaboration}</ReactMarkdown>
          </div>
        </Card>
      ) : (
        <Card className={styles.emptyCard}>
          <Text size={400} className={styles.emptyText}>
            No elaboration saved yet. Use the <strong>🤖 AI Deep Dive</strong> button in quiz results to generate one.
          </Text>
        </Card>
      )}

    </div>
  );
}
