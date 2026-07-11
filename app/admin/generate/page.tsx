"use client";

import { GenerateQuizForm } from "@/components/ui/GenerateQuizForm";
import { Text } from "@fluentui/react-components";
import { useRouter } from "next/navigation";

/**
 * Standalone Generate Quiz page.
 * Uses the same GenerateQuizForm embedded in admin layout.
 */
export default function GenerateQuizPage() {
  const router = useRouter();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Text size={700} weight="bold">Generate New Quiz</Text>
      <Text size={300} style={{ color: "#6b7280" }}>
        Enter a title and the AI will generate multiple-choice questions. The quiz will be created standalone — link it to subtopics from the Quizzes management page.
      </Text>
      
      <GenerateQuizForm onSuccess={() => router.push("/admin/manage/quizzes")} />
    </div>
  );
}
