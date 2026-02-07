import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  wordFamilies,
  lists,
  words,
  revisions,
} from "@/lib/db/schema";
import { eq, and, asc, desc, sql, or, like, inArray } from "drizzle-orm";

export type BibliothequeList = {
  id: string;
  familyId: string;
  familyName: string;
  name: string;
  language: string | null;
  wordCount: number;
  progressPercent: number;
  createdAt: Date;
};

/**
 * GET /api/bibliotheque
 * Query: lang (ISO 639-3), search (list name or word), sort (alpha | created | updated)
 * Returns lists for the user with word count and progress %, filtered by language and search.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang")?.trim() || undefined;
  const search = searchParams.get("search")?.trim() || undefined;
  const sort = searchParams.get("sort") || "alpha"; // alpha | created | updated

  const userLists = await db
    .select({
      id: lists.id,
      familyId: lists.familyId,
      name: lists.name,
      language: lists.language,
      createdAt: lists.createdAt,
      familyName: wordFamilies.name,
    })
    .from(lists)
    .innerJoin(wordFamilies, eq(lists.familyId, wordFamilies.id))
    .where(eq(wordFamilies.userId, userId));

  let filtered = userLists;

  if (lang) {
    filtered = filtered.filter((l) => l.language === lang);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    const listIdsByName = new Set(
      filtered.filter((l) => l.name.toLowerCase().includes(searchLower)).map((l) => l.id)
    );
    const wordsInSearch = await db
      .select({ listId: words.listId })
      .from(words)
      .innerJoin(lists, eq(words.listId, lists.id))
      .innerJoin(wordFamilies, eq(lists.familyId, wordFamilies.id))
      .where(
        and(
          eq(wordFamilies.userId, userId),
          or(
            like(words.term, `%${search}%`),
            like(words.definition, `%${search}%`)
          )
        )
      );
    const listIdsByWord = new Set(wordsInSearch.map((w) => w.listId));
    const combinedIds = new Set([...listIdsByName, ...listIdsByWord]);
    filtered = filtered.filter((l) => combinedIds.has(l.id));
  }

  const listIds = filtered.map((l) => l.id);

  const languages = Array.from(
    new Set(
      userLists
        .map((l) => l.language)
        .filter((x): x is string => x != null && x !== "")
    )
  ).sort();

  if (listIds.length === 0) {
    return NextResponse.json({ lists: [], languages });
  }

  const wordCounts = await db
    .select({
      listId: words.listId,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(words)
    .where(inArray(words.listId, listIds))
    .groupBy(words.listId);

  const countByList = new Map(wordCounts.map((r) => [r.listId, r.count]));

  const successCounts = await db
    .select({
      wordId: revisions.wordId,
    })
    .from(revisions)
    .where(
      and(eq(revisions.userId, userId), eq(revisions.success, true))
    );

  const successWordIds = new Set(successCounts.map((r) => r.wordId));

  const wordToList = await db
    .select({ id: words.id, listId: words.listId })
    .from(words)
    .where(inArray(words.listId, listIds));

  const successByList = new Map<string, number>();
  for (const w of wordToList) {
    if (successWordIds.has(w.id)) {
      successByList.set(w.listId, (successByList.get(w.listId) ?? 0) + 1);
    }
  }

  const listsWithStats: BibliothequeList[] = filtered.map((l) => {
    const total = countByList.get(l.id) ?? 0;
    const success = successByList.get(l.id) ?? 0;
    const progressPercent = total > 0 ? Math.round((success / total) * 100) : 0;
    return {
      id: l.id,
      familyId: l.familyId,
      familyName: l.familyName,
      name: l.name,
      language: l.language,
      wordCount: total,
      progressPercent,
      createdAt: l.createdAt,
    };
  });

  if (sort === "created") {
    listsWithStats.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } else if (sort === "updated") {
    listsWithStats.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } else {
    listsWithStats.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }

  return NextResponse.json({ lists: listsWithStats, languages });
}
