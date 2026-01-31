import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function AppDashboardPage() {
  const session = await auth();
  const name = session?.user?.name || session?.user?.email?.split("@")[0] || "toi";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800 dark:text-slate-100">
        Bonjour, {name}
      </h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/app/familles"
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-300 hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:hover:border-emerald-600"
        >
          <h2 className="font-medium text-slate-800 dark:text-slate-100">
            Familles de mots
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Créer et gérer tes familles (Corps, Adverbes…) et tes listes.
          </p>
        </Link>
        <Link
          href="/app/revision"
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-300 hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:hover:border-emerald-600"
        >
          <h2 className="font-medium text-slate-800 dark:text-slate-100">
            Révision
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Réviser les mots à revoir (flashcards).
          </p>
        </Link>
        <Link
          href="/app/jardin"
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-300 hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:hover:border-emerald-600 sm:col-span-2"
        >
          <h2 className="font-medium text-slate-800 dark:text-slate-100">
            Mon jardin
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Voir ta progression : le jardin grandit avec ton apprentissage.
          </p>
        </Link>
      </div>
    </div>
  );
}
