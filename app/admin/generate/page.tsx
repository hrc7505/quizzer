"use client";

import { GenerateQuizForm } from "@/components/ui/GenerateQuizForm";
import { Text } from "@fluentui/react-components";
import { useRouter } from "next/navigation";
import { useGeneratePageStyles } from "@/components/ui/styles/useGeneratePageStyles";

/**
 * Standalone Generate Quiz page.
 * Uses the same GenerateQuizForm embedded in admin layout.
 */
export default function GenerateQuizPage() {
  const styles = useGeneratePageStyles();
  const router = useRouter();

  return (
    <div className={styles.root}>
      <Text size={700} weight="bold" className={styles.title}>Generate New Quiz</Text>
      <Text size={300} className={styles.description}>
        Enter a title and the AI will generate multiple-choice questions. The quiz will be created standalone — link it to subtopics from the Quizzes management page.
      </Text>
      
      <GenerateQuizForm onSuccess={() => router.push("/admin/manage/quizzes")} />
    </div>
  );
}
