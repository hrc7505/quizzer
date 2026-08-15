import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

import { authOptions, SessionUser } from "@/lib/auth";
import { BatchQueueManager } from "@/components/data-display/BatchQueueManager";

export const metadata: Metadata = {
  title: "Batch Queue - Admin Management",
  description: "Monitor, retry, and manage multi-quiz generation batches.",
};

export default async function AdminBatchesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user as SessionUser).role !== "ADMIN") {
    redirect("/auth/admin-signin");
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full py-2">
      <BatchQueueManager />
    </div>
  );
}
