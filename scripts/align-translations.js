const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const quizRes = await pool.query(`SELECT id, title FROM "Quiz" WHERE title ILIKE $1 LIMIT 1`, ["%final paper%"]);
  const quiz = quizRes.rows[0];

  const enRes = await pool.query(`SELECT id, text, "createdAt" FROM "Question" WHERE "quizId" = $1 AND language = $2 ORDER BY "createdAt" ASC`, [quiz.id, "en"]);
  const guRes = await pool.query(`SELECT id, text, "createdAt" FROM "Question" WHERE "quizId" = $1 AND language = $2 ORDER BY "createdAt" ASC`, [quiz.id, "gu"]);

  console.log(`EN: ${enRes.rows.length}, GU: ${guRes.rows.length}`);

  // Let's see the first 10 EN questions and see where their Gujarati match is
  console.log("\nSearching matches for first 5 EN questions:");
  for (let i = 0; i < 5; i++) {
    const enQ = enRes.rows[i];
    console.log(`\nEN [${i}]: ${enQ.text.slice(0, 80)}`);
    // Find GU question that looks like the translation
    const guMatch = guRes.rows.find(g => {
      // Check common terms like QuickSort, BFS, Binary Search, etc.
      const terms = enQ.text.match(/[A-Za-z]{3,}/g) || [];
      const matchingTerms = terms.filter(t => g.text.includes(t));
      return matchingTerms.length >= 2;
    });
    console.log(`GU Match found:`, guMatch ? guMatch.text.slice(0, 80) : "None");
  }

  await pool.end();
}
main().catch(console.error);
