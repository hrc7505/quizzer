import { prisma } from "@/lib/prisma";

export async function resolveQuizRoute(quizId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      topics: {
        include: {
          parentTopics: {
            include: {
              exams: true,
            },
          },
          exams: true,
        },
      },
    },
  });

  if (!quiz || quiz.topics.length === 0) {
    return null;
  }

  const linkedTopic = quiz.topics[0];
  const parentTopic = linkedTopic.parentTopics?.[0] ?? linkedTopic;
  const exam = parentTopic.exams?.[0] ?? linkedTopic.exams?.[0];

  if (exam) {
    return `/exams/${exam.id}/${parentTopic.id}/${linkedTopic.id}/quiz/${quiz.id}`;
  }

  if (parentTopic.id === linkedTopic.id) {
    return null;
  }

  return `/topics/${parentTopic.id}/${linkedTopic.id}/quiz/${quiz.id}`;
}
