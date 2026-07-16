import type { CSSProperties } from "react";
import { NavBar } from "@/components/ui/NavBar";
import { prisma } from "@/lib/prisma";
import {
  Brain24Regular, BookOpen24Regular,
  Sparkle24Regular, ArrowRight16Regular
} from "@/components/ui/Icons";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions, SessionUser } from "@/lib/auth";
import { resolveQuizRoute } from "@/lib/quiz-routing";
import { Prisma } from "@prisma/client";

type InProgressAttempt = Prisma.QuizAttemptGetPayload<{
  include: {
    quiz: { include: { questions: true } };
    answers: true;
  };
}>;

type CompletedAttempt = Prisma.QuizAttemptGetPayload<{
  include: {
    quiz: { include: { questions: true } };
  };
}>;

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Quizzer · AI-Powered Quiz Generator & Explainer",
  description: "Create interactive quizzes and detailed AI explanations instantly.",
};

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // Fetch counts for Live Statistics
  const [examsCount, quizzesCount, questionsCount, deepDivesCount] = await Promise.all([
    prisma.exam.count(),
    prisma.quiz.count(),
    prisma.question.count(),
    prisma.question.count({
      where: {
        elaboration: {
          not: null,
        },
      },
    }),
  ]);

  // Fetch Student Dashboard data if logged in as a student
  const isStudent = session?.user && (session.user as SessionUser).role === "USER";
  let inProgressAttempts: InProgressAttempt[] = [];
  let lastCompletedAttempt: CompletedAttempt | null = null;

  if (isStudent) {
    const userId = (session.user as SessionUser).id;
    const [ipData, lcData] = await Promise.all([
      prisma.quizAttempt.findMany({
        where: {
          userId,
          completed: false,
          answers: {
            some: {},
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          quiz: {
            include: {
              questions: true,
            },
          },
          answers: true,
        },
      }),
      prisma.quizAttempt.findFirst({
        where: {
          userId,
          completed: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          quiz: {
            include: {
              questions: true,
            },
          },
        },
      }),
    ]);
    inProgressAttempts = ipData;
    lastCompletedAttempt = lcData;
  }

  const inProgressRoutes = await Promise.all(
    inProgressAttempts.map((attempt) => resolveQuizRoute(attempt.quizId))
  );
  const lastCompletedRoute = lastCompletedAttempt ? await resolveQuizRoute(lastCompletedAttempt.quizId) : null;

  return (
    <div style={{ "--content-max": "1100px" } as CSSProperties} className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans">
      <NavBar maxWidth="1100px" />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white py-12 md:py-20 px-4 md:px-6 text-center relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute -top-1/2 -left-1/5 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute -bottom-1/2 -right-1/5 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.1)_0%,transparent_70%)] pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 px-3.5 py-1.5 rounded-full border border-indigo-500/30 mb-6">
            <Sparkle24Regular className="text-indigo-400" style={{ fontSize: "16px" }} />
            <span className="text-indigo-200 text-xs font-semibold">AI-Powered Study Assistant</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent tracking-tight">
            Smart Study. AI-Powered Preparation.
          </h1>
          
          <p className="text-base md:text-lg text-slate-300 leading-relaxed mb-8 px-2">
            Generate high-quality multiple-choice quizzes instantly from titles, text documents, or PDFs.
            Test your knowledge and leverage Gemini AI to deep-dive into complex concepts.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
            <Link href="/exams" className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 h-12 rounded-lg font-bold text-sm shadow-xs hover:bg-blue-700 transition duration-200 no-underline">
              <BookOpen24Regular style={{ fontSize: "20px" }} />
              Browse Exams
            </Link>
            <Link href="/deep-dives" className="inline-flex items-center justify-center gap-2 bg-white/5 text-white border border-white/30 px-6 h-12 rounded-lg font-bold text-sm shadow-xs hover:bg-white/10 hover:border-white/50 transition duration-200 no-underline">
              <Brain24Regular style={{ fontSize: "20px" }} />
              AI Deep Dives
            </Link>
          </div>
        </div>
      </section>

      {isStudent && (
        <section className="max-w-[1100px] mx-auto mt-10 mb-5 w-full px-4 relative z-10">
          <div className="flex flex-col gap-6">

            {/* Dashboard Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-extrabold text-slate-900 m-0 tracking-tight">
                 Welcome back, {session.user?.name || session.user?.email?.split("@")[0] || (session.user as SessionUser)?.phoneNumber || "User"}!
              </h2>
              <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-semibold">
                Student Dashboard
              </span>
            </div>

            {/* In-Progress Quizzes — Full-width strip, only shown when there are active quizzes */}
            {inProgressAttempts.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col gap-4">
                <h3 className="text-lg font-bold text-amber-800 m-0 flex items-center gap-2">
                  <span className="text-xl">⏳</span> Continue Where You Left Off
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {inProgressAttempts.map((attempt, index) => {
                    const totalQuestions = attempt.quiz.questions.length;
                    const answeredCount = attempt.answers.length;
                    const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
                    return (
                      <div key={attempt.id} className="bg-white border border-amber-100 rounded-xl p-4 flex flex-col gap-3 shadow-xs">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-semibold text-slate-700 text-sm leading-snug line-clamp-2">{attempt.quiz.title}</span>
                          <span className="shrink-0 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                            {answeredCount}/{totalQuestions}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-amber-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-xs">{progressPercent}% complete · Q{answeredCount + 1} next</span>
                          <Link
                            href={inProgressRoutes[index] ?? `/quiz/${attempt.quizId}`}
                            className="text-xs font-bold text-amber-700 flex items-center gap-1 hover:text-amber-900 transition no-underline"
                          >
                            Resume <ArrowRight16Regular style={{ fontSize: "12px" }} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Row: Last Played Result */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card: Last Played Result */}
              <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-4 justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 m-0 flex items-center gap-2.5 mb-4">
                    <span className="text-2xl">🏆</span> Last Played Result
                  </h3>
                  {!lastCompletedAttempt ? (
                    <p className="text-sm text-slate-500 m-0 italic leading-relaxed">
                      No completed quiz attempts yet. Finish a quiz to see your score here!
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <span className="text-base font-semibold text-slate-700">
                        {lastCompletedAttempt.quiz.title}
                      </span>
                      <div className="flex gap-4 items-center my-2">
                        <div className={`text-4xl font-extrabold ${
                          lastCompletedAttempt.scorePercentage >= 80 ? "text-emerald-600" : lastCompletedAttempt.scorePercentage >= 50 ? "text-amber-500" : "text-red-500"
                        }`}>
                          {Math.round(lastCompletedAttempt.scorePercentage)}%
                        </div>
                        <div className="text-sm text-slate-500 leading-relaxed">
                          <div>Correct: <strong>{lastCompletedAttempt.correctCount} / {lastCompletedAttempt.quiz.questions.length}</strong></div>
                          <div>Time: <strong>{Math.floor(lastCompletedAttempt.timeTakenSec / 60)}m {lastCompletedAttempt.timeTakenSec % 60}s</strong></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {lastCompletedAttempt && (
                  <div className="flex justify-between items-center border-t border-slate-100 pt-3.5 mt-3">
                    <Link href={`/quiz/results/${lastCompletedAttempt.id}`} className="text-sm text-indigo-600 font-semibold hover:text-indigo-800 transition no-underline">
                      View Detailed Review
                    </Link>
                    <Link href={lastCompletedRoute ?? `/quiz/${lastCompletedAttempt.quizId}`} className="text-sm text-emerald-600 font-semibold flex items-center gap-1 hover:text-emerald-800 transition no-underline">
                      Play Again <ArrowRight16Regular style={{ fontSize: "12px" }} />
                    </Link>
                  </div>
                )}
              </div>

              {/* Card: Quick Start */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/60 p-7 rounded-2xl border border-indigo-100 shadow-xs flex flex-col gap-4 justify-between">
                <div>
                  <h3 className="text-xl font-bold text-indigo-900 m-0 flex items-center gap-2.5 mb-2">
                    <span className="text-2xl">🚀</span> Start a New Quiz
                  </h3>
                  <p className="text-sm text-indigo-700/80 m-0 leading-relaxed">
                    Pick an exam topic to test your knowledge and track your scores.
                  </p>
                </div>
                <Link
                  href="/exams"
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow hover:bg-indigo-700 transition no-underline w-fit"
                >
                  <BookOpen24Regular style={{ fontSize: "18px" }} /> Browse Exams
                </Link>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* Live Statistics */}
      <section className={`max-w-[1100px] mx-auto mb-16 w-full px-4 relative z-10 ${isStudent ? "mt-6" : "-mt-10"}`}>
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 grid grid-cols-2 md:grid-cols-4 py-6 px-4 text-center gap-6">
          <div className="flex flex-col">
            <span className="block text-3xl font-extrabold text-indigo-600">{examsCount}</span>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Exams Structured</span>
          </div>
          <div className="border-l border-r border-slate-100 flex flex-col">
            <span className="block text-3xl font-extrabold text-sky-500">{quizzesCount}</span>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Interactive Quizzes</span>
          </div>
          <div className="md:border-r border-slate-100 flex flex-col">
            <span className="block text-3xl font-extrabold text-emerald-500">{questionsCount}</span>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Practice Questions</span>
          </div>
          <div className="flex flex-col">
            <span className="block text-3xl font-extrabold text-amber-500">{deepDivesCount}</span>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">AI Explanations Saved</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-[1100px] mx-auto mb-20 w-full px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Key Features & Highlights</h2>
          <p className="text-slate-500 text-base">Everything you need to master topics and pass your exams.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-7 rounded-xl border border-slate-200 shadow-xs flex gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600">
              <Sparkle24Regular />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Gemini Quiz Generation</h3>
              <p className="text-sm text-slate-600 leading-relaxed m-0">
                Upload a study guide PDF, paste long-form textbook materials, or input a simple title. The AI chunks content, formats questions, and creates modular quizzes.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-7 rounded-xl border border-slate-200 shadow-xs flex gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-sky-50 text-sky-600">
              <Brain24Regular />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Persistent Explanations</h3>
              <p className="text-sm text-slate-600 leading-relaxed m-0">
                Tired of reading simple answer keys? Get full-page, structured explanations cached instantly in the database. Read options analysis, search keywords, and learn from mistakes.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-7 rounded-xl border border-slate-200 shadow-xs flex gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
              <BookOpen24Regular />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Structured Taxonomy</h3>
              <p className="text-sm text-slate-600 leading-relaxed m-0">
                Keep materials organized. Create exams, main topics, subtopics, and quizzes independently, then easily link them together using our intuitive drag-and-connect manager.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-100 border-t border-slate-200 py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Ready to boost your study session?</h2>
          <p className="text-slate-600 text-base mb-6">
            Explore study topics, take timed quizzes, and build your cached AI library today.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/exams" className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-700 transition duration-200 no-underline">
              Start Practice Now
              <ArrowRight16Regular />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 bg-white text-center">
        <span className="text-xs text-slate-400">
          © {new Date().getFullYear()} Quizzer · AI-powered interactive learning platform.
        </span>
      </footer>
    </div>
  );
}
