import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://quizzer.vercel.app",
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://quizzer.vercel.app/exams",
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://quizzer.vercel.app/topics",
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://quizzer.vercel.app/deep-dives",
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];
}
