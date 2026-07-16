import { TaxonomyManager } from "@/components/data-display/TaxonomyManager";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ManageSubTopicsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <div>
      <TaxonomyManager view="subtopics" />
    </div>
  );
}
