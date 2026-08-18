import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";

import { authOptions, SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidateQuizAndRelated } from "@/lib/quiz-routing";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as SessionUser).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { ids } = body as { ids?: string[] };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Missing quiz ids" }, { status: 400 });
    }

    // Find all quizzes to be deleted to retrieve linked topics for revalidation
    const existingQuizzes = await prisma.quiz.findMany({
      where: { id: { in: ids } },
      include: { topics: { select: { id: true } } },
    });

    const topicIds = Array.from(
      new Set(existingQuizzes.flatMap((q) => q.topics.map((t) => t.id)))
    );

    // Delete in safe order using transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete all user attempts on these quizzes
      await tx.userAnswer.deleteMany({
        where: { attempt: { quizId: { in: ids } } },
      });
      await tx.quizAttempt.deleteMany({
        where: { quizId: { in: ids } },
      });

      // 2. Delete all questions belonging to these quizzes
      await tx.question.deleteMany({
        where: { quizId: { in: ids } },
      });

      // 3. Delete quizzes
      await tx.quiz.deleteMany({
        where: { id: { in: ids } },
      });
    });

    // Revalidate paths
    revalidatePath("/exams");
    revalidatePath("/admin/manage/quizzes");
    for (const tId of topicIds) {
      revalidatePath(`/topics/${tId}`);
      revalidatePath(`/admin/manage/subtopics/${tId}/quizzes`);
    }
    for (const qId of ids) {
      await revalidateQuizAndRelated(qId);
    }

    return NextResponse.json({
      success: true,
      deletedCount: ids.length,
      message: `Successfully deleted ${ids.length} quiz(zes).`,
    });
  } catch (error) {
    console.error("Bulk delete quizzes failed:", error);
    return NextResponse.json({ error: "Failed to delete quizzes" }, { status: 500 });
  }
}
