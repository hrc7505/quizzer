import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { Prisma } from "@prisma/client";
import { 
  Brain, 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  Trophy, 
  Timer, 
  LayoutDashboard, 
  Languages, 
  Calculator, 
  ShieldCheck, 
  CheckCircle2, 
  HelpCircle,
  Zap,
  Target,
  UserCheck
} from "lucide-react";

import { Container } from "@/components/layouts/Container";
import { PageLayout } from "@/components/layouts/PageLayout";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { isStudent, getSessionUser, getDisplayName } from "@/lib/session";
import { resolveQuizRoute } from "@/lib/quiz-routing";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import { QuizInteractiveAnimation } from "@/features/home/components/QuizInteractiveAnimation";

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
  title: "Quizzer · AI-Powered Interactive Quizzes & Deep Explanations",
  description: "Master competitive and academic exams with interactive practice quizzes, step-by-step AI explanations, LaTeX math support, and multilingual learning.",
};

const howItWorksSteps = [
  {
    step: "01",
    title: "Select Exam & Target Topic",
    description: "Browse our structured taxonomy of competitive exams, academic courses, and subject subtopics tailored to your syllabus.",
    icon: <BookOpen className="h-5 w-5 text-primary" />,
  },
  {
    step: "02",
    title: "Take the Interactive Quiz",
    description: "Practice under realistic exam timers, flag difficult questions, and test your memory retrieval through active recall.",
    icon: <Zap className="h-5 w-5 text-warning" />,
  },
  {
    step: "03",
    title: "Unlock Instant AI Explanations",
    description: "Read persistent AI deep dives that explain why the correct answer works and why distractors are wrong.",
    icon: <Sparkles className="h-5 w-5 text-info" />,
  },
  {
    step: "04",
    title: "Track Mastery & Retake",
    description: "Review your detailed score report, inspect your learning velocity on your profile, and retake tests until mastery.",
    icon: <Target className="h-5 w-5 text-success" />,
  },
];

