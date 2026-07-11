"use client";

import { useState } from "react";
import {
  Button, Text, Avatar,
  NavDrawer, NavDrawerBody, NavDrawerHeader,
  NavItem, NavCategory, NavCategoryItem, NavSubItem, NavSubItemGroup,
  Dialog, DialogTrigger, DialogSurface, DialogBody,
  DialogTitle, DialogContent, DialogActions,
  Drawer, DrawerHeader, DrawerHeaderTitle, DrawerBody,
} from "@fluentui/react-components";
import {
  Navigation24Regular, Board24Regular, Add24Regular, Options24Regular,
  SignOut24Regular, PanelLeft24Regular, Brain24Regular,
  DocumentDatabase24Regular, Home24Regular, BookOpen24Regular,
  People24Regular, Person24Regular, Dismiss24Regular,
} from "@fluentui/react-icons";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useNavBarStyles } from "./styles/useNavBarStyles";

/**
 * NavBar Component.
 * - On desktop: horizontal nav with links
 * - On mobile: hamburger button that opens a full slide-out drawer
 * - On admin routes: shows the admin NavDrawer via the hamburger
 * - Role-aware: only shows profile/signout for USER role on public routes
 */
export function NavBar() {
  const styles = useNavBarStyles();
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const [isAdminDrawerOpen, setIsAdminDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  const isAdminRoute = pathname.startsWith("/admin");
  const role = (session?.user as any)?.role;
  const isAdminUser = role === "ADMIN";
  const isStudentUser = session?.user && !isAdminUser;

  /** Public nav links (used in both desktop and mobile drawer) */
  const publicNavLinks = [
    { href: "/", label: "Home", icon: <Home24Regular /> },
    { href: "/exams", label: "Exams", icon: <BookOpen24Regular /> },
    { href: "/deep-dives", label: "Deep Dives", icon: <Brain24Regular /> },
  ];

  return (
    <>
      <nav className={styles.nav}>
        {/* Left: hamburger (mobile) + brand */}
        <div className={styles.leftSection}>
          {/* Mobile hamburger */}
          <Button
            appearance="transparent"
            icon={<Navigation24Regular />}
            className={styles.hamburger}
            onClick={() =>
              isAdminRoute
                ? setIsAdminDrawerOpen(true)
                : setIsMobileMenuOpen(true)
            }
            aria-label="Open navigation menu"
          />
          {/* Brand */}
          <Link href={isAdminRoute ? "/admin" : "/"} className={styles.brandLink}>
            <Image
              src="/quizzer.svg"
              alt="Quizzer"
              width={120}
              height={32}
              priority
              className={styles.brandImage}
            />
          </Link>
        </div>

        {/* Center: Desktop nav links (public only, hidden on mobile) */}
        {!isAdminRoute && (
          <div className={styles.desktopLinks}>
            {publicNavLinks.map((link) => (
              <Link key={link.href} href={link.href} className={styles.navLinkAnchor}>
                <Button appearance="subtle" icon={link.icon}>
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>
        )}

        {/* Right: Auth widget */}
        <div className={styles.rightSection}>
          {!isAdminRoute && (
            <>
              {isStudentUser ? (
                <div className={styles.userChip}>
                  <Avatar
                    size={24}
                    name={session!.user!.name || session!.user!.email || ""}
                    image={{ src: session!.user!.image || undefined }}
                  />
                  <Text size={200} weight="semibold" className={styles.userChipName}>
                    {session!.user!.name || session!.user!.email?.split("@")[0]}
                  </Text>
                  <Button
                    appearance="subtle"
                    icon={<SignOut24Regular />}
                    className={styles.signOutBtn}
                    onClick={() => signOut({ callbackUrl: "/" })}
                    aria-label="Sign out"
                  />
                </div>
              ) : !isAdminUser ? (
                <Link href="/auth/login" className={styles.navLinkAnchor}>
                  <Button appearance="primary" icon={<Person24Regular />}>
                    <span className={styles.btnLabel}>Sign In</span>
                  </Button>
                </Link>
              ) : null}
            </>
          )}

          {/* Admin toggle on admin routes (desktop) */}
          {isAdminRoute && (
            <Button
              appearance="transparent"
              icon={<Navigation24Regular />}
              className={styles.adminDesktopToggle}
              onClick={() => setIsAdminDrawerOpen(true)}
              aria-label="Toggle admin navigation"
            />
          )}
        </div>
      </nav>

      {/* ── Mobile Public Nav Drawer ── */}
      <Drawer
        type="overlay"
        open={isMobileMenuOpen}
        onOpenChange={(_, d) => setIsMobileMenuOpen(d.open)}
        position="start"
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                icon={<Dismiss24Regular />}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              />
            }
          >
          <Image
            src="/quizzer.svg"
            alt="Quizzer"
            width={120}
            height={32}
            priority
            className={styles.brandImage}
          />
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
          <div className={styles.mobileNavBody}>
            {publicNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={styles.mobileNavLink}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className={styles.mobileNavIcon}>{link.icon}</span>
                {link.label}
              </Link>
            ))}

            <div className={styles.mobileDivider} />

            {isStudentUser ? (
              <>
                <div className={styles.mobileUserRow}>
                  <Avatar
                    size={28}
                    name={session!.user!.name || session!.user!.email || ""}
                    image={{ src: session!.user!.image || undefined }}
                  />
                  <Text size={300} weight="semibold">
                    {session!.user!.name || session!.user!.email?.split("@")[0]}
                  </Text>
                </div>
                <button
                  className={styles.mobileSignOutBtn}
                  onClick={() => { setIsMobileMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                >
                  <SignOut24Regular className={styles.iconSmall} /> Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className={styles.mobileSignInBtn}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Person24Regular className={styles.iconSmall} /> Sign In
              </Link>
            )}
          </div>
        </DrawerBody>
      </Drawer>

      {/* ── Admin NavDrawer (overlay, all screen sizes) ── */}
      {isAdminRoute && (
        <NavDrawer
          open={isAdminDrawerOpen}
          type="overlay"
          selectedValue={pathname}
          onOpenChange={(_, data) => setIsAdminDrawerOpen(data.open)}
        >
          <NavDrawerHeader className={styles.adminDrawerHeader}>
            <div className={styles.adminDrawerHeaderRow}>
              <PanelLeft24Regular />
              <Text weight="bold" size={400}>Admin Menu</Text>
            </div>
          </NavDrawerHeader>
          <NavDrawerBody>
            <NavItem
              href="/admin" value="/admin" icon={<Board24Regular />}
              onClick={(e) => { e.preventDefault(); router.push("/admin"); setIsAdminDrawerOpen(false); }}
            >Dashboard</NavItem>

            <NavItem
              href="/admin/generate" value="/admin/generate" icon={<Add24Regular />}
              onClick={(e) => { e.preventDefault(); router.push("/admin/generate"); setIsAdminDrawerOpen(false); }}
            >Generate Quiz</NavItem>

            <NavCategory value="taxonomy">
              <NavCategoryItem icon={<Options24Regular />}>Taxonomy</NavCategoryItem>
              <NavSubItemGroup>
                <NavSubItem href="/admin/manage/exams" value="/admin/manage/exams"
                  onClick={(e) => { e.preventDefault(); router.push("/admin/manage/exams"); setIsAdminDrawerOpen(false); }}
                >Exams</NavSubItem>
                <NavSubItem href="/admin/manage/topics" value="/admin/manage/topics"
                  onClick={(e) => { e.preventDefault(); router.push("/admin/manage/topics"); setIsAdminDrawerOpen(false); }}
                >Main Topics</NavSubItem>
                <NavSubItem href="/admin/manage/subtopics" value="/admin/manage/subtopics"
                  onClick={(e) => { e.preventDefault(); router.push("/admin/manage/subtopics"); setIsAdminDrawerOpen(false); }}
                >Sub Topics</NavSubItem>
              </NavSubItemGroup>
            </NavCategory>

            <NavItem href="/admin/manage/quizzes" value="/admin/manage/quizzes" icon={<DocumentDatabase24Regular />}
              onClick={(e) => { e.preventDefault(); router.push("/admin/manage/quizzes"); setIsAdminDrawerOpen(false); }}
            >Quizzes</NavItem>

            <NavItem href="/admin/manage/users" value="/admin/manage/users" icon={<People24Regular />}
              onClick={(e) => { e.preventDefault(); router.push("/admin/manage/users"); setIsAdminDrawerOpen(false); }}
            >Users</NavItem>

            <NavItem href="/admin/manage/deep-dives" value="/admin/manage/deep-dives" icon={<Brain24Regular />}
              onClick={(e) => { e.preventDefault(); router.push("/admin/manage/deep-dives"); setIsAdminDrawerOpen(false); }}
            >Deep Dives</NavItem>
          </NavDrawerBody>

          <div className={styles.adminDrawerFooter}>
            <Dialog open={confirmLogoutOpen} onOpenChange={(_, data) => setConfirmLogoutOpen(data.open)}>
              <DialogTrigger disableButtonEnhancement>
                <NavItem href="#" value="logout" icon={<SignOut24Regular />}
                  onClick={(e) => { e.preventDefault(); setConfirmLogoutOpen(true); }}
                >Logout</NavItem>
              </DialogTrigger>
              <DialogSurface>
                <DialogBody>
                  <DialogTitle>Confirm logout</DialogTitle>
                  <DialogContent>Are you sure you want to log out of the admin portal?</DialogContent>
                  <DialogActions>
                    <Button appearance="secondary" onClick={() => setConfirmLogoutOpen(false)}>Cancel</Button>
                    <Button appearance="primary" onClick={() => { setConfirmLogoutOpen(false); signOut({ callbackUrl: "/auth/admin-signin" }); }}>
                      Logout
                    </Button>
                  </DialogActions>
                </DialogBody>
              </DialogSurface>
            </Dialog>
          </div>
        </NavDrawer>
      )}
    </>
  );
}
