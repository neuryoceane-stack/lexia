import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { wordFamilies, lists, words } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { detectListLanguages, KNOWN_LANGUAGE_CODES } from "@/lib/language";
import { FlagDisplay } from "@/components/flag-display";
import { MotsClient } from "./mots-client";
import { ListLanguageEditor } from "./list-language-editor";

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

  const { termLang, defLang } = detectListLanguages(
    motsList.map((m) => m.term),
    motsList.map((m) => m.definition)
  );

  /** 1er drapeau = langue des termes (public/flags, ex. fr.png) ; 2e = définitions (ex. gb.png). */
  const displayTermLang = termLang && KNOWN_LANGUAGE_CODES.has(termLang)
    ? termLang
    : (list.language && KNOWN_LANGUAGE_CODES.has(list.language) ? list.language : "fra");
  const displayDefLang = defLang && KNOWN_LANGUAGE_CODES.has(defLang)
    ? defLang
    : "eng";

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <Link
          href="/app/familles"
          className="text-sm font-medium text-vocab-gray hover:text-primary dark:text-slate-400 dark:hover:text-primary-light"
        >
          ← Retour à la bibliothèque
        </Link>
        <span className="text-slate-400 dark:text-slate-500">·</span>
        <Link
          href={`/app/familles/${familyId}`}
          className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
        >
          {family.name}
        </Link>
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
          {list.name}
        </h1>
        {(displayTermLang || displayDefLang) && (
          <span className="flex items-center gap-1 text-2xl" title="Langues de la liste">
            <FlagDisplay langCode={displayTermLang} size={28} />
            {displayTermLang && displayDefLang && (
              <span className="mx-1 text-slate-400" aria-hidden>→</span>
            )}
            <FlagDisplay langCode={displayDefLang} size={28} />
          </span>
        )}
      </div>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        {list.source === "manual"
          ? "Liste créée manuellement"
          : list.source === "pdf"
            ? "Liste extraite d’un PDF"
            : "Liste extraite d’une image (OCR)"}
      </p>
      <ListLanguageEditor listId={listId} currentLanguage={list.language} />
      <MotsClient
        familyId={familyId}
        listId={listId}
        initialMots={motsList}
      />
    </div>
  );
}
