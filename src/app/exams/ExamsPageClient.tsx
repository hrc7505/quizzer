"use client";

import { PageLayout } from "@/components/layouts/PageLayout";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ContentHeader } from "@/components/layouts/ContentHeader";
import { DirectoryCardList } from "@/components/data-display/DirectoryCardList";
import { BookOpen } from "lucide-react";

interface ExamsPageClientProps {
  examItems: Array<{
    id: string;
    title: string;
    description: string | null;
    href: string;
    meta: string;
  }>;
  standaloneItems: Array<{
    id: string;
    title: string;
    description: string | null;
    href: string;
    meta: string;
  }>;
}

function ExamsPageClient({ examItems, standaloneItems }: ExamsPageClientProps) {
  return (
    <PageLayout>
      <ContentHeader
        icon={<BookOpen className="h-5 w-5" />}
        variant="exam"
        title="Exams Directory"
        description="Select an exam structure or standalone topic category to begin."
      />
      <div className="flex flex-col gap-10">
        <div>
          <SectionHeading>Exam Curriculums</SectionHeading>
          <DirectoryCardList items={examItems} itemLabel="exams" searchPlaceholder="Search exams..." />
        </div>

        {standaloneItems.length > 0 && (
          <div>
            <SectionHeading>Standalone Topics</SectionHeading>
            <DirectoryCardList items={standaloneItems} itemLabel="standalone topics" searchPlaceholder="Search standalone topics..." />
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export { ExamsPageClient };
