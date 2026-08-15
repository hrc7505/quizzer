import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions, SessionUser } from "@/lib/auth";
import { processBatchById } from "@/app/api/admin/generate-quiz/route";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as SessionUser).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await processBatchById(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Retry failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Batch processed successfully and converted to Quiz",
    });
  } catch (error) {
    console.error("Retry batch failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
