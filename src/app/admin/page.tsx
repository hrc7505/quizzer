import { prisma } from "@/lib/prisma";
import { AdminDashboard } from "@/components/data-display/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const examsCount = await prisma.exam.count();
  const topicsCount = await prisma.topic.count({ where: { parentTopics: { none: {} } } });
  const subtopicsCount = await prisma.topic.count({ where: { parentTopics: { some: {} } } });
  const quizzesCount = await prisma.quiz.count();
  const questionsCount = await prisma.question.count();
  const attemptsCount = await prisma.quizAttempt.count();
  
  const attempts = await prisma.quizAttempt.findMany({
    select: { scorePercentage: true }
  });
  
  const avgScore = attempts.length > 0 
    ? attempts.reduce((acc: number, curr: { scorePercentage: number }) => acc + curr.scorePercentage, 0) / attempts.length 
    : 0;

  return (
    <AdminDashboard 
      stats={{
        examsCount,
        topicsCount,
        subtopicsCount,
        quizzesCount,
        questionsCount,
        attemptsCount,
        avgScore: Math.round(avgScore)
      }}
    />
  );
}
