"use client";

import { useState } from "react";
import { Button, Text, NavDrawer, NavDrawerBody, NavDrawerHeader, NavItem, NavCategory, NavCategoryItem, NavSubItem, NavSubItemGroup } from "@fluentui/react-components";
import { Navigation24Regular, Board24Regular, Add24Regular, Options24Regular, SignOut24Regular, PanelLeft24Regular, Brain24Regular, DocumentDatabase24Regular, Home24Regular, BookOpen24Regular } from "@fluentui/react-icons";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

export function NavBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  
  const [isOpen, setIsOpen] = useState(false);

  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <nav style={{ 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center", 
      padding: "8px 24px", 
      backgroundColor: "#fff",
      borderBottom: "1px solid #e0e0e0",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
    }}>
      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        {isAdminRoute && (
          <Button 
            appearance="transparent" 
            icon={<Navigation24Regular />} 
            onClick={() => setIsOpen(!isOpen)} 
            aria-label="Toggle navigation"
          />
        )}
        <Text weight="bold" size={500}>
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>QuizGen</Link>
        </Text>
      </div>

      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <Button appearance="subtle" icon={<Home24Regular />}>Home</Button>
        </Link>
        <Link href="/exams" style={{ textDecoration: "none" }}>
          <Button appearance="subtle" icon={<BookOpen24Regular />}>Exams</Button>
        </Link>
        <Link href="/deep-dives" style={{ textDecoration: "none" }}>
          <Button appearance="subtle" icon={<Brain24Regular />}>Deep Dives</Button>
        </Link>
        {!isAdminRoute && (
          <Link href="/admin" style={{ textDecoration: "none" }}>
            <Button appearance="outline">Admin Panel</Button>
          </Link>
        )}
        {session && (
          <Button appearance="subtle" icon={<SignOut24Regular />} onClick={() => signOut({ callbackUrl: "/" })}>
            Sign Out
          </Button>
        )}
      </div>

      {isAdminRoute && (
        <NavDrawer 
          open={isOpen} 
          type="overlay"
          selectedValue={pathname}
          onOpenChange={(_, data) => setIsOpen(data.open)}
        >
          <NavDrawerHeader style={{ display: 'flex', alignItems: 'center', padding: '16px' }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <PanelLeft24Regular />
              <Text weight="bold" size={400}>Admin Menu</Text>
            </div>
          </NavDrawerHeader>
          <NavDrawerBody style={{ paddingTop: '8px' }}>
            <NavItem 
              href="/admin" 
              value="/admin" 
              icon={<Board24Regular />}
              onClick={(e) => { e.preventDefault(); router.push("/admin"); setIsOpen(false); }}
            >
              Dashboard
            </NavItem>
            
            <NavItem 
              href="/admin/generate" 
              value="/admin/generate" 
              icon={<Add24Regular />}
              onClick={(e) => { e.preventDefault(); router.push("/admin/generate"); setIsOpen(false); }}
            >
              Generate Quiz
            </NavItem>
            
            <NavCategory value="taxonomy">
              <NavCategoryItem icon={<Options24Regular />}>
                Taxonomy
              </NavCategoryItem>
              <NavSubItemGroup>
                <NavSubItem 
                  href="/admin/manage/exams" 
                  value="/admin/manage/exams"
                  onClick={(e) => { e.preventDefault(); router.push("/admin/manage/exams"); setIsOpen(false); }}
                >
                  Exams
                </NavSubItem>
                <NavSubItem 
                  href="/admin/manage/topics" 
                  value="/admin/manage/topics"
                  onClick={(e) => { e.preventDefault(); router.push("/admin/manage/topics"); setIsOpen(false); }}
                >
                  Main Topics
                </NavSubItem>
                <NavSubItem 
                  href="/admin/manage/subtopics" 
                  value="/admin/manage/subtopics"
                  onClick={(e) => { e.preventDefault(); router.push("/admin/manage/subtopics"); setIsOpen(false); }}
                >
                  Sub Topics
                </NavSubItem>
              </NavSubItemGroup>
            </NavCategory>

            <NavItem
              href="/admin/manage/quizzes"
              value="/admin/manage/quizzes"
              icon={<DocumentDatabase24Regular />}
              onClick={(e) => { e.preventDefault(); router.push("/admin/manage/quizzes"); setIsOpen(false); }}
            >
              Quizzes
            </NavItem>



            <NavItem
              href="/admin/manage/deep-dives"
              value="/admin/manage/deep-dives"
              icon={<Brain24Regular />}
              onClick={(e) => { e.preventDefault(); router.push("/admin/manage/deep-dives"); setIsOpen(false); }}
            >
              Deep Dives
            </NavItem>

          </NavDrawerBody>
        </NavDrawer>
      )}
    </nav>
  );
}
