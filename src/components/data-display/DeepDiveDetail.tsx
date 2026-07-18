"use client";

import { ArrowLeft } from "lucide-react";
import { LinkButton } from "@/components/ui/LinkButton";
import { DeepDiveBody } from "./DeepDiveBody";

interface Question {
  id: string;
  text: string;
  correctAnswer: string;
  options: string[];
  elaboration: string | null;
  topic: { id: string; title: string };
  quiz: { id: string; title: string; difficulty: string } | null;
}

interface DeepDiveDetailProps {
  /** Full question record including elaboration from DB. */
  question: Question;
}

/**
 * DeepDiveDetail — individual deep dive page client component.
 * Renders the saved elaboration from DB.
 */
export function DeepDiveDetail({ question }: DeepDiveDetailProps) {
  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Back navigation */}
      <div className="flex">
        <LinkButton 
          href="/deep-dives" 
          variant="ghost" 
          size="sm" 
          className="gap-1.5 h-8 px-3 font-semibold text-xs border border-border/40 hover:bg-surface-hover hover:border-border/80"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Library</span>
        </LinkButton>
      </div>

      {/* Reusable Deep Dive Body content */}
      <DeepDiveBody question={question} />
    </div>
  );
}
