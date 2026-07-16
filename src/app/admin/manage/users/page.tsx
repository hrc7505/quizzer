import { prisma } from "@/lib/prisma";
import { AdminUsersManager } from "@/components/data-display/AdminUsersManager";
import { getServerSession } from "next-auth/next";
import { authOptions, SessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * ManageUsersPage Server Component. Loads all users server-side and enforces Admin authentication.
 */
export default async function ManageUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as SessionUser).role !== "ADMIN") {
    redirect("/");
  }

  // Fetch all users with their quiz attempt statistics
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          attempts: true,
        },
      },
    },
  });

  return <AdminUsersManager initialUsers={users} />;
}
