import { TaxonomyManager } from "@/components/ui/TaxonomyManager";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ManagePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  redirect("/admin/manage/exams");
}
