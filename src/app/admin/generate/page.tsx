"use client";

import { GenerateQuizForm } from "@/components/forms/GenerateQuizForm";
import { useRouter } from "next/navigation";

/**
 * Standalone Generate Quiz page.
 * Uses the same GenerateQuizForm embedded in admin layout.
 */
export default function GenerateQuizPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto py-6">
      <div className="flex flex-col gap-1.5 border-b border-border/80 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Generate New Quiz</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Enter a title and the AI will generate multiple-choice questions. The quiz will be created standalone — link it to subtopics from the Quizzes management page.
        </p>
      </div>
      
      <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-sm">
        <GenerateQuizForm onSuccess={() => router.push("/admin/manage/quizzes")} />
      </div>
    </div>
  );
}
