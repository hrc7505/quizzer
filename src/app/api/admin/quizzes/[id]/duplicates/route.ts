import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { revalidateQuizAndRelated } from "@/lib/quiz-routing";

/**
 * Normalizes question text for duplicate detection:
 * - Lowercases
 * - Removes leading question numbers (e.g. "1. ", "45) ")
 * - Removes punctuation and excess whitespace
 */
function normalizeQuestionForComparison(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/^(?:q(?:uestion)?[\.\:\s]*)?\d+[\.\)\:\-\]]\s+/gi, "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'।]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Computes a completeness score for a question so the richest version is prioritized as primary.
 */
function getQuestionCompletenessScore(q: {
  elaboration?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  hint?: string | null;
}): number {
  let score = 0;
  if (q.elaboration && q.elaboration.trim().length > 0) score += 10;
  if (q.imageUrl && q.imageUrl.trim().length > 0) score += 5;
  if (q.description && q.description.trim().length > 0) score += 3;
  if (q.hint && q.hint.trim().length > 0) score += 2;
  return score;
}

/**
 * GET /api/admin/quizzes/[id]/duplicates
 * Scans all questions belonging to a quiz and returns duplicate clusters.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { id: "asc" },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const groupsMap = new Map<string, typeof quiz.questions>();

    for (const q of quiz.questions) {
      const norm = normalizeQuestionForComparison(q.text);
      if (!norm) continue;

      // Group by normalized text key
      const existing = groupsMap.get(norm) || [];
      existing.push(q);
      groupsMap.set(norm, existing);
    }

    // Filter to clusters having >= 2 questions
    const duplicateGroups: Array<{
      key: string;
      primaryQuestionId: string;
      questions: typeof quiz.questions;
      duplicateCount: number;
    }> = [];

    let totalDuplicates = 0;

    for (const [key, questions] of groupsMap.entries()) {
      if (questions.length > 1) {
        // Sort questions so the most complete one is first (primary)
        const sorted = [...questions].sort((a, b) => {
          const scoreDiff = getQuestionCompletenessScore(b) - getQuestionCompletenessScore(a);
          if (scoreDiff !== 0) return scoreDiff;
          return a.id.localeCompare(b.id);
        });

        const primary = sorted[0];
        const dupesInGroup = sorted.length - 1;
        totalDuplicates += dupesInGroup;

        duplicateGroups.push({
          key,
          primaryQuestionId: primary.id,
          questions: sorted,
          duplicateCount: dupesInGroup,
        });
      }
    }

    return NextResponse.json({
      quizId: id,
      quizTitle: quiz.title,
      totalQuestions: quiz.questions.length,
      totalDuplicateGroups: duplicateGroups.length,
      totalDuplicates,
      duplicateGroups,
    });
  } catch (error) {
    console.error("Failed to check duplicate questions:", error);
    return NextResponse.json({ error: "Failed to check duplicate questions" }, { status: 500 });
  }
}

/**
 * POST /api/admin/quizzes/[id]/duplicates
 * Deletes duplicate questions for a quiz.
 *
 * Body options:
 * 1. `{ autoCleanAll: true }` -> automatically deletes all redundant duplicates across all clusters, keeping primary.
 * 2. `{ deleteQuestionIds: string[] }` -> explicitly deletes specified duplicate question IDs.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { autoCleanAll, deleteQuestionIds } = body;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        topics: { select: { id: true } },
        questions: {
          orderBy: { id: "asc" },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    let idsToDelete: string[] = [];

    if (autoCleanAll) {
      const groupsMap = new Map<string, typeof quiz.questions>();
      for (const q of quiz.questions) {
        const norm = normalizeQuestionForComparison(q.text);
        if (!norm) continue;
        const existing = groupsMap.get(norm) || [];
        existing.push(q);
        groupsMap.set(norm, existing);
      }

      for (const [, questions] of groupsMap.entries()) {
        if (questions.length > 1) {
          const sorted = [...questions].sort((a, b) => {
            const scoreDiff = getQuestionCompletenessScore(b) - getQuestionCompletenessScore(a);
            if (scoreDiff !== 0) return scoreDiff;
            return a.id.localeCompare(b.id);
          });
          // Keep primary (index 0), mark the rest for deletion
          const redundant = sorted.slice(1).map((q) => q.id);
          idsToDelete.push(...redundant);
        }
      }
    } else if (Array.isArray(deleteQuestionIds) && deleteQuestionIds.length > 0) {
      // Ensure the IDs belong to this quiz
      const validQuizQuestionIds = new Set(quiz.questions.map((q) => q.id));
      idsToDelete = deleteQuestionIds.filter((qId) => validQuizQuestionIds.has(qId));
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: "No duplicates were found or specified for deletion.",
      });
    }

    // Delete redundant questions from database
    const deleteResult = await prisma.question.deleteMany({
      where: {
        id: { in: idsToDelete },
        quizId: id,
      },
    });

    // Revalidate paths & caches
    revalidatePath("/exams");
    revalidatePath("/admin/manage/quizzes");
    revalidatePath(`/admin/manage/quizzes/${id}/questions`);
    quiz.topics.forEach((t) => revalidatePath(`/topics/${t.id}`));
    await revalidateQuizAndRelated(id);

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
      deletedIds: idsToDelete,
      message: `Successfully removed ${deleteResult.count} duplicate question${
        deleteResult.count !== 1 ? "s" : ""
      }.`,
    });
  } catch (error) {
    console.error("Failed to remove duplicate questions:", error);
    return NextResponse.json({ error: "Failed to remove duplicate questions" }, { status: 500 });
  }
}
