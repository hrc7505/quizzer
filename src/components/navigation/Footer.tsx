import Image from "next/image";
import Link from "next/link";
import { 
  Sparkles, 
  Languages, 
  ShieldCheck, 
  GraduationCap, 
  BookOpen, 
  HelpCircle, 
  UserCircle, 
  Layers, 
  Calculator,
  Brain,
  Home,
  User,
  ArrowUpRight
} from "lucide-react";

import { CONTAINER_MAX_WIDTH } from "@/components/layouts/Container";
import { cn } from "@/utils/cn";
import type { FooterProps, FooterLinkSection } from "./interfaces/Footer.interface";

/**
 * Structured link sections for the Quizzer footer.
 * Only contains routes with active, working pages.
 */
const footerSections: FooterLinkSection[] = [
  {
    title: "Learn & Practice",
    links: [
      { label: "Home", href: "/", icon: <Home className="h-3.5 w-3.5" /> },
      { label: "Browse Exams", href: "/exams", icon: <BookOpen className="h-3.5 w-3.5" /> },
      { label: "AI Deep Dives", href: "/deep-dives", icon: <Brain className="h-3.5 w-3.5" /> },
    ],
  },
  {
    title: "About & Support",
    links: [
      { label: "About Quizzer", href: "/about", icon: <GraduationCap className="h-3.5 w-3.5" /> },
      { label: "Contact Us", href: "/contact", icon: <HelpCircle className="h-3.5 w-3.5" /> },
    ],
  },
  {
    title: "Account & Data",
    links: [
      { label: "User Profile", href: "/profile", icon: <UserCircle className="h-3.5 w-3.5" /> },
      { label: "What Data We Record", href: "/data-privacy", icon: <ShieldCheck className="h-3.5 w-3.5" />, badge: "Privacy" },
      { label: "Sign In", href: "/auth/login", icon: <User className="h-3.5 w-3.5" /> },
    ],
  },
];

/**
 * Global application footer component rendered across public pages.
 * Displays brand identity, platform capability badges, active navigation links, and data transparency notice.
 *
 * @param props Footer configuration options including maximum width and custom class names.
 * @returns JSX Element representing the footer.
 */
export function Footer({ maxWidth = CONTAINER_MAX_WIDTH, className }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn("border-t border-border/80 bg-card/60 backdrop-blur-xs text-foreground transition-colors", className)}>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16" style={{ maxWidth }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 sm:gap-10 mb-12">
          
          {/* Brand & Mission column (full width on small/medium, 2 cols on large) */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2 flex flex-col gap-4">
            <Link href="/" className="inline-flex items-center gap-2 w-fit">
              <Image
                src="/quizzer.svg"
                alt="Quizzer Logo"
                width={95}
                height={32}
                className="dark:invert transition-opacity opacity-90 hover:opacity-100"
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm m-0">
              Quizzer is an intelligent, distraction-free study platform combining curriculum-aligned multiple-choice questions with deep, persistent AI explanations.
            </p>
            
            {/* Platform Feature Badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="h-3 w-3" />
                Intelligent AI Explanations
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-info/10 text-info border border-info/20">
                <Languages className="h-3 w-3" />
                EN · ગુજરાતી · हिन्दी
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-success/10 text-success border border-success/20">
                <Calculator className="h-3 w-3" />
                KaTeX LaTeX Formulas
              </span>
            </div>
          </div>

          {/* Navigation link sections — only active pages */}
          {footerSections.map((section) => (
            <div key={section.title} className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/80 m-0">
                {section.title}
              </h4>
              <ul className="flex flex-col gap-2.5 list-none p-0 m-0 text-sm">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-xs font-medium no-underline"
                    >
                      {link.icon && <span className="opacity-70 group-hover:opacity-100 transition-opacity">{link.icon}</span>}
                      <span>{link.label}</span>
                      {link.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>© {currentYear} Quizzer. Built for curious learners and exam aspirants.</span>
            <span className="hidden sm:inline text-border">•</span>
            <Link href="/data-privacy" className="hover:text-foreground transition-colors underline-offset-2 hover:underline">
              User Data Transparency & Privacy
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground font-semibold">
              v1.0 Public Edition
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
