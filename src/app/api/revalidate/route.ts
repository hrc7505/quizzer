import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { revalidatePath, revalidateTag } from "next/cache";

import { authOptions, SessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const token = req.headers.get("x-revalidate-token");
    if (!token || token !== process.env.REVALIDATE_TOKEN) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as SessionUser).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { paths, tag } = body;

    if (paths && Array.isArray(paths)) {
      for (const path of paths) {
        revalidatePath(path, "page");
      }
    }

    if (tag) {
      revalidateTag(tag, "tag");
    }

    return NextResponse.json({ revalidated: true, paths, tag });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json({ error: "Revalidation failed" }, { status: 500 });
  }
}
