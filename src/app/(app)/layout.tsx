import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";

export default async function AppLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-slate-900">
      <AppHeader user={session.user} />
      <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
