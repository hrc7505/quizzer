import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { after } from "next/server";

import { authOptions, SessionUser } from "@/lib/auth";
import { stripNullBytes } from "@/lib/format";
import { describeAiError } from "@/lib/gemini";
import {
  getQuizTranslationStatus,
  manageQuizTranslationQueue,
  processTranslateBatchesForQuiz,
  DEFAULT_BATCH_SIZE,
} from "@/lib/services/quiz-translation.service";

/**
 * GET /api/admin/quizzes/[id]/translate
 * Returns quiz translation breakdown and real-time background queue status from PostgreSQL.
 * Supports optional ?targetLanguage=... query parameter to filter/retrieve a specific language's queue.
 */
export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as SessionUser).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: quizId } = await props.params;
    const url = new URL(req.url);
    const requestedTargetLang = url.searchParams.get("targetLanguage") || url.searchParams.get("language");

    const result = await getQuizTranslationStatus(quizId, requestedTargetLang);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.statusCode || 500 });
    }

    // Auto-recover stale batches if needed
    if (result.staleActiveBatchLang) {
      const staleLang = result.staleActiveBatchLang;
      after(async () => {
        await processTranslateBatchesForQuiz(quizId, staleLang);
      });
    }

    return NextResponse.json(result.status);
  } catch (error) {
    console.error("Failed to fetch translation status:", error);
    return NextResponse.json({ error: "Failed to fetch translation status" }, { status: 500 });
  }
}

/**
 * POST /api/admin/quizzes/[id]/translate
 * Manages server background translation batches (start, pause, resume, restart, cancel).
 */
export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as SessionUser).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: quizId } = await props.params;
    const body = await req.json().catch(() => ({}));
    const action = body.action || "start";
    const targetLanguage = stripNullBytes(body.targetLanguage || "gu");
    const batchSize = Math.max(1, Math.min(25, body.batchSize || DEFAULT_BATCH_SIZE));

    const result = await manageQuizTranslationQueue({
      quizId,
      action,
      targetLanguage,
      resume: body.resume,
      batchSize,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.statusCode || 500 });
    }

    if (result.shouldTriggerWorker) {
      after(async () => {
        await processTranslateBatchesForQuiz(quizId, targetLanguage);
      });
    }

    return NextResponse.json({
      success: true,
      isBatched: result.isBatched,
      quizId,
      targetLanguage,
      totalBatches: result.totalBatches,
      totalQuestions: result.totalQuestions,
      message: result.message,
    });
  } catch (err) {
    console.error("Quiz translation error:", err);
    const { message } = describeAiError(err);
    return NextResponse.json({ error: message || "Failed to translate quiz" }, { status: 500 });
  }
}
