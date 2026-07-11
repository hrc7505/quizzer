import { TaxonomyManager } from "@/components/ui/TaxonomyManager";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ManageExamsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <div style={{ width: '100%', padding: '24px' }}>
      <TaxonomyManager view="exams" />
    </div>
  );
}
