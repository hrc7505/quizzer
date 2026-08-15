import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

import { TaxonomyManager } from "@/components/data-display/TaxonomyManager";
import { authOptions } from "@/lib/auth";


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
