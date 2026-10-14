import { SponsoredResourceItem } from "@/components/ui/interfaces/ResourceRecommendationCard.interface";

/**
 * Curated list of high-intent learning resources and affiliate partners.
 * Update links with your actual affiliate tags (Amazon, Coursera, Udemy, etc.).
 */
export const CURATED_RESOURCES: SponsoredResourceItem[] = [
  // AWS / Cloud
  {
    id: "aws-saa",
    title: "AWS Certified Solutions Architect Associate (SAA-C03)",
    description: "The gold-standard practice exam and full study syllabus for cloud architecture.",
    url: "https://aws.amazon.com/certification/certified-solutions-architect-associate/",
    badgeText: "Most Popular Cert",
    provider: "AWS Official & Udemy",
    type: "certification",
    tags: ["aws", "cloud", "solutions architect", "devops", "infrastructure"],
    offerText: "Official Practice",
  },
  // React / Next.js / Frontend
  {
    id: "react-next-mastery",
    title: "Epic Web & Modern Fullstack React",
    description: "Deep dive into production-ready React 19, Server Components, and Next.js App Router.",
    url: "https://react.dev",
    badgeText: "Recommended",
    provider: "Fullstack Academy / Coursera",
    type: "course",
    tags: ["react", "next", "javascript", "typescript", "frontend", "web"],
    offerText: "Free & Pro Tracks",
  },
  // Python / Data / AI
  {
    id: "python-ai-bootcamp",
    title: "Complete Python Bootcamp & AI Engineering",
    description: "From Python fundamentals to building autonomous agents and PyTorch models.",
    url: "https://www.coursera.org",
    badgeText: "Top Rated",
    provider: "Coursera",
    type: "course",
    tags: ["python", "machine learning", "ai", "deep learning", "data"],
    offerText: "Financial Aid Available",
  },
  // System Design / Backend
  {
    id: "system-design-interview",
    title: "System Design Interview – An Insider's Guide",
    description: "The essential guide to master distributed systems, caching, and scalable architecture.",
    url: "https://bytebytego.com",
    badgeText: "Industry Classic",
    provider: "Alex Xu / ByteByteGo",
    type: "book",
    tags: ["system design", "backend", "database", "sql", "architecture", "microservices"],
  },
  // General / Default Community Support
  {
    id: "community-support",
    title: "Support Free Education on Quizzer",
    description: "Quizzer is 100% free to learners worldwide. Support our server and AI compute costs.",
    url: "https://github.com/sponsors",
    badgeText: "Keep Quizzer Free",
    provider: "GitHub Sponsors / Buy Me a Coffee",
    type: "support",
    tags: ["general", "all"],
  },
];

/**
 * Finds matching curated resources based on a quiz or topic context.
 * Falls back to top-rated general and community support items if no direct tag matches.
 *
 * @param contextTopic The topic title, quiz title, or keywords.
 * @param limit Maximum number of items to return.
 * @returns Array of matched SponsoredResourceItem.
 */
export function getContextualResources(contextTopic?: string, limit = 2): SponsoredResourceItem[] {
  if (!contextTopic || !contextTopic.trim()) {
    return CURATED_RESOURCES.slice(0, limit);
  }

  const normalized = contextTopic.toLowerCase();
  
  // Find matching items by keyword/tags
  const matches = CURATED_RESOURCES.filter((item) => {
    if (!item.tags) return false;
    return item.tags.some((tag) => normalized.includes(tag.toLowerCase()));
  });

  if (matches.length >= limit) {
    return matches.slice(0, limit);
  }

  // Backfill with general / top picks
  const fallback = CURATED_RESOURCES.filter(
    (item) => !matches.some((m) => m.id === item.id)
  );

  return [...matches, ...fallback].slice(0, limit);
}

