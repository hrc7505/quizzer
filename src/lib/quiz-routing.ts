import { revalidatePath } from "next/cache";

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

/**
 * Revalidates the public static pages affected by a change to a given quiz
 * (its canonical quiz-play page plus the parent topic/exam listing pages and
 * the deep-dives library). Used after any CRUD that mutates quizzes or their
 * questions so statically generated pages pick up the change.
 */
export async function revalidateQuizAndRelated(quizId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      topics: {
        include: {
          parentTopics: { include: { exams: { select: { id: true } } } },
          exams: { select: { id: true } },
        },
      },
    },
  });

  if (!quiz) return;

  const linkedTopic = quiz.topics[0];
  if (!linkedTopic) return;

  const parentTopic = linkedTopic.parentTopics?.[0] ?? linkedTopic;
  const exam = parentTopic.exams?.[0] ?? linkedTopic.exams?.[0];

  if (exam) {
    revalidatePath(`/exams/${exam.id}/${parentTopic.id}/${linkedTopic.id}/quiz/${quiz.id}`);
    revalidatePath(`/exams/${exam.id}/${parentTopic.id}/${linkedTopic.id}`);
    revalidatePath(`/exams/${exam.id}/${parentTopic.id}`);
    revalidatePath(`/exams/${exam.id}`);
    revalidatePath(`/topics/${linkedTopic.id}`);
  } else if (parentTopic.id !== linkedTopic.id) {
    revalidatePath(`/topics/${parentTopic.id}/${linkedTopic.id}/quiz/${quiz.id}`);
    revalidatePath(`/topics/${parentTopic.id}/${linkedTopic.id}`);
    revalidatePath(`/topics/${parentTopic.id}`);
    revalidatePath(`/topics/${linkedTopic.id}`);
  } else {
    revalidatePath(`/topics/${linkedTopic.id}`);
  }
}

/**
 * Accurately computes the distinct number of canonical questions in a quiz,
 * preventing double-counting when translations (Gujarati/Hindi) are present.
 */
export function computeCanonicalQuestionCount(
  questions?: { language?: string | null; text?: string | null; sourceQuestionId?: string | null }[] | null
): number {
  if (!questions || questions.length === 0) return 0;

  // 1. If base questions are explicitly tracked with sourceQuestionId = null
  const baseQuestions = questions.filter((q) => !q.sourceQuestionId);
  if (baseQuestions.length > 0) {
    return baseQuestions.length;
  }

  // 2. Fallback: group and count maximum questions per language track
  const enCount = questions.filter(
    (q) =>
      q.language === "en" ||
      (!q.language && !/[\u0A80-\u0AFF]/.test(q.text || "") && !/[\u0900-\u097F]/.test(q.text || ""))
  ).length;
  const guCount = questions.filter(
    (q) => q.language === "gu" || (q.text && /[\u0A80-\u0AFF]/.test(q.text))
  ).length;
  const hiCount = questions.filter(
    (q) => q.language === "hi" || (q.text && /[\u0900-\u097F]/.test(q.text))
  ).length;

  return Math.max(enCount, guCount, hiCount, 1);
}


