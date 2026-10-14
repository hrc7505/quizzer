import Link from "next/link";
import { ShieldCheck, Lock, Eye, Download, Sparkles, CheckCircle2, UserCheck } from "lucide-react";

import { PageLayout } from "@/components/layouts/PageLayout";
import { Container } from "@/components/layouts/Container";
import { Button } from "@/components/ui/Button";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Data & Privacy Transparency Policy · Quizzer",
  description: "Learn what user data Quizzer records, why each data field is stored, how your responses are used, and how to export or delete your information.",
};

const recordedEntities = [
  {
    title: "1. Account & Identity Records",
    model: "User & Account Models",
    description: "Saved when you create an account or sign in with Google or Email.",
    fields: [
      { name: "id", desc: "Unique identifier for your student profile." },
      { name: "name", desc: "Display name shown in your dashboard and navigation bar." },
      { name: "email", desc: "Used for login authentication and receiving support replies." },
      { name: "phoneNumber", desc: "Used solely if logging in via phone verification." },
      { name: "role", desc: "Defines access permissions (USER or ADMIN)." },
      { name: "OAuth Provider ID", desc: "Google OAuth identifier confirming your authenticated account." },
      { name: "createdAt & updatedAt", desc: "Timestamps recording when you joined and profile updates." },
    ],
  },
  {
    title: "2. Quiz Attempts & Performance",
    model: "QuizAttempt Model",
    description: "Saved each time you begin or complete a practice quiz.",
    fields: [
      { name: "quizId", desc: "References the specific test you practiced." },
      { name: "completed", desc: "Boolean flag indicating whether the quiz was submitted or is in progress." },
      { name: "scorePercentage", desc: "Your final score (0–100%) calculated upon submission." },
      { name: "correctCount & wrongCount", desc: "Tally of right versus wrong responses." },
      { name: "timeTakenSec", desc: "Duration spent active in the quiz session in seconds." },
      { name: "createdAt", desc: "Timestamp when the quiz attempt was initiated." },
    ],
  },
  {
    title: "3. Question Responses & Selections",
    model: "UserAnswer Model",
    description: "Saved for each question answered within an attempt.",
    fields: [
      { name: "questionId", desc: "References the exact question item." },
      { name: "selectedAnswer", desc: "The multiple-choice option you clicked." },
      { name: "isCorrect", desc: "Whether your choice was right or wrong." },
      { name: "attemptId", desc: "Links the answer to your specific quiz attempt." },
    ],
  },
  {
    title: "4. Authentication Sessions",
    model: "Session Model",
    description: "Used to keep you logged in safely across browser tabs.",
    fields: [
      { name: "sessionToken", desc: "Cryptographically random token ensuring secure requests." },
      { name: "expires", desc: "Expiration date after which you must sign in again." },
    ],
  },
];

/**
 * Public Data Transparency & Privacy Policy page outlining all user data stored,
 * retention rules, AI privacy boundaries, and user rights.
 */
export default function DataPrivacyPage() {
  return (
    <PageLayout contained={false}>
      {/* Header */}
      <section className="bg-linear-to-b from-primary/5 via-background to-background py-16 px-4 sm:px-6 lg:px-8 border-b border-border/20 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-success/10 px-3.5 py-1.5 rounded-full border border-success/20 mb-4">
            <ShieldCheck className="h-4 w-4 text-success" />
            <span className="text-success text-xs font-semibold">User Data Transparency & Privacy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            What Data We Record From You
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-6">
            At Quizzer, privacy is not buried in legalese. We are completely upfront about every single data point we collect, why we need it, and how you control it.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/profile">
              <Button variant="primary" size="sm" className="font-semibold gap-1.5">
                <UserCheck className="h-4 w-4" />
                <span>Inspect Your Profile Records</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Guiding Principles */}
      <Container className="py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs flex flex-col gap-3">
            <div className="h-10 w-10 rounded-xl bg-success/10 text-success flex items-center justify-center border border-success/20">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground m-0">Zero Ad Trackers</h3>
            <p className="text-xs text-muted-foreground leading-relaxed m-0">
              We never run advertising networks, monetize student browsing habits, or sell behavioral data to third-party data brokers.
            </p>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs flex flex-col gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground m-0">AI Privacy Guarantee</h3>
            <p className="text-xs text-muted-foreground leading-relaxed m-0">
              Our AI models are used strictly to analyze test questions and generate conceptual explanations. Your personal identity and email are NEVER shared with external AI providers.
            </p>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs flex flex-col gap-3">
            <div className="h-10 w-10 rounded-xl bg-info/10 text-info flex items-center justify-center border border-info/20">
              <Download className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground m-0">100% Data Portability</h3>
            <p className="text-xs text-muted-foreground leading-relaxed m-0">
              You own your learning history. You can download a complete JSON archive of all your attempts and answers with one click.
            </p>
          </div>
        </div>

        {/* Detailed Entities Breakdown */}
        <div className="flex flex-col gap-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Database Schema Transparency</span>
            <h2 className="text-2xl font-bold text-foreground mt-1 mb-2">Exhaustive Inventory of Stored User Data</h2>
            <p className="text-sm text-muted-foreground m-0">
              Every data point we store in our PostgreSQL database mapped to its model and purpose:
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {recordedEntities.map((entity, i) => (
              <div key={i} className="bg-card border border-border/80 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
                  <div>
                    <h3 className="text-base font-bold text-foreground m-0">{entity.title}</h3>
                    <p className="text-xs text-muted-foreground m-0 mt-0.5">{entity.description}</p>
                  </div>
                  <code className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-surface border border-border/60 text-primary w-fit">
                    {entity.model}
                  </code>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {entity.fields.map((field) => (
                    <div key={field.name} className="p-3 rounded-xl bg-surface/50 border border-border/50 flex flex-col gap-1">
                      <span className="font-mono text-xs font-bold text-foreground">{field.name}</span>
                      <span className="text-xs text-muted-foreground leading-relaxed">{field.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Your Rights and Controls */}
        <div className="mt-16 bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col gap-6">
          <h2 className="text-xl font-bold text-foreground m-0 flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <span>How to Access, Export, or Delete Your Data</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-muted-foreground leading-relaxed">
            <div className="flex flex-col gap-2">
              <strong className="text-foreground text-sm flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" />
                1. Inspect Recorded Categories
              </strong>
              <span>
                Visit your <Link href="/profile" className="text-primary hover:underline font-semibold">User Profile</Link> at any time to view your learning analytics, recent quiz scores, and recorded data categories.
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <strong className="text-foreground text-sm flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" />
                2. Erase Quiz History
              </strong>
              <span>
                Want a clean slate? Tap &quot;Clear All Quiz History&quot; on your profile to permanently delete all your quiz attempts and recorded answers from our database.
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-xs text-muted-foreground">
              Questions about our data practices? Reach out to our privacy team.
            </span>
            <Link href="/contact">
              <Button variant="outline" size="sm" className="font-semibold text-xs">
                Contact Privacy Team
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </PageLayout>
  );
}
