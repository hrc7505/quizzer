import { NavBar } from "@/components/navigation/NavBar";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { isStudent, getSessionUser, getDisplayName } from "@/lib/session";
import { resolveQuizRoute } from "@/lib/quiz-routing";
import { Prisma } from "@prisma/client";
import {
  Brain,
  BookOpen,
  Sparkles,
  ArrowRight,
  Trophy,
  Timer,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

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
  const studentView = isStudent(session);
  let inProgressAttempts: InProgressAttempt[] = [];
  let lastCompletedAttempt: CompletedAttempt | null = null;

  if (studentView) {
    const userId = getSessionUser(session)?.id;
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
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-200">
      <NavBar maxWidth="1100px" />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/30 text-foreground py-16 md:py-24 px-4 md:px-6 text-center relative overflow-hidden border-b border-border/10">
        {/* Decorative background gradients */}
        <div className="absolute -top-1/2 left-1/4 w-600px h-600px rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.10)_0%,transparent_75%)] pointer-events-none dark:bg-[radial-gradient(circle,rgba(129,140,248,0.12)_0%,transparent_75%)]" />
        <div className="absolute -bottom-1/2 right-1/4 w-600px h-600px rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.06)_0%,transparent_75%)] pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-3.5 py-1.5 rounded-full border border-primary/20 mb-6 backdrop-blur-xs select-none">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-primary text-xs font-semibold">AI-Powered Study Assistant</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4 tracking-tight">
            Smart Study. AI-Powered Preparation.
          </h1>
          
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-8 px-2 max-w-2xl mx-auto">
            Generate high-quality multiple-choice quizzes instantly from titles, text documents, or PDFs.
            Test your knowledge and leverage Gemini AI to deep-dive into complex concepts.
          </p>

          <div className="flex flex-col sm:flex-row gap-3.5 justify-center flex-wrap">
            <Link href="/exams">
              <Button variant="primary" className="h-11 px-6 font-semibold gap-2 w-full sm:w-auto shadow-md">
                <BookOpen className="h-4 w-4" />
                <span>Browse Exams</span>
              </Button>
            </Link>
            <Link href="/deep-dives">
              <Button variant="outline" className="h-11 px-6 font-semibold gap-2 w-full sm:w-auto">
                <Brain className="h-4 w-4" />
                <span>AI Deep Dives</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {studentView && (
        <section className="max-w-1100px mx-auto mt-10 mb-6 w-full px-4 relative z-10">
          <div className="flex flex-col gap-6">

            {/* Dashboard Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <h2 className="text-2xl font-bold tracking-tight text-foreground m-0">
                 Welcome back, {getDisplayName(getSessionUser(session))}!
              </h2>
              <span className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-semibold w-fit">
                Student Dashboard
              </span>
            </div>

            {/* In-Progress Quizzes — Full-width strip, only shown when there are active quizzes */}
            {inProgressAttempts.length > 0 && (
              <div className="bg-warning/5 border border-warning/20 rounded-2xl p-6 flex flex-col gap-4">
                <h3 className="text-base font-bold text-warning flex items-center gap-2 m-0 select-none">
                  <Timer className="h-4 w-4" />
                  <span>Continue Where You Left Off</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inProgressAttempts.map((attempt, index) => {
                    const totalQuestions = attempt.quiz.questions.length;
                    const answeredCount = attempt.answers.length;
                    const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
                    return (
                      <div key={attempt.id} className="bg-card border border-border/80 rounded-xl p-4 flex flex-col gap-3 shadow-xs">
                        <div className="flex justify-between items-start gap-3">
                          <span className="font-semibold text-foreground text-sm leading-snug line-clamp-2">{attempt.quiz.title}</span>
                          <span className="shrink-0 px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-[10px] font-bold">
                            {answeredCount}/{totalQuestions}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-warning rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">{progressPercent}% complete</span>
                          <Link
                            href={inProgressRoutes[index] ?? `/quiz/${attempt.quizId}`}
                            className="font-bold text-primary hover:text-primary-hover flex items-center gap-1.5 transition-colors no-underline"
                          >
                            <span>Resume</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Row: Last Played Result & Start New */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card: Last Played Result */}
              <div className="bg-card p-6 sm:p-7 rounded-2xl border border-border/80 shadow-xs flex flex-col gap-4 justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground m-0 flex items-center gap-2 mb-4">
                    <Trophy className="h-5 w-5 text-warning" />
                    <span>Last Played Result</span>
                  </h3>
                  {!lastCompletedAttempt ? (
                    <p className="text-sm text-muted-foreground m-0 italic leading-relaxed">
                      No completed quiz attempts yet. Finish a quiz to see your score here!
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <span className="text-sm font-semibold text-foreground">
                        {lastCompletedAttempt.quiz.title}
                      </span>
                      <div className="flex gap-4 items-center my-2">
                        <div className={`text-3xl font-bold ${
                          lastCompletedAttempt.scorePercentage >= 80 ? "text-success" : lastCompletedAttempt.scorePercentage >= 50 ? "text-warning" : "text-danger"
                        }`}>
                          {Math.round(lastCompletedAttempt.scorePercentage)}%
                        </div>
                        <div className="text-xs text-muted-foreground leading-relaxed flex flex-col">
                          <span>Correct: <strong className="text-foreground">{lastCompletedAttempt.correctCount} / {lastCompletedAttempt.quiz.questions.length}</strong></span>
                          <span>Time: <strong className="text-foreground">{Math.floor(lastCompletedAttempt.timeTakenSec / 60)}m {lastCompletedAttempt.timeTakenSec % 60}s</strong></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {lastCompletedAttempt && (
                  <div className="flex justify-between items-center border-t border-border/40 pt-4 mt-2">
                    <Link href={`/quiz/results/${lastCompletedAttempt.id}`}>
                      <Button variant="ghost" className="h-8 text-xs font-semibold text-primary p-0 bg-transparent hover:underline hover:bg-transparent">
                        View Detailed Review
                      </Button>
                    </Link>
                    <Link href={lastCompletedRoute ?? `/quiz/${lastCompletedAttempt.quizId}`}>
                      <Button variant="ghost" className="h-8 text-xs font-semibold text-success p-0 bg-transparent hover:underline hover:bg-transparent gap-1">
                        Play Again <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Card: Quick Start */}
              <div className="bg-card p-6 sm:p-7 rounded-2xl border border-border/80 shadow-xs flex flex-col gap-4 justify-between bg-gradient-to-br from-surface to-surface-hover/30">
                <div>
                  <h3 className="text-lg font-bold text-foreground m-0 flex items-center gap-2 mb-2">
                    <LayoutDashboard className="h-5 w-5 text-primary" />
                    <span>Start a New Quiz</span>
                  </h3>
                  <p className="text-xs text-muted-foreground m-0 leading-relaxed">
                    Pick an exam topic to test your knowledge and track your scores.
                  </p>
                </div>
                <Link href="/exams">
                  <Button variant="primary" size="sm" className="gap-1.5 font-bold shadow-xs">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Browse Exams</span>
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* Live Statistics */}
      <section className={cn("max-w-1100px mx-auto mb-16 w-full px-4 relative z-10", studentView ? "mt-6" : "mt-10")}>
        <div className="bg-card rounded-2xl shadow-xs border border-border/80 grid grid-cols-2 md:grid-cols-4 py-6 px-4 text-center gap-6">
          <div className="flex flex-col">
            <span className="block text-3xl font-bold text-primary">{examsCount}</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1.5">Exams Structured</span>
          </div>
          <div className="border-l border-r border-border/50 flex flex-col">
            <span className="block text-3xl font-bold text-info">{quizzesCount}</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1.5">Interactive Quizzes</span>
          </div>
          <div className="md:border-r border-border/50 flex flex-col">
            <span className="block text-3xl font-bold text-success">{questionsCount}</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1.5">Practice Questions</span>
          </div>
          <div className="flex flex-col">
            <span className="block text-3xl font-bold text-warning">{deepDivesCount}</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1.5">AI Explanations</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-1100px mx-auto mb-20 w-full px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">Key Features & Highlights</h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">Everything you need to master topics and pass your exams.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-card p-6 sm:p-7 rounded-xl border border-border/80 shadow-xs flex gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary border border-primary/10">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground mb-1.5">Gemini Quiz Generation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed m-0">
                Upload a study guide PDF, paste long-form textbook materials, or input a simple title. The AI chunks content, formats questions, and creates modular quizzes.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-card p-6 sm:p-7 rounded-xl border border-border/80 shadow-xs flex gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-info/10 text-info border border-info/10">
              <Brain className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground mb-1.5">Persistent Explanations</h3>
              <p className="text-xs text-muted-foreground leading-relaxed m-0">
                Tired of reading simple answer keys? Get full-page, structured explanations cached instantly in the database. Read options analysis, search keywords, and learn from mistakes.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-card p-6 sm:p-7 rounded-xl border border-border/80 shadow-xs flex gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-success/10 text-success border border-success/10">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground mb-1.5">Structured Taxonomy</h3>
              <p className="text-xs text-muted-foreground leading-relaxed m-0">
                Keep materials organized. Create exams, main topics, subtopics, and quizzes independently, then easily link them together using our intuitive drag-and-connect manager.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-secondary/40 border-t border-border/80 py-16 px-6 text-center transition-colors">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-3">Ready to boost your study session?</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
            Explore study topics, take timed quizzes, and build your cached AI library today.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/exams">
              <Button variant="primary" className="font-semibold gap-1.5">
                <span>Start Practice Now</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-border/80 bg-card text-center transition-colors">
        <span className="text-xs text-muted-foreground/60 select-none">
          © {new Date().getFullYear()} Quizzer · AI-powered interactive learning platform.
        </span>
      </footer>
    </div>
  );
}
