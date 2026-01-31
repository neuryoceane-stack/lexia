import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NavSignOut } from "@/components/nav-sign-out";

export default async function AppLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 dark:border-slate-700 dark:bg-slate-900/95">
        <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link
            href="/app"
            className="text-lg font-semibold text-emerald-700 dark:text-emerald-400"
          >
            Vocab Jardin
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/app/familles"
              className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              Familles
            </Link>
            <Link
              href="/app/revision"
              className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              Révision
            </Link>
            <Link
              href="/app/jardin"
              className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              Jardin
            </Link>
            <NavSignOut />
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
