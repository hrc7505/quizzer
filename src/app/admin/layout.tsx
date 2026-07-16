import { PageLayout } from "@/components/layouts/PageLayout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout variant="admin" navMaxWidth="1200px" mainMaxWidth="1200px">
      {children}
    </PageLayout>
  );
}
