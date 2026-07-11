import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    const parentId = searchParams.get("parentId");
    const all = searchParams.get("all") === "true";
    
    const where: any = {
      // Always exclude the hidden sentinel topic used as a FK anchor for standalone-generated questions
      NOT: { title: "__internal__" }
    };
    if (examId) {
      where.exams = { some: { id: examId } };
    }
    if (parentId) {
      where.parentTopics = { some: { id: parentId } };
    } else if (!all) {
      // By default, filter out subtopics to only return main/root topics
      where.parentTopics = { none: {} };
    }

    const topics = await prisma.topic.findMany({
      where,
      include: {
        parentTopics: { select: { id: true, title: true } },
        exams: { select: { id: true, title: true } },
        subtopics: {
          include: {
            quizzes: {
              include: { _count: { select: { questions: true } } }
            },
            _count: {
              select: { quizzes: true, questions: true }
            }
          }
        },
        quizzes: {
          include: { _count: { select: { questions: true } } }
        },
        _count: {
          select: { quizzes: true, questions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(topics);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch topics" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title, description, examId, parentId, subtopicIds } = await req.json();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const topic = await prisma.topic.create({
      data: { 
        title, 
        description, 
        exams: examId ? { connect: { id: examId } } : undefined,
        parentTopics: parentId ? { connect: { id: parentId } } : undefined,
        subtopics: subtopicIds && Array.isArray(subtopicIds) && subtopicIds.length > 0 ? {
          connect: subtopicIds.map((sid: string) => ({ id: sid }))
        } : undefined
      }
    });
    return NextResponse.json(topic);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create topic" }, { status: 500 });
  }
}
