"use client";

import { PageLayout } from "@/components/layouts/PageLayout";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ContentHeader } from "@/components/layouts/ContentHeader";
import { DirectoryCardList } from "@/components/data-display/DirectoryCardList";
import { BookOpen24Regular } from "@/design-system/icons/Icons";
import { makeStyles } from "@fluentui/react-components";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "40px",
  },
});

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
  const styles = useStyles();
  return (
    <PageLayout>
      <ContentHeader
        icon={<BookOpen24Regular />}
        variant="exam"
        title="Exams Directory"
        description="Select an exam structure or standalone topic category to begin."
      />
      <div className={styles.root}>
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
