import { prisma } from "@/lib/prisma";
import { AdminDashboard } from "@/components/ui/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const topicsCount = await prisma.topic.count();
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
        topicsCount,
        quizzesCount,
        questionsCount,
        attemptsCount,
        avgScore: Math.round(avgScore)
      }}
    />
  );
}
