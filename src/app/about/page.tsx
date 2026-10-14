import Link from "next/link";
import { 
  Sparkles, 
  Brain, 
  Target, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  BookOpen,
  HelpCircle,
  Zap,
  GraduationCap
} from "lucide-react";

import { PageLayout } from "@/components/layouts/PageLayout";
import { Container } from "@/components/layouts/Container";
import { Button } from "@/components/ui/Button";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Quizzer · Intelligent Exam Preparation & AI Explanations",
  description: "Learn about Quizzer's mission to empower students with curriculum-aligned practice quizzes, instant step-by-step AI explanations, multilingual study options, and LaTeX math formatting.",
};

const corePillars = [
  {
    number: "01",
    title: "Active Recall over Passive Reading",
    subtitle: "Proven Cognitive Science",
    description: "Reading textbooks repeatedly yields diminishing returns. Quizzer uses active self-assessment to stimulate memory retrieval, strengthen synaptic connections, and identify knowledge gaps before exam day.",
  },
  {
    number: "02",
    title: "Persistent AI Conceptual Explanations",
    subtitle: "Advanced AI Intelligence",
    description: "Traditional test banks only tell you that 'Option C is correct'. Quizzer provides comprehensive, cached deep dives detailing why Option C is right, why Options A, B, and D are wrong, and which core theorems apply.",
  },
  {
    number: "03",
    title: "Multilingual Inclusivity",
    subtitle: "English, Gujarati & Hindi",
    description: "Quality exam preparation should never be constrained by language. Quizzer natively supports localized scripts with tailored typography and cultural nuances for regional competitive and board exams.",
  },
  {
    number: "04",
    title: "Precision Science & LaTeX Math",
    subtitle: "No Blurry Screenshots",
    description: "Scientific and mathematical formulas are rendered using KaTeX. Whether you're practicing calculus integrals, organic chemistry notations, or physics kinematics, every equation is crisp, clear, and readable on any screen.",
  },
];

const capabilityHighlights = [
  {
    icon: <Sparkles className="h-5 w-5 text-primary" />,
    title: "Instant Hint & Elaboration Engine",
    description: "Stuck on a tricky question? Tap hints for progressive guidance without giving away the full answer immediately.",
  },
  {
    icon: <Brain className="h-5 w-5 text-info" />,
    title: "Database-Cached Explanations",
    description: "All deep dives are generated and cached in our database, ensuring instantaneous load times without latency during review.",
  },
  {
    icon: <Zap className="h-5 w-5 text-warning" />,
    title: "Exam-Paced Timers & Pause Control",
    description: "Simulate actual test pressure with per-quiz countdown timers, auto-save states, and question navigation drawers.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5 text-success" />,
    title: "Privacy-First Student Records",
    description: "Your responses and learning data belong strictly to you. No tracking pixels, no ad networks, and complete exportability.",
  },
];

/**
 * About page detailing Quizzer's educational philosophy, platform capabilities,
 * AI architecture, and commitment to accessible learning.
 */
export default function AboutPage() {
  return (
    <PageLayout contained={false}>
      {/* Hero Header */}
      <section className="bg-linear-to-b from-primary/5 via-background to-background py-16 md:py-20 px-4 sm:px-6 lg:px-8 border-b border-border/20 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-3.5 py-1.5 rounded-full border border-primary/20 mb-6">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="text-primary text-xs font-semibold">About Our Platform & Mission</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Transforming Exam Prep through Smart Practice & AI Clarity
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl mx-auto mb-8">
            Quizzer is designed to eliminate the frustration of confusing answer keys. We pair structured exam taxonomies with advanced AI models to help every student understand the *why* behind every concept.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/exams">
              <Button variant="primary" className="h-10 px-6 font-semibold gap-2 shadow-xs">
                <BookOpen className="h-4 w-4" />
                <span>Explore Practice Exams</span>
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="h-10 px-6 font-semibold gap-2">
                <HelpCircle className="h-4 w-4" />
                <span>Contact Our Team</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* The Problem & Our Mission */}
      <Container className="py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">The Challenge We Address</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight m-0">
              Why static question banks fail ambitious learners
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed m-0">
              When practicing for competitive exams, board exams, or university tests, students frequently encounter multiple-choice questions where the official answer key provides only a single correct option letter. If you chose a wrong option, you are left wondering:
            </p>
            <ul className="flex flex-col gap-2.5 p-0 m-0 list-none text-sm text-foreground/90">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Why is my reasoning incorrect, and what common misconception caused it?</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>What formula, law, or rule applies to this exact problem?</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>How can I remember this pattern if the question appears in a slightly altered form?</span>
              </li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed m-0">
              Quizzer was built from the ground up to address these exact questions. Every quiz module is supported by our persistent AI explanation system, offering an interactive coach in your browser.
            </p>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
            <h3 className="text-lg font-bold text-foreground m-0 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span>Our Vision for Learning</span>
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed m-0">
              We envision a learning ecosystem where no student is left behind due to lack of personal tutoring or high coaching fees. By making intelligent, multilingual test practice freely accessible, Quizzer democratizes mastery for all learners.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50 text-center">
              <div className="p-3 rounded-xl bg-surface/50 border border-border/50">
                <span className="block text-2xl font-bold text-primary">100%</span>
                <span className="text-[11px] text-muted-foreground font-semibold">Accessible for Learners</span>
              </div>
              <div className="p-3 rounded-xl bg-surface/50 border border-border/50">
                <span className="block text-2xl font-bold text-info">3+</span>
                <span className="text-[11px] text-muted-foreground font-semibold">Supported Languages</span>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* 4 Pillars Section */}
      <section className="bg-secondary/30 border-y border-border/60 py-16">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Our Core Educational Pillars</h2>
            <p className="text-sm text-muted-foreground m-0">
              How Quizzer blends cognitive research with modern artificial intelligence to deliver high-retention prep.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {corePillars.map((pillar) => (
              <div 
                key={pillar.number} 
                className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col gap-3 relative transition-all hover:border-primary/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                    {pillar.subtitle}
                  </span>
                  <span className="text-3xl font-black text-muted/30 select-none">{pillar.number}</span>
                </div>
                <h3 className="text-lg font-bold text-foreground m-0">{pillar.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed m-0">{pillar.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* AI & Features Grid */}
      <Container className="py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Intelligent Architecture</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-1 mb-3">Engineered for Rapid Concept Mastery</h2>
          <p className="text-sm text-muted-foreground m-0">
            A frictionless learning experience engineered with modern web standards and responsive interfaces.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {capabilityHighlights.map((cap, i) => (
            <div key={i} className="bg-card border border-border/80 rounded-xl p-5 flex flex-col gap-3 shadow-xs">
              <div className="h-10 w-10 rounded-lg bg-surface flex items-center justify-center border border-border/60">
                {cap.icon}
              </div>
              <h3 className="text-sm font-semibold text-foreground m-0">{cap.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed m-0">{cap.description}</p>
            </div>
          ))}
        </div>
      </Container>

      {/* Call to action banner */}
      <section className="bg-card border-t border-border/80 py-16 px-4 text-center">
        <div className="max-w-xl mx-auto flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-foreground m-0">Ready to test your knowledge?</h2>
          <p className="text-sm text-muted-foreground m-0">
            Choose an exam topic, tackle challenging questions, and unlock full AI explanations instantly.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link href="/exams">
              <Button variant="primary" className="gap-2 font-semibold shadow-xs">
                <span>Start Practicing Now</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
