import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { wordFamilies, lists, words } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { detectListLanguages } from "@/lib/language";
import { MotsClient } from "./mots-client";

export default async function ListeDetailPage({
  params,
}: {
  params: Promise<{ id: string; listId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id: familyId, listId } = await params;
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
  const [list] = await db
    .select()
    .from(lists)
    .where(
      and(eq(lists.id, listId), eq(lists.familyId, familyId))
    )
    .limit(1);
  if (!list) notFound();
  const motsList = await db
    .select()
    .from(words)
    .where(eq(words.listId, listId))
    .orderBy(asc(words.rank), asc(words.createdAt));

  const { termFlag, defFlag } = detectListLanguages(
    motsList.map((m) => m.term),
    motsList.map((m) => m.definition)
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <Link
          href={`/app/familles/${familyId}`}
          className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
        >
          ← {family.name}
        </Link>
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
          {list.name}
        </h1>
        {(termFlag || defFlag) && (
          <span className="text-2xl" title="Langues détectées">
            {termFlag}
            {termFlag && defFlag && (
              <span className="mx-1 text-slate-400" aria-hidden>→</span>
            )}
            {defFlag}
          </span>
        )}
      </div>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        {list.source === "manual"
          ? "Liste créée manuellement"
          : list.source === "pdf"
            ? "Liste extraite d’un PDF"
            : "Liste extraite d’une image (OCR)"}
      </p>
      <MotsClient
        familyId={familyId}
        listId={listId}
        initialMots={motsList}
      />
    </div>
  );
}
