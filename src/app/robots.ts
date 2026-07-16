import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/auth", "/api", "/quiz/"],
      },
    ],
    sitemap: "https://quizzer.vercel.app/sitemap.xml",
  };
}
