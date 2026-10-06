import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar user={session.user} />
      <main className="lg:pl-60">
        <div className="px-4 py-5 pb-24 lg:px-8 lg:py-8 lg:pb-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}