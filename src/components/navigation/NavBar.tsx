"use client";

import * as React from "react";
import { CONTAINER_MAX_WIDTH } from "@/components/layouts/Container";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Menu as MenuIcon,
  LayoutDashboard,
  Plus,
  Settings,
  LogOut,
  Brain,
  Database,
  Home,
  BookOpen,
  Users,
  User,
  X,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDialog, usePanel } from "@/components/providers/OverlayProvider";
import { cn } from "@/utils/cn";

export function NavBar({ maxWidth = CONTAINER_MAX_WIDTH }: { maxWidth?: string }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const dialog = useDialog();
  const panel = usePanel();

  // State for Admin sub-menu dropdown
  const [isTaxonomyOpen, setIsTaxonomyOpen] = useState(true);

  const isAdminRoute = pathname.startsWith("/admin");
  const role = (session?.user as { role?: string } | null | undefined)?.role;
  const isAdminUser = role === "ADMIN";
  const isStudentUser = session?.user && !isAdminUser;

  // Warm dynamic routes before navigation so clicks feel instant.
  const prefetch = (href: string) => {
    if (href && href !== pathname) router.prefetch(href);
  };

  const publicNavLinks = [
    { href: "/", label: "Home", icon: <Home className="h-4 w-4" /> },
    { href: "/exams", label: "Exams", icon: <BookOpen className="h-4 w-4" /> },
    { href: "/deep-dives", label: "Deep Dives", icon: <Brain className="h-4 w-4" /> },
  ];

  const MobileNavDrawerBody = ({ onClose }: { onClose: () => void }) => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Image
          src="/quizzer.svg"
          alt="Quizzer Logo"
          width={71}
          height={24}
          priority
          className="dark:invert"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        {publicNavLinks.map((link, idx) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 animate-fade-in-up",
                isActive 
                  ? "bg-secondary text-foreground font-semibold" 
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              )}
              style={{ animationDelay: `${idx * 50}ms`, animationFillMode: "both" }}
              onClick={onClose}
            >
              {link.icon}
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );

  const AdminNavDrawerBody = ({ onClose }: { onClose: () => void }) => (
    <>
      <div className="flex flex-col gap-6 overflow-y-auto pr-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/quizzer.svg"
              alt="Quizzer Logo"
              width={71}
              height={24}
              className="dark:invert"
            />
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary border border-primary/20">Admin</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={onClose}
            aria-label="Close admin menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation list */}
        <div className="flex flex-col gap-1">
          {[
            { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
            { href: "/admin/generate", label: "Generate Quiz", icon: <Plus className="h-4 w-4" /> },
          ].map((item, idx) => (
            <Link key={item.href} href={item.href} onClick={onClose}>
              <span className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer animate-fade-in-up",
                pathname === item.href
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              )}
              style={{ animationDelay: `${idx * 60}ms`, animationFillMode: "both" }}
              >
                {item.icon}
                <span>{item.label}</span>
              </span>
            </Link>
          ))}

          {/* Sub category with collapse/expand */}
          <div className="flex flex-col animate-fade-in-up" style={{ animationDelay: `120ms`, animationFillMode: "both" }}>
            <button
              onClick={() => setIsTaxonomyOpen(!isTaxonomyOpen)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Settings className="h-4 w-4" />
                <span>Taxonomy</span>
              </div>
              {isTaxonomyOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {isTaxonomyOpen && (
              <div className="pl-8 pr-2 py-1 flex flex-col gap-0.5 border-l border-border/80 ml-5 mt-1">
                {[
                  { href: "/admin/manage/exams", label: "Exams" },
                  { href: "/admin/manage/topics", label: "Main Topics" },
                  { href: "/admin/manage/subtopics", label: "Sub Topics" },
                ].map((item, idx) => (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    onClick={onClose}
                  >
                    <span
                      className={cn(
                        "block px-3 py-1.5 text-xs rounded-md transition-all duration-200 cursor-pointer font-medium animate-fade-in-up",
                        pathname === item.href
                          ? "bg-secondary text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                      )}
                      style={{ animationDelay: `${180 + idx * 50}ms`, animationFillMode: "both" }}
                    >
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {[
            { href: "/admin/manage/quizzes", label: "Quizzes", icon: <Database className="h-4 w-4" />, match: "/admin/manage/quizzes" },
            { href: "/admin/manage/users", label: "Users", icon: <Users className="h-4 w-4" />, match: "/admin/manage/users" },
            { href: "/admin/manage/deep-dives", label: "Deep Dives", icon: <Brain className="h-4 w-4" />, match: "/admin/manage/deep-dives" },
          ].map((item, idx) => (
            <Link key={item.href} href={item.href} onClick={onClose}>
              <span className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer animate-fade-in-up",
                pathname.startsWith(item.match)
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              )}
              style={{ animationDelay: `${300 + idx * 60}ms`, animationFillMode: "both" }}
              >
                {item.icon}
                <span>{item.label}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Admin Footer LogOut */}
      <div className="border-t border-border/80 pt-4">
        <Button
          variant="secondary"
          className="w-full justify-start gap-3 text-sm text-danger hover:bg-danger/10 hover:border-danger/20 font-medium h-10 px-3"
          onClick={() => dialog.confirm({
            title: "Confirm logout",
            description: "Are you sure you want to log out of the admin portal?",
            okText: "Logout",
            okVariant: "danger",
            onConfirm: () => signOut({ callbackUrl: "/auth/admin-signin" }),
          })}
        >
          <LogOut className="h-4 w-4" />
          <span>Logout Admin</span>
        </Button>
      </div>
    </>
  );

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur-md transition-colors duration-200">
        <div 
          className="mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8" 
          style={{ maxWidth }}
        >
          {/* Left brand & menu button */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              onClick={() => {
                if (isAdminRoute) {
                  panel.open({
                    side: "left",
                    body: <AdminNavDrawerBody onClose={() => panel.close()} />,
                  });
                } else {
                  panel.open({
                    side: "left",
                    body: <MobileNavDrawerBody onClose={() => panel.close()} />,
                  });
                }
              }}
              aria-label="Open navigation menu"
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
            
            <Link
              href={isAdminRoute ? "/admin" : "/"}
              className="flex items-center"
              prefetch
              onMouseEnter={() => prefetch(isAdminRoute ? "/admin" : "/")}
              onFocus={() => prefetch(isAdminRoute ? "/admin" : "/")}
            >
              <Image
                src="/quizzer.svg"
                alt="Quizzer Logo"
                width={83}
                height={28}
                priority
                className="dark:invert transition-opacity opacity-90 hover:opacity-100"
              />
            </Link>
          </div>

          {/* Center Links (desktop view) */}
          {!isAdminRoute && (
            <div className="hidden lg:flex items-center gap-1.5">
              {publicNavLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onMouseEnter={() => prefetch(link.href)}
                    onFocus={() => prefetch(link.href)}
                  >
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "gap-2 px-3 py-1.5 h-8 font-medium text-xs rounded-md transition-all",
                        isActive ? "bg-surface-hover text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {link.icon}
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right Section widget */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle dark mode"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {!isAdminRoute && (
              <>
                {isStudentUser ? (
                  <div className="flex items-center gap-2 pl-2 border-l border-border/80">
                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20">
                      {session!.user!.name?.slice(0, 2).toUpperCase() || "U"}
                    </div>
                    <span className="hidden sm:inline text-xs font-semibold text-foreground/90 max-w-[120px] truncate">
                      {session!.user!.name || session!.user!.email?.split("@")[0]}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-danger hover:bg-danger/10"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      aria-label="Sign out"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                ) : !isAdminUser ? (
                  <Link href="/auth/login">
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="gap-1.5 text-xs font-semibold"
                    >
                      <User className="h-3.5 w-3.5" />
                      <span>Sign In</span>
                    </Button>
                  </Link>
                ) : null}
              </>
            )}

            {/* Admin toggle on admin routes (desktop view) */}
            {isAdminRoute && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                onClick={() => {
                  panel.open({
                    side: "right",
                    body: <AdminNavDrawerBody onClose={() => panel.close()} />,
                  });
                }}
                aria-label="Toggle admin navigation"
              >
                <MenuIcon className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

export default NavBar;