/**
 * Public Home Page showcasing all core features of the Quizzer learning platform:
 * structured exams, interactive quizzes, step-by-step AI explanations, multilingual support,
 * LaTeX mathematical formulas, student analytics, and user data transparency.
 */
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
    <PageLayout contained={false}>
      {/* Hero Section with Live Quiz Animation */}
      <section className="bg-linear-to-br from-primary/8 via-background to-accent/20 text-foreground py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden border-b border-border/20">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-1/2 left-1/4 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.12)_0%,transparent_75%)] pointer-events-none dark:bg-[radial-gradient(circle,rgba(129,140,248,0.14)_0%,transparent_75%)]" />
        <div className="absolute -bottom-1/2 right-1/4 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.08)_0%,transparent_75%)] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Left Column: Headline, CTAs, Highlights */}
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-3.5 py-1.5 rounded-full border border-primary/20 mb-5 select-none w-fit">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-primary text-xs font-semibold">
                  AI-Powered Learning Platform · Multilingual & LaTeX Ready
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4 tracking-tight text-foreground">
                Master Any Exam with Interactive Quizzes & Deep AI Explanations
              </h1>
              
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed mb-6 max-w-xl">
                Test your knowledge with curriculum-aligned practice questions, train under realistic exam timers, and unlock instant, step-by-step AI explanations in English, Gujarati, and Hindi.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start items-center flex-wrap w-full">
                <Link href="/exams" className="w-full sm:w-auto">
                  <Button variant="primary" className="h-11 px-7 font-semibold gap-2 w-full sm:w-auto shadow-md">
                    <BookOpen className="h-4 w-4" />
                    <span>Browse Practice Exams</span>
                  </Button>
                </Link>
                <Link href="/about" className="w-full sm:w-auto">
                  <Button variant="outline" className="h-11 px-6 font-semibold gap-2 w-full sm:w-auto">
                    <HelpCircle className="h-4 w-4" />
                    <span>How Quizzer Works</span>
                  </Button>
                </Link>
              </div>

              {/* Trust and feature highlights strip */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-2.5 mt-8 text-[11px] sm:text-xs text-muted-foreground font-medium">
                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-surface/80 border border-border/60">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  100% Free Practice
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-surface/80 border border-border/60">
                  <Languages className="h-3.5 w-3.5 text-primary" />
                  English · ગુજરાતી · हिन्दी
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-surface/80 border border-border/60">
                  <Calculator className="h-3.5 w-3.5 text-info" />
                  LaTeX Math & Formulas
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-surface/80 border border-border/60">
                  <ShieldCheck className="h-3.5 w-3.5 text-warning" />
                  Full Data Transparency
                </span>
              </div>
            </div>

            {/* Right Column: Quiz Specific Animation */}
            <div className="lg:col-span-5 w-full flex justify-center pt-4 lg:pt-0">
              <QuizInteractiveAnimation />
            </div>

          </div>
        </div>
      </section>

      {/* Student Logged-in Dashboard Section */}
      {studentView && (
        <Container className="mt-10 mb-6 relative z-10">
          <div className="flex flex-col gap-6">

            {/* Dashboard Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <h2 className="text-2xl font-bold tracking-tight text-foreground m-0">
                Welcome back, {getDisplayName(getSessionUser(session))}!
              </h2>
              <div className="flex items-center gap-2">
                <Link href="/profile">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>View Profile & Data</span>
                  </Button>
                </Link>
                <span className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-semibold w-fit">
                  Student Dashboard
                </span>
              </div>
            </div>

            {/* In-Progress Quizzes — Full-width strip */}
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
              <div className="bg-card p-6 sm:p-7 rounded-2xl border border-border/80 shadow-xs flex flex-col gap-4 justify-between bg-linear-to-br from-surface to-surface-hover/30">
                <div>
                  <h3 className="text-lg font-bold text-foreground m-0 flex items-center gap-2 mb-2">
                    <LayoutDashboard className="h-5 w-5 text-primary" />
                    <span>Start a New Quiz</span>
                  </h3>
                  <p className="text-xs text-muted-foreground m-0 leading-relaxed">
                    Pick an exam category to test your recall, practice new modules, and build your confidence.
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
        </Container>
      )}

      {/* Live Statistics Strip */}
      <Container className={cn("mb-16 relative z-10", studentView ? "mt-6" : "mt-10")}>
        <div className="bg-card rounded-2xl shadow-xs border border-border/80 grid grid-cols-2 md:grid-cols-4 py-6 px-3 sm:px-4 text-center gap-y-6">
          <div className="flex flex-col px-2">
            <span className="block text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">{examsCount}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1.5">Exams Structured</span>
          </div>
          <div className="flex flex-col px-2 border-l border-border/50">
            <span className="block text-2xl sm:text-3xl lg:text-4xl font-bold text-info">{quizzesCount}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1.5">Interactive Quizzes</span>
          </div>
          <div className="flex flex-col px-2 md:border-l border-border/50">
            <span className="block text-2xl sm:text-3xl lg:text-4xl font-bold text-success">{questionsCount}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1.5">Practice Questions</span>
          </div>
          <div className="flex flex-col px-2 border-l border-border/50">
            <span className="block text-2xl sm:text-3xl lg:text-4xl font-bold text-warning">{deepDivesCount}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1.5">AI Deep Explanations</span>
          </div>
        </div>
      </Container>

      {/* Core Public Features Showcase */}
      <Container className="mb-20">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Key Learning Capabilities</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-1 mb-2">Everything You Need to Master Your Exams</h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Engineered specifically for students preparing for competitive and board examinations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* Card 1: AI Explanations */}
          <div className="bg-card p-6 sm:p-7 rounded-2xl border border-border/80 shadow-xs flex flex-col gap-4 transition-all hover:border-primary/40">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-bold text-foreground m-0">Persistent AI Explanations</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed m-0">
                Never get stuck with just an answer key. Every single question includes full-page, database-cached explanations that analyze every distractor option and teach you the underlying principles.
              </p>
            </div>
          </div>

          {/* Card 2: Multilingual Support */}
          <div className="bg-card p-6 sm:p-7 rounded-2xl border border-border/80 shadow-xs flex flex-col gap-4 transition-all hover:border-info/40">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-info/10 text-info border border-info/20">
              <Languages className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-bold text-foreground m-0">Multilingual Test Preparation</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed m-0">
                Study in the language you think in. Quizzer natively supports localized fonts and grammar for English, Gujarati (ગુજરાતી), and Hindi (हिन्दी) for regional board and competitive exams.
              </p>
            </div>
          </div>

          {/* Card 3: LaTeX Math & Chemistry */}
          <div className="bg-card p-6 sm:p-7 rounded-2xl border border-border/80 shadow-xs flex flex-col gap-4 transition-all hover:border-success/40">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-success/10 text-success border border-success/20">
              <Calculator className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-bold text-foreground m-0">LaTeX Math & Equation Rendering</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed m-0">
                Crystal-clear mathematical formulas rendered with KaTeX. Complex integrals, physics equations, and chemistry notations display with crisp mathematical typography without blurry images.
              </p>
            </div>
          </div>

          {/* Card 4: Curated Exam Taxonomy */}
          <div className="bg-card p-6 sm:p-7 rounded-2xl border border-border/80 shadow-xs flex flex-col gap-4 transition-all hover:border-warning/40">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-warning/10 text-warning border border-warning/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-bold text-foreground m-0">Structured Taxonomy Navigation</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed m-0">
                Organized from top-level Exams down to Main Topics, Subtopics, and focused Quiz Modules. Target specific chapters or weak areas directly without digging through unrelated questions.
              </p>
            </div>
          </div>

          {/* Card 5: Timed Exam Simulation */}
          <div className="bg-card p-6 sm:p-7 rounded-2xl border border-border/80 shadow-xs flex flex-col gap-4 transition-all hover:border-primary/40">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary border border-primary/20">
              <Timer className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-bold text-foreground m-0">Realistic Timed Simulation</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed m-0">
                Train your time management. Real-time test counters, quick question navigation drawers, hint buttons, and automatic save points let you practice under realistic conditions.
              </p>
            </div>
          </div>

          {/* Card 6: Student Sovereignty & Privacy */}
          <div className="bg-card p-6 sm:p-7 rounded-2xl border border-border/80 shadow-xs flex flex-col gap-4 transition-all hover:border-info/40">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-info/10 text-info border border-info/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-bold text-foreground m-0">Transparent Data & 1-Click Export</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed m-0">
                Zero tracking pixels and no advertising networks. Check your profile to inspect every database record stored about you, or download a complete JSON export of your study history anytime.
              </p>
            </div>
          </div>
        </div>
      </Container>

      {/* How Quizzer Works Section */}
      <section className="bg-secondary/30 border-y border-border/60 py-16">
        <Container>
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Simple & Effective</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-1 mb-2">How to Learn with Quizzer</h2>
            <p className="text-sm text-muted-foreground m-0">
              Follow our 4-step active recall framework for guaranteed conceptual mastery.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorksSteps.map((step) => (
              <div key={step.step} className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs flex flex-col gap-3 relative">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-lg bg-surface flex items-center justify-center border border-border/60">
                    {step.icon}
                  </div>
                  <span className="text-2xl font-black text-muted/30 font-mono select-none">{step.step}</span>
                </div>
                <h3 className="text-sm font-bold text-foreground m-0">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed m-0">{step.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Interactive Feature Mockup Preview */}
      <Container className="py-16">
        <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-10 shadow-xs flex flex-col lg:flex-row items-center gap-8 lg:gap-12 relative overflow-hidden">
          <div className="flex flex-col gap-4 lg:w-1/2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Instant AI Coach</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground m-0">
              Understand the Concept, Not Just the Answer
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed m-0">
              When you submit a response, Quizzer doesn&apos;t just score you. It breaks down the physics, mathematics, or grammatical reasoning behind each choice. Learn why plausible distractors are incorrect to avoid traps on test day.
            </p>
            <div className="flex flex-col gap-2.5 pt-2 text-xs text-foreground/90">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Option-by-option conceptual analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Direct hints without spoiling the final answer</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Cached permanently for instantaneous review</span>
              </div>
            </div>
            <div className="pt-2">
              <Link href="/exams">
                <Button variant="primary" size="sm" className="font-semibold gap-1.5 shadow-xs">
                  <span>Try a Live Quiz Now</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Mockup Card */}
          <div className="lg:w-1/2 w-full bg-surface/90 border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center pb-3 border-b border-border/60 text-xs">
              <span className="font-bold text-primary flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                AI Deep Dive Preview
              </span>
              <span className="text-muted-foreground">Physics · Mechanics</span>
            </div>

            <div className="text-sm font-semibold text-foreground">
              {"A projectile is launched with velocity v₀ at angle θ. What is its maximum height H?"}
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <div className="p-2.5 rounded-lg border border-border/60 bg-card text-muted-foreground">
                {"A) H = (v₀² · sin θ) / g"}
              </div>
              <div className="p-2.5 rounded-lg border border-success/40 bg-success/10 text-success font-semibold flex justify-between items-center">
                <span>{"B) H = (v₀² · sin² θ) / (2g)"}</span>
                <span className="text-[10px] uppercase font-bold bg-success/20 px-2 py-0.5 rounded">Correct</span>
              </div>
              <div className="p-2.5 rounded-lg border border-border/60 bg-card text-muted-foreground">
                {"C) H = (2v₀ · sin θ) / g"}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs flex flex-col gap-1.5">
              <span className="font-bold text-primary flex items-center gap-1">
                <Brain className="h-3.5 w-3.5" />
                AI Elaboration & Concept:
              </span>
              <p className="text-muted-foreground text-[11px] leading-relaxed m-0">
                {"At the apex, vertical velocity vy = 0. Using the kinematic equation vy² = (v₀ sin θ)² - 2gH, solving for H yields H = (v₀² sin² θ) / 2g. Option C is incorrect because that represents total flight time T, not maximum height."}
              </p>
            </div>
          </div>
        </div>
      </Container>

      {/* User Data Transparency Highlight */}
      <section className="bg-secondary/20 border-t border-border/60 py-14">
        <Container>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
              <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-success/10 text-success flex items-center justify-center border border-success/20 shrink-0 mt-0.5 sm:mt-0">
                <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-bold text-foreground m-0">
                  What User Data Does Quizzer Record?
                </h3>
                <p className="text-xs text-muted-foreground m-0 max-w-xl leading-relaxed">
                  We believe in 100% transparency. We only record your email and your quiz attempts to save your learning history. You can inspect your records and export your complete data as JSON at any time.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
              <Link href="/data-privacy" className="w-full sm:w-auto">
                <Button variant="outline" size="sm" className="font-semibold text-xs w-full sm:w-auto">
                  Read Data Transparency Policy
                </Button>
              </Link>
              <Link href="/profile" className="w-full sm:w-auto">
                <Button variant="primary" size="sm" className="font-semibold text-xs w-full sm:w-auto">
                  Inspect My Profile
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Ready to Boost Your Study Session CTA */}
      <section className="bg-secondary/40 border-t border-border/80 py-16 px-4 sm:px-6 lg:px-8 text-center transition-colors">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground m-0">
            Ready to Accelerate Your Exam Preparation?
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto m-0">
            Explore curriculum topics, take timed quizzes, and build your confidence with AI explanations today.
          </p>
          <div className="flex gap-3.5 justify-center flex-wrap pt-2">
            <Link href="/exams">
              <Button variant="primary" className="font-semibold gap-1.5 shadow-md">
                <span>Start Practice Now</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="font-semibold gap-1.5">
                <span>Have Questions? Contact Us</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
