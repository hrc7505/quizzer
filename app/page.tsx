import { NavBar } from "@/components/ui/NavBar";
import { prisma } from "@/lib/prisma";
import {
  Brain24Regular, BookOpen24Regular,
  Sparkle24Regular, ArrowRight16Regular
} from "@/components/ui/ServerIcons";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "QuizGen · AI-Powered Quiz Generator & Explainer",
  description: "Learn faster with AI-generated quizzes, persistent deep-dive explanations, and structured exam preparation."
};

/**
 * Beautiful, premium Landing Page for QuizGen.
 * Explains the product features, queries dynamic database counts,
 * and directs users to practice or read deep dives.
 * Fully Server Component safe (uses plain HTML/CSS instead of React Context components).
 */
export default async function Home() {
  // Fetch dynamic statistics to make the home page feel active
  const [examsCount, quizzesCount, questionsCount, deepDivesCount] = await Promise.all([
    prisma.exam.count(),
    prisma.quiz.count(),
    prisma.question.count(),
    prisma.question.count({ where: { elaboration: { not: null } } })
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8fafc', color: '#1e293b', fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
      <NavBar />

      {/* Hero Section */}
      <section style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
        color: "white",
        padding: "80px 24px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Decorative background gradients */}
        <div style={{
          position: "absolute", top: "-50%", left: "-20%", width: "600px", height: "600px",
          borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
          pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute", bottom: "-50%", right: "-20%", width: "600px", height: "600px",
          borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)",
          pointerEvents: "none"
        }} />

        <div style={{ maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "rgba(99, 102, 241, 0.2)",
            padding: "6px 14px",
            borderRadius: "30px",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            marginBottom: "24px"
          }}>
            <Sparkle24Regular style={{ color: "#818cf8", fontSize: "16px" }} />
            <span style={{ color: "#c7d2fe", fontSize: "12px", fontWeight: "600" }}>AI-Powered Study Assistant</span>
          </div>

          <h1 style={{
            fontSize: "48px", fontWeight: "800", lineHeight: "1.2",
            margin: "0 0 16px 0", background: "linear-gradient(to right, #ffffff, #e2e8f0)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em"
          }}>
            Smart Study. AI-Powered Preparation.
          </h1>
          
          <p style={{ fontSize: "18px", color: "#94a3b8", lineHeight: "1.6", margin: "0 0 32px 0" }}>
            Generate high-quality multiple-choice quizzes instantly from titles, text documents, or PDFs.
            Test your knowledge and leverage Gemini AI to deep-dive into complex concepts.
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/exams" style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#0078d4",
              color: "white",
              padding: "0 24px",
              height: "48px",
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: "14px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              transition: "background-color 0.2s"
            }}>
              <BookOpen24Regular style={{ fontSize: "20px" }} />
              Browse Exams
            </Link>
            <Link href="/deep-dives" style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(255,255,255,0.05)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
              padding: "0 24px",
              height: "48px",
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: "14px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              transition: "all 0.2s"
            }}>
              <Brain24Regular style={{ fontSize: "20px" }} />
              AI Deep Dives
            </Link>
          </div>
        </div>
      </section>

      {/* Live Statistics */}
      <section style={{ maxWidth: "1100px", margin: "-40px auto 60px auto", width: "100%", padding: "0 24px", position: "relative", zIndex: 2 }}>
        <div style={{
          backgroundColor: "white", borderRadius: "16px",
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)",
          border: "1px solid #e2e8f0",
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          padding: "24px 16px", textAlign: "center", gap: "24px"
        }}>
          <div>
            <span style={{ display: "block", fontSize: "32px", fontWeight: "bold", color: "#4f46e5" }}>{examsCount}</span>
            <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "600" }}>Exams Structured</span>
          </div>
          <div style={{ borderLeft: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0" }}>
            <span style={{ display: "block", fontSize: "32px", fontWeight: "bold", color: "#0ea5e9" }}>{quizzesCount}</span>
            <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "600" }}>Interactive Quizzes</span>
          </div>
          <div style={{ borderRight: "1px solid #e2e8f0" }}>
            <span style={{ display: "block", fontSize: "32px", fontWeight: "bold", color: "#10b981" }}>{questionsCount}</span>
            <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "600" }}>Practice Questions</span>
          </div>
          <div>
            <span style={{ display: "block", fontSize: "32px", fontWeight: "bold", color: "#f59e0b" }}>{deepDivesCount}</span>
            <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "600" }}>AI Explanations Saved</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ maxWidth: "1100px", margin: "0 auto 80px auto", width: "100%", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "#0f172a", margin: "0 0 8px 0" }}>Key Features & Highlights</h2>
          <p style={{ fontSize: "16px", color: "#64748b", margin: 0 }}>Everything you need to master topics and pass your exams.</p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "24px"
        }}>
          {/* Card 1 */}
          <div style={{
            backgroundColor: "white", padding: "28px", borderRadius: "12px",
            border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)",
            display: "flex", gap: "16px"
          }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "8px", backgroundColor: "#e0e7ff",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              <Sparkle24Regular style={{ color: "#4f46e5" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#1e293b", margin: "0 0 8px 0" }}>Gemini Quiz Generation</h3>
              <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.5", margin: 0 }}>
                Upload a study guide PDF, paste long-form textbook materials, or input a simple title. The AI chunks content, formats questions, and creates modular quizzes.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div style={{
            backgroundColor: "white", padding: "28px", borderRadius: "12px",
            border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)",
            display: "flex", gap: "16px"
          }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "8px", backgroundColor: "#e0f2fe",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              <Brain24Regular style={{ color: "#0284c7" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#1e293b", margin: "0 0 8px 0" }}>Persistent Explanations</h3>
              <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.5", margin: 0 }}>
                Tired of reading simple answer keys? Get full-page, structured explanations cached instantly in the database. Read options analysis, search keywords, and learn from mistakes.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div style={{
            backgroundColor: "white", padding: "28px", borderRadius: "12px",
            border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)",
            display: "flex", gap: "16px"
          }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "8px", backgroundColor: "#d1fae5",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              <BookOpen24Regular style={{ color: "#059669" }} />
            </div>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#1e293b", margin: "0 0 8px 0" }}>Structured Taxonomy</h3>
              <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.5", margin: 0 }}>
                Keep materials organized. Create exams, main topics, subtopics, and quizzes independently, then easily link them together using our intuitive drag-and-connect manager.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        backgroundColor: "#f1f5f9",
        borderTop: "1px solid #e2e8f0",
        padding: "60px 24px",
        textAlign: "center"
      }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#0f172a", margin: "0 0 12px 0" }}>Ready to boost your study session?</h2>
          <p style={{ margin: "0 0 24px 0", color: "#475569", fontSize: "16px" }}>
            Explore study topics, take timed quizzes, and build your cached AI library today.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link href="/exams" style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#4f46e5",
              color: "white",
              padding: "10px 20px",
              borderRadius: "6px",
              fontWeight: "bold",
              fontSize: "14px"
            }}>
              Start Practice Now
              <ArrowRight16Regular />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: "auto", padding: "24px", borderTop: "1px solid #e2e8f0", backgroundColor: "white", textAlign: "center" }}>
        <span style={{ fontSize: "12px", color: "#94a3b8" }}>
          © {new Date().getFullYear()} QuizGen · AI-powered interactive learning platform.
        </span>
      </footer>
    </div>
  );
}
