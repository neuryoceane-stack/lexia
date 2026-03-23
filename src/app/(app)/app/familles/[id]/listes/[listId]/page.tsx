import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  wordFamilies,
  lists,
  words,
  classes,
  classMembers,
  classLists,
  revisions,
} from "@/lib/db/schema";
import { eq, and, asc, desc, inArray } from "drizzle-orm";
import { classifyWordSm2Status } from "@/lib/list-word-sm2";
import { MotsClient } from "./mots-client";

const PAGE_BG = "#F8F7FF";

export default async function ListeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; listId: string }>;
  searchParams?: Promise<{ lang?: string }>;
}) {
  const user = await getUser();
  if (!user?.id) redirect("/login");
  const { id: familyId, listId } = await params;
  const resolvedSearchParams = await searchParams;
  const langFromUrl = resolvedSearchParams?.lang?.trim() || undefined;
  const backHref = langFromUrl
    ? `/app/familles?lang=${encodeURIComponent(langFromUrl)}`
    : "/app/familles";
  const role = user.role;

  let family;
  let isOwner = false;
  if (role === "professeur") {
    [family] = await db
      .select()
      .from(wordFamilies)
      .where(
        and(
          eq(wordFamilies.id, familyId),
          eq(wordFamilies.userId, user.id)
        )
      )
      .limit(1);
    if (!family) notFound();
    isOwner = true;
  } else {
    [family] = await db
      .select()
      .from(wordFamilies)
      .where(eq(wordFamilies.id, familyId))
      .limit(1);
    if (!family) notFound();

    isOwner = family.userId === user.id;
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
            eq(classMembers.userId, user.id),
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

  const wordIds = motsList.map((w) => w.id);
  const latestByWord = new Map<
    string,
    { easeFactor: number | null; repetitions: number | null }
  >();

  if (wordIds.length > 0) {
    const revRows = await db
      .select({
        wordId: revisions.wordId,
        easeFactor: revisions.easeFactor,
        repetitions: revisions.repetitions,
        createdAt: revisions.createdAt,
      })
      .from(revisions)
      .where(
        and(eq(revisions.userId, user.id), inArray(revisions.wordId, wordIds))
      )
      .orderBy(desc(revisions.createdAt));

    for (const r of revRows) {
      if (!latestByWord.has(r.wordId)) {
        latestByWord.set(r.wordId, {
          easeFactor: r.easeFactor,
          repetitions: r.repetitions,
        });
      }
    }
  }

  const motsWithSm2 = motsList.map((m) => {
    const row = latestByWord.get(m.id);
    const sm2Status = classifyWordSm2Status(row);
    return {
      id: m.id,
      term: m.term,
      definition: m.definition,
      rank: m.rank,
      sm2Status,
    };
  });

  const stats = motsWithSm2.reduce(
    (acc, m) => {
      acc[m.sm2Status] += 1;
      return acc;
    },
    { mastered: 0, progress: 0, new: 0 }
  );
  const masteryPct =
    motsWithSm2.length === 0
      ? 0
      : Math.round((stats.mastered / motsWithSm2.length) * 100);

  return (
    <div
      className="min-h-full w-full -mx-4 -my-8 px-4 py-8 sm:-mx-6 sm:-my-10 sm:px-6 sm:py-10"
      style={{ backgroundColor: PAGE_BG }}
    >
      <div className="mx-auto max-w-3xl">
        <Link
          href={backHref}
          className="mb-[14px] inline-flex w-fit items-center gap-1 no-underline"
          style={{ fontSize: 12, color: "var(--foreground-muted)" }}
        >
          <ChevronLeft size={14} strokeWidth={2} aria-hidden className="shrink-0" />
          Retour à la bibliothèque
        </Link>

        <MotsClient
          listId={listId}
          listName={list.name}
          initialListLanguage={list.language}
          initialMots={motsWithSm2}
          masteryPct={masteryPct}
          stats={stats}
          canEdit={isOwner}
        />
      </div>
    </div>
  );
}
