import { BottomNav } from "@/components/layout/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-lg bg-white">
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
