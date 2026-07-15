import { QuizzesPageClient } from "./QuizzesPageClient";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const revalidate = 60;

interface QuizzesPageProps {
  params: Promise<{ examId: string; topicId: string; subtopicId: string }>;
}

export async function generateStaticParams() {
  const subtopics = await prisma.topic.findMany({
    where: { parentTopics: { some: {} }, exams: { some: {} } },
    include: {
      parentTopics: { include: { exams: { select: { id: true } } } }
    }
  });
  return subtopics.map(sub => {
    const parent = sub.parentTopics[0];
    const exam = parent?.exams[0];
    return {
      examId: exam?.id ?? "",
      topicId: parent?.id ?? "",
      subtopicId: sub.id
    };
  });
}

export async function generateMetadata({ params }: QuizzesPageProps) {
  const { subtopicId } = await params;
  const subtopic = await prisma.topic.findUnique({ where: { id: subtopicId } });
  return {
    title: subtopic ? `${subtopic.title} · Quizzes` : "Quizzes",
    description: subtopic?.description || "Browse quizzes."
  };
}

async function getPageData(examId: string, topicId: string, subtopicId: string) {
  const [exam, topic, subtopic] = await Promise.all([
    prisma.exam.findUnique({ where: { id: examId } }),
    prisma.topic.findUnique({ where: { id: topicId } }),
    prisma.topic.findUnique({
      where: { id: subtopicId },
      include: {
        quizzes: {
          where: { questions: { some: {} } },
          include: { _count: { select: { questions: true } } },
          orderBy: { quizOrder: "asc" }
        }
      }
    })
  ]);
  return { exam, topic, subtopic };
}

export default async function TopicQuizzesPage({ params }: QuizzesPageProps) {
  const { examId, topicId, subtopicId } = await params;
  const { exam, topic, subtopic } = await getPageData(examId, topicId, subtopicId);

  if (!exam || !topic || !subtopic) {
    notFound();
  }

  return <QuizzesPageClient examId={examId} topicId={topicId} subtopicId={subtopicId} exam={exam} topic={topic} subtopic={subtopic} />;
}
