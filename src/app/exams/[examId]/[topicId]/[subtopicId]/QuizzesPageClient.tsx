"use client";

import { PageLayout } from "@/components/layouts/PageLayout";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { ContentHeader } from "@/components/layouts/ContentHeader";
import { QuizCardGrid } from "@/components/data-display/QuizCardGrid";
import { BookOpen } from "lucide-react";

interface QuizzesPageClientProps {
  examId: string;
  topicId: string;
  subtopicId: string;
  exam: {
    title: string;
  };
  topic: {
    title: string;
  };
  subtopic: {
    title: string;
    description: string | null;
    quizzes: Array<{
      id: string;
      title: string;
      difficulty: string;
      quizOrder: number;
      _count: { questions: number };
    }>;
  };
}

function QuizzesPageClient({ examId, topicId, subtopicId, exam, topic, subtopic }: QuizzesPageClientProps) {
  const breadcrumbItems = [
    { label: "Exams", href: "/exams" },
    { label: exam.title, href: `/exams/${examId}` },
    { label: topic.title, href: `/exams/${examId}/${topicId}` },
    { label: subtopic.title }
  ];

  return (
    <PageLayout>
      <Breadcrumbs items={breadcrumbItems} />
      <ContentHeader
        icon={<BookOpen />}
        variant="quiz"
        title={subtopic.title}
        description={subtopic.description}
      />
      <SectionHeading>Quizzes</SectionHeading>
      <QuizCardGrid quizzes={subtopic.quizzes} subtopicTitle={subtopic.title} basePath={`/exams/${examId}/${topicId}/${subtopicId}`} />
    </PageLayout>
  );
}

export { QuizzesPageClient };
