import { Home, BookOpen, Brain, LayoutDashboard, Plus, Database, Users, Settings } from "lucide-react";

import type { ReactNode } from "react";

export interface NavItem {
  href: string;
  label: string;
  icon?: ReactNode;
  /** Optional custom active-match (defaults to exact `href`). */
  match?: string;
}

export const publicNavLinks: NavItem[] = [
  { href: "/", label: "Home", icon: <Home className="h-4 w-4" /> },
  { href: "/exams", label: "Exams", icon: <BookOpen className="h-4 w-4" /> },
  { href: "/deep-dives", label: "Deep Dives", icon: <Brain className="h-4 w-4" /> },
];

export const adminNavLinks: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/admin/generate", label: "Generate Quiz", icon: <Plus className="h-4 w-4" /> },
  { href: "/admin/manage/quizzes", label: "Quizzes", icon: <Database className="h-4 w-4" />, match: "/admin/manage/quizzes" },
  { href: "/admin/manage/users", label: "Users", icon: <Users className="h-4 w-4" />, match: "/admin/manage/users" },
  { href: "/admin/manage/deep-dives", label: "Deep Dives", icon: <Brain className="h-4 w-4" />, match: "/admin/manage/deep-dives" },
];

export const adminTaxonomyLinks: NavItem[] = [
  { href: "/admin/manage/exams", label: "Exams" },
  { href: "/admin/manage/topics", label: "Main Topics" },
  { href: "/admin/manage/subtopics", label: "Sub Topics" },
];

export const adminTaxonomyConfig = {
  icon: <Settings className="h-4 w-4" />,
  label: "Taxonomy",
  collapsibleBaseDelay: 120,
  itemBaseDelay: 180,
};
