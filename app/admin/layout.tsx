import type { CSSProperties } from "react";
import { NavBar } from "@/components/ui/NavBar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f9f9f9' }}>
      <NavBar maxWidth="1200px" />
      <main style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {children}
      </main>
    </div>
  );
}
