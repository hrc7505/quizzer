"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu as MenuIcon, Sun, Moon, LogOut, User } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { usePanel } from "@/components/providers/OverlayProvider";
import { cn } from "@/utils/cn";
import { CONTAINER_MAX_WIDTH } from "@/components/layouts/Container";
import { publicNavLinks } from "@/components/navigation/nav-items";
import { MobileNavDrawer } from "@/components/navigation/MobileNavDrawer";
import { AdminNavDrawer } from "@/components/navigation/AdminNavDrawer";

export function NavBar({ maxWidth = CONTAINER_MAX_WIDTH }: { maxWidth?: string }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const panel = usePanel();

  const isAdminRoute = pathname.startsWith("/admin");
  const role = (session?.user as { role?: string } | null | undefined)?.role;
  const isAdminUser = role === "ADMIN";
  const isStudentUser = !!session?.user && !isAdminUser;

  // Warm dynamic routes before navigation so clicks feel instant.
  const prefetch = (href: string) => {
    if (href && href !== pathname) router.prefetch(href);
  };

  const openDrawer = (body: React.ReactNode) =>
    panel.open({ side: isAdminRoute ? "right" : "left", body });

  const brandHref = isAdminRoute ? "/admin" : "/";

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8" style={{ maxWidth }}>
        {/* Left: menu + brand */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
            onClick={() =>
              openDrawer(
                isAdminRoute ? (
                  <AdminNavDrawer pathname={pathname} onClose={() => panel.close()} />
                ) : (
                  <MobileNavDrawer pathname={pathname} onClose={() => panel.close()} />
                )
              )
            }
            aria-label="Open navigation menu"
          >
            <MenuIcon className="h-5 w-5" />
          </Button>

          <Link
            href={brandHref}
            className="flex items-center"
            prefetch
            onMouseEnter={() => prefetch(brandHref)}
            onFocus={() => prefetch(brandHref)}
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

        {/* Center: public links (desktop) */}
        {!isAdminRoute && (
          <div className="hidden lg:flex items-center gap-1.5">
            {publicNavLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link key={link.href} href={link.href} onMouseEnter={() => prefetch(link.href)} onFocus={() => prefetch(link.href)}>
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

        {/* Right: theme + account / admin controls */}
        <div className="flex items-center gap-2">
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

          {!isAdminRoute &&
            (isStudentUser ? (
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
                <Button variant="primary" size="sm" className="gap-1.5 text-xs font-semibold">
                  <User className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </Button>
              </Link>
            ) : null)}

          {isAdminRoute && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex h-8 w-8 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              onClick={() => openDrawer(<AdminNavDrawer pathname={pathname} onClose={() => panel.close()} />)}
              aria-label="Toggle admin navigation"
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
