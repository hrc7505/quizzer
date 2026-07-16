"use client";

import { Text, Badge, Card } from "@fluentui/react-components";
import { Brain20Regular, BookOpen20Regular } from "@fluentui/react-icons";
import ReactMarkdown from "react-markdown";
import { difficultyColor } from "@/lib/format";
import { NoData } from "./NoData";
import { useDeepDiveBodyStyles } from "./styles/useDeepDiveBodyStyles";
import { DeepDiveBodyProps } from "./interfaces/DeepDiveBody.interface";

/**
 * DeepDiveBody component displays the full detail of a deep dive,
 * including question banner, topic, quiz title/difficulty, correct answer,
 * and the AI-generated elaboration content.
 */
export function DeepDiveBody({ question }: DeepDiveBodyProps) {
  const styles = useDeepDiveBodyStyles();

  return (
    <>
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

        {/* Meta + details row */}
        <div className={styles.metaRow}>
          <div className={styles.metaLeft}>
            <BookOpen20Regular className={styles.metaIcon} />
            <Text size={300} weight="semibold" className={styles.metaTopic}>
              {question.topic.title === "__internal__" ? "General" : question.topic.title}
            </Text>
            {question.quiz && (
              <>
                <Text size={200} className={styles.metaSeparator}>·</Text>
                <Badge appearance="tint" color="informative" className={styles.badge}>{question.quiz.title}</Badge>
                <Badge appearance="filled" color={difficultyColor(question.quiz.difficulty)}>
                  {question.quiz.difficulty}
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Correct answer */}
        <div className={styles.correctAnswerRow}>
          <Text size={300} className={styles.correctAnswerText}>
            <strong>✓ Correct Answer:</strong> {question.correctAnswer}
          </Text>
        </div>
      </Card>

      {/* Elaboration content */}
      {question.elaboration ? (
        <Card className={styles.elaborationCard}>
          <div className={styles.markdownBody}>
            <ReactMarkdown>{question.elaboration}</ReactMarkdown>
          </div>
        </Card>
      ) : (
        <NoData
          title="No elaboration saved yet."
          description="Use the 🤖 AI Deep Dive button in quiz results to generate one."
          icon="brain"
        />
      )}
    </>
  );
}
