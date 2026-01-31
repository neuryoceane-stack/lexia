import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { wordFamilies } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { FamillesClient } from "./familles-client";

export default async function FamillesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const families = await db
    .select()
    .from(wordFamilies)
    .where(eq(wordFamilies.userId, session.user.id))
    .orderBy(asc(wordFamilies.orderIndex), asc(wordFamilies.createdAt));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
          Familles de mots
        </h1>
        <FamillesClient />
      </div>
      <p className="mb-6 text-slate-600 dark:text-slate-400">
        Crée des familles (Corps, Adverbes, Famille…) puis des listes de vocabulaire à l’intérieur.
      </p>
      {families.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-600 dark:bg-slate-800/50">
          <p className="text-slate-600 dark:text-slate-400">
            Aucune famille pour l’instant. Crée-en une pour commencer.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {families.map((f) => (
            <li key={f.id}>
              <Link
                href={`/app/familles/${f.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:hover:border-emerald-600"
              >
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  {f.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
