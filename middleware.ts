import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Check if path is admin path
    if (path.startsWith("/admin")) {
      if (!token) {
        return NextResponse.redirect(new URL("/auth/admin-signin", req.url));
      }
      if (token.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    // Check if path is quiz play path (e.g. contains /quiz/ but is not the results page)
    const isQuizPlay = path.includes("/quiz/") && !path.includes("/quiz/results/");
    if (isQuizPlay && !token) {
      return NextResponse.redirect(
        new URL(`/auth/login?callbackUrl=${encodeURIComponent(req.url)}`, req.url)
      );
    }
  },
  {
    callbacks: {
      authorized: () => true, // Let the middleware body handle custom redirection rules
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/exams/:examId/:topicId/:subtopicId/quiz/:quizId",
    "/topics/:topicId/:subtopicId/quiz/:quizId",
  ],
};
