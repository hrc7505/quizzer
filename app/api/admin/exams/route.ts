import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const exams = await prisma.exam.findMany({
      include: {
        topics: {
          include: {
            quizzes: {
              include: { _count: { select: { questions: true } } }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(exams);
  } catch {
    return NextResponse.json({ error: "Failed to fetch exams" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title, description, topicIds } = await req.json();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const exam = await prisma.exam.create({
      data: { 
        title, 
        description,
        topics: topicIds && Array.isArray(topicIds) ? {
          connect: topicIds.map((id: string) => ({ id }))
        } : undefined
      }
    });

    return NextResponse.json(exam);
  } catch {
    return NextResponse.json({ error: "Failed to create exam" }, { status: 500 });
  }
}
