import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { wordFamilies, lists } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { ListesClient } from "./listes-client";

export default async function FamilleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id: familyId } = await params;
  const [family] = await db
    .select()
    .from(wordFamilies)
    .where(
      and(
        eq(wordFamilies.id, familyId),
        eq(wordFamilies.userId, session.user.id)
      )
    )
    .limit(1);
  if (!family) notFound();
  const listesList = await db
    .select()
    .from(lists)
    .where(eq(lists.familyId, familyId))
    .orderBy(asc(lists.createdAt));

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <Link
          href="/app/familles"
          className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          ← Familles
        </Link>
      </div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
          {family.name}
        </h1>
        <ListesClient familyId={familyId} familyName={family.name} />
      </div>
      <p className="mb-6 text-slate-600 dark:text-slate-400">
        Listes de vocabulaire dans cette famille. Ajoute des mots à la main, depuis un PDF ou une image.
      </p>
      {listesList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-600 dark:bg-slate-800/50">
          <p className="text-slate-600 dark:text-slate-400">
            Aucune liste. Crée-en une (manuel, PDF ou image).
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {listesList.map((list) => (
            <li key={list.id}>
              <Link
                href={`/app/familles/${familyId}/listes/${list.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-primary hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:hover:border-primary-light"
              >
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  {list.name}
                </span>
                <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                  {list.source === "manual"
                    ? "Manuel"
                    : list.source === "pdf"
                      ? "PDF"
                      : "Image"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
