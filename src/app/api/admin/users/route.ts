import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { prisma } from "@/lib/prisma";
import { authOptions, SessionUser } from "@/lib/auth";


/**
 * Handles GET requests to retrieve all users.
 * Restricted to authenticated ADMIN users only.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as SessionUser).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Retrieve all users sorted by name, along with their attempt counts
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

    return NextResponse.json(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
