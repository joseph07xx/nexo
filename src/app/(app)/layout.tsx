import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { countUnreadNotifications } from "@/features/notifications/data";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const unreadNotificationCount = session.user.coupleId
    ? await countUnreadNotifications(session.user.id)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar user={session.user} unreadNotificationCount={unreadNotificationCount} />
      <main className="lg:pl-60">
        <div className="mx-auto max-w-5xl px-4 pb-24 lg:px-8 lg:pb-8">
          <div className="flex h-12 items-center justify-end">
            <ThemeToggle />
          </div>
          <div className="pb-5 lg:pb-8">{children}</div>
        </div>
      </main>
      <MobileNav unreadNotificationCount={unreadNotificationCount} />
    </div>
  );
}