import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  wordFamilies,
  lists,
  words,
  classes,
  classMembers,
  classLists,
} from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { detectListLanguages, KNOWN_LANGUAGE_CODES } from "@/lib/language";
import { BackLink } from "@/components/back-link";
import { FlagDisplay } from "@/components/flag-display";
import { MotsClient } from "./mots-client";
import { ListLanguageEditor } from "./list-language-editor";

export default async function ListeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; listId: string }>;
  searchParams?: Promise<{ lang?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id: familyId, listId } = await params;
  const resolvedSearchParams = await searchParams;
  const langFromUrl = resolvedSearchParams?.lang?.trim() || undefined;
  const backHref = langFromUrl
    ? `/app/familles?lang=${encodeURIComponent(langFromUrl)}`
    : "/app/familles";
  const role = (session.user as { role?: string }).role;

  let family;
  let isOwner = false;
  if (role === "professeur") {
    [family] = await db
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
    isOwner = true;
  } else {
    // Étudiant : autoriser si la liste appartient à l'utilisateur OU si elle est visible dans une classe où il est accepté.
    [family] = await db
      .select()
      .from(wordFamilies)
      .where(eq(wordFamilies.id, familyId))
      .limit(1);
    if (!family) notFound();

    isOwner = family.userId === session.user.id;
    if (!isOwner) {
      const viaClass = await db
        .select({ id: classLists.id })
        .from(classMembers)
        .innerJoin(classes, eq(classes.id, classMembers.classId))
        .innerJoin(
          classLists,
          and(
            eq(classLists.classId, classes.id),
            eq(classLists.listId, listId),
            eq(classLists.isVisible, true)
          )
        )
        .where(
          and(
            eq(classMembers.userId, session.user.id),
            eq(classMembers.status, "accepted")
          )
        )
        .limit(1);
      if (viaClass.length === 0) {
        notFound();
      }
    }
  }
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
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <BackLink href={backHref}>Retour à la bibliothèque</BackLink>
        <span className="text-slate-400 dark:text-slate-500">·</span>
        <Link
          href={langFromUrl ? `/app/familles/${familyId}?lang=${encodeURIComponent(langFromUrl)}` : `/app/familles/${familyId}`}
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
      {isOwner ? (
        <ListLanguageEditor listId={listId} currentLanguage={list.language} />
      ) : (
        <p className="mb-6 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <span>Langue de la liste (filtre Bibliothèque) :</span>
          <span className="inline-flex" title="Langue de la liste (non modifiable)">
            <FlagDisplay
              langCode={list.language && KNOWN_LANGUAGE_CODES.has(list.language) ? list.language : "fra"}
              size={20}
            />
          </span>
        </p>
      )}
      <MotsClient
        familyId={familyId}
        listId={listId}
        initialMots={motsList}
        canEdit={isOwner}
      />
    </div>
  );
}
