"use client";

import { ArrowLeft20Regular } from "@fluentui/react-icons";
import { LinkButton } from "@/components/ui/LinkButton";
import { DeepDiveBody } from "./DeepDiveBody";
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
 * Renders the saved elaboration from DB.
 */
export function DeepDiveDetail({ question }: DeepDiveDetailProps) {
  const styles = useDeepDiveDetailStyles();

  return (
    <div className={styles.root}>

      {/* Back navigation */}
      <LinkButton href="/deep-dives" appearance="subtle" icon={<ArrowLeft20Regular />} size="small" className={styles.backButton}>
        Back to Library
      </LinkButton>

      {/* Reusable Deep Dive Body content */}
      <DeepDiveBody question={question} />

    </div>
  );
}
