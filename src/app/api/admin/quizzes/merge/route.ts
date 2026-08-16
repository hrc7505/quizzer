import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

interface MergeQuizzesRequestBody {
  targetQuizId: string;
  sourceQuizIds: string[];
  targetTitle?: string;
}

/**
 * POST /api/admin/quizzes/merge
 * Atomically merges multiple quizzes into a designated target quiz:
 * 1. Moves all questions from source quizzes to the target quiz.
 * 2. Moves all user attempts and attempt answers to the target quiz.
 * 3. Associates all topics linked to source quizzes with the target quiz.
 * 4. Deletes the source quizzes.
 * 5. Optionally updates the target quiz title.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as SessionUser).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: MergeQuizzesRequestBody = await req.json();
    const { targetQuizId, sourceQuizIds, targetTitle } = body;

    if (!targetQuizId || !Array.isArray(sourceQuizIds) || sourceQuizIds.length === 0) {
      return NextResponse.json(
        { error: "Target quiz ID and at least one source quiz ID are required." },
        { status: 400 }
      );
    }

    // Filter out targetQuizId from sourceQuizIds if accidentally included
    const cleanSourceIds = Array.from(
      new Set(sourceQuizIds.filter((id) => id && id !== targetQuizId))
    );

    if (cleanSourceIds.length === 0) {
      return NextResponse.json(
        { error: "At least one distinct source quiz is required to merge." },
        { status: 400 }
      );
    }

    // Verify target quiz exists
    const targetQuiz = await prisma.quiz.findUnique({
      where: { id: targetQuizId },
      include: {
        topics: { select: { id: true } },
        _count: { select: { questions: true } },
      },
    });

    if (!targetQuiz) {
      return NextResponse.json({ error: "Target quiz not found." }, { status: 404 });
    }

    // Verify source quizzes exist and retrieve their topic relationships
    const sourceQuizzes = await prisma.quiz.findMany({
      where: { id: { in: cleanSourceIds } },
      include: {
        topics: { select: { id: true } },
        _count: { select: { questions: true } },
      },
    });

    if (sourceQuizzes.length === 0) {
      return NextResponse.json({ error: "No valid source quizzes found to merge." }, { status: 404 });
    }

    const totalMovedQuestions = sourceQuizzes.reduce((sum, q) => sum + q._count.questions, 0);

    // Collect all unique topic IDs from source quizzes to link with target quiz
    const existingTargetTopicIds = new Set(targetQuiz.topics.map((t) => t.id));
    const newTopicIdsToConnect: string[] = [];

    for (const sq of sourceQuizzes) {
      for (const t of sq.topics) {
        if (!existingTargetTopicIds.has(t.id) && !newTopicIdsToConnect.includes(t.id)) {
          newTopicIdsToConnect.push(t.id);
        }
      }
    }

    // Perform atomic merge transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Move questions from source quizzes to target quiz
      await tx.question.updateMany({
        where: { quizId: { in: cleanSourceIds } },
        data: { quizId: targetQuizId },
      });

      // 2. Move quiz attempts from source quizzes to target quiz
      await tx.quizAttempt.updateMany({
        where: { quizId: { in: cleanSourceIds } },
        data: { quizId: targetQuizId },
      });

      // 3. Connect missing topics to target quiz
      if (newTopicIdsToConnect.length > 0) {
        await tx.quiz.update({
          where: { id: targetQuizId },
          data: {
            topics: {
              connect: newTopicIdsToConnect.map((id) => ({ id })),
            },
          },
        });
      }

      // 4. Update target quiz title if provided and changed
      if (targetTitle && targetTitle.trim() && targetTitle.trim() !== targetQuiz.title) {
        await tx.quiz.update({
          where: { id: targetQuizId },
          data: { title: targetTitle.trim() },
        });
      }

      // 5. Delete source quizzes (their questions and attempts are now re-assigned)
      await tx.quiz.deleteMany({
        where: { id: { in: cleanSourceIds } },
      });

      // 6. Return updated target quiz
      return tx.quiz.findUnique({
        where: { id: targetQuizId },
        include: {
          _count: { select: { questions: true, attempts: true } },
        },
      });
    });

    // Revalidate affected administrative and public paths
    revalidatePath("/admin/manage/quizzes");
    revalidatePath(`/admin/manage/quizzes/${targetQuizId}/questions`);
    revalidatePath(`/quiz/${targetQuizId}`);
    revalidatePath("/exams");
    revalidatePath("/topics");

    return NextResponse.json({
      success: true,
      message: `Successfully merged ${cleanSourceIds.length} quizzes into "${result?.title || targetQuiz.title}".`,
      mergedQuizId: targetQuizId,
      questionsTransferred: totalMovedQuestions,
      finalQuestionCount: result?._count.questions ?? 0,
      deletedQuizzesCount: cleanSourceIds.length,
    });
  } catch (error) {
    console.error("Quiz merge error:", error);
    return NextResponse.json(
      {
        error: "Failed to merge quizzes",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
