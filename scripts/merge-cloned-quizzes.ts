import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Starting multilingual question merge...");

  // 1. Update language of all existing questions based on their script/parent quiz
  const allQuizzes = await prisma.quiz.findMany({
    include: {
      questions: true,
      topics: true,
    },
  });

  console.log(`Found ${allQuizzes.length} total quizzes in database.`);

  for (const quiz of allQuizzes) {
    const isGujaratiQuiz = quiz.language === "gu" || /\[GU\]$/i.test(quiz.title);
    const isHindiQuiz = quiz.language === "hi" || /\[HI\]$/i.test(quiz.title);
    const targetLang = isGujaratiQuiz ? "gu" : isHindiQuiz ? "hi" : "en";

    // Update questions language in this quiz
    for (const q of quiz.questions) {
      const isGujText = /[\u0A80-\u0AFF]/.test(q.text);
      const isHiText = /[\u0900-\u097F]/.test(q.text);
      const qLang = isGujText ? "gu" : isHiText ? "hi" : targetLang;

      if (q.language !== qLang) {
        await prisma.question.update({
          where: { id: q.id },
          data: { language: qLang },
        });
      }
    }
  }

  // 2. Identify cloned quizzes ending in [GU], [HI], or [EN] and merge into parent
  const clonedQuizzes = allQuizzes.filter((q) => /\s*\[(GU|HI|EN)\]$/i.test(q.title));

  console.log(`Found ${clonedQuizzes.length} cloned companion quizzes to merge.`);

  for (const clone of clonedQuizzes) {
    const baseTitle = clone.title.replace(/\s*\[(GU|HI|EN)\]$/i, "").trim();
    const cloneLang = /\[GU\]$/i.test(clone.title) ? "gu" : /\[HI\]$/i.test(clone.title) ? "hi" : "en";

    // Find the parent quiz with the same base title
    const parentQuiz = allQuizzes.find(
      (q) => q.id !== clone.id && q.title.trim().toLowerCase() === baseTitle.toLowerCase()
    );

    if (parentQuiz) {
      console.log(`Merging "${clone.title}" (${clone.questions.length} questions) -> "${parentQuiz.title}" (parent ID: ${parentQuiz.id})`);

      // Re-assign all questions from clone quiz to parent quiz
      await prisma.question.updateMany({
        where: { quizId: clone.id },
        data: {
          quizId: parentQuiz.id,
          language: cloneLang,
        },
      });

      // Delete the clone quiz record
      await prisma.quiz.delete({
        where: { id: clone.id },
      });

      console.log(`Deleted clone quiz "${clone.title}".`);
    } else {
      // If no separate parent exists, just rename this quiz to remove [GU]/[HI]
      console.log(`Renaming standalone quiz "${clone.title}" -> "${baseTitle}"`);
      await prisma.quiz.update({
        where: { id: clone.id },
        data: {
          title: baseTitle,
          language: cloneLang,
        },
      });
    }
  }

  console.log("Multilingual merge completed successfully!");
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
