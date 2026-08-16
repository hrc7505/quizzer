import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { ExamTopicsManager } from "@/components/data-display/ExamTopicsManager";

export const dynamic = "force-dynamic";

interface ManageExamTopicsPageProps {
  params: Promise<{ examId: string }>;
}

export async function generateMetadata({ params }: ManageExamTopicsPageProps) {
  const { examId } = await params;
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  return {
    title: exam ? `${exam.title} · Main Topics` : "Manage Main Topics",
    description: "Manage main topics for this exam.",
  };
}

/**
 * Server page: /admin/manage/exams/[examId]/topics
 * Loads the parent Exam and its linked main topics, plus available standalone topics for linking.
 */
export default async function ManageExamTopicsPage({ params }: ManageExamTopicsPageProps) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/api/auth/signin");
  }

  const { examId } = await params;

  const [exam, standaloneTopics] = await Promise.all([
    prisma.exam.findUnique({
      where: { id: examId },
      include: {
        topics: {
          include: {
            subtopics: { select: { id: true, title: true } },
            quizzes: { select: { id: true, title: true } },
            _count: { select: { subtopics: true, quizzes: true, questions: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.topic.findMany({
      where: {
        parentTopics: { none: {} },
        exams: { none: { id: examId } },
      },
      select: {
        id: true,
        title: true,
        description: true,
      },
      orderBy: { title: "asc" },
    }),
  ]);

  if (!exam) {
    notFound();
  }

  return (
    <div>
      <ExamTopicsManager exam={exam} availableStandaloneTopics={standaloneTopics} />
    </div>
  );
}
