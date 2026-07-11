import { NavBar } from "@/components/ui/NavBar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f9f9f9' }}>
      <NavBar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        {children}
      </main>
    </div>
  );
}
