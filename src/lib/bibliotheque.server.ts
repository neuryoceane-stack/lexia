import "server-only";

import { db } from "@/lib/db";
import {
  wordFamilies,
  lists,
  words,
  revisions,
} from "@/lib/db/schema";
import { eq, and, desc, sql, or, like, inArray } from "drizzle-orm";
import { classifyWordSm2Status } from "@/lib/list-word-sm2";

export type BibliothequeListRow = {
  id: string;
  familyId: string;
  familyName: string;
  name: string;
  language: string | null;
  wordCount: number;
  progressPercent: number;
  sm2MasteryPct: number;
  sm2MasteredCount: number;
  dueTodayCount: number;
  createdAt: Date;
};

export type BibliothequeQuery = {
  lang?: string;
  search?: string;
  sort?: "alpha" | "created" | "updated";
};

function languageMatches(
  filterLang: string,
  listLang: string | null | undefined
): boolean {
  const raw = listLang != null ? String(listLang).trim() : "";
  if (raw === "") return true;
  const n = (s: string) => s.toLowerCase().trim();
  const f = n(filterLang);
  const L = n(raw);
  if (f === "eng" || f === "en") return L === "eng" || L === "en";
  if (f === "fra" || f === "fr") return L === "fra" || L === "fr";
  return f === L;
}

/** Listes personnelles de l'élève avec stats (même logique que GET /api/bibliotheque). */
export async function loadBibliothequeForUser(
  userId: string,
  query: BibliothequeQuery = {}
): Promise<{ lists: BibliothequeListRow[]; languages: string[] }> {
  const lang = query.lang?.trim() || undefined;
  const search = query.search?.trim() || undefined;
  const sort = query.sort ?? "alpha";

  const userListsOwned = await db
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

  const allLists = userListsOwned;
  let filtered = allLists;

  if (lang) {
    filtered = filtered.filter((l) => languageMatches(lang, l.language));
  }

  if (search) {
    const searchLower = search.toLowerCase();
    const listIdsByName = new Set(
      filtered
        .filter((l) => l.name.toLowerCase().includes(searchLower))
        .map((l) => l.id)
    );
    const wordsInSearch = await db
      .select({ listId: words.listId })
      .from(words)
      .where(
        and(
          inArray(
            words.listId,
            filtered.map((l) => l.id)
          ),
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
      allLists
        .map((l) => l.language)
        .filter((x): x is string => x != null && x !== "")
    )
  ).sort();

  if (listIds.length === 0) {
    return { lists: [], languages };
  }

  const [wordCounts, successCounts, wordToList] = await Promise.all([
    db
      .select({
        listId: words.listId,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(words)
      .where(inArray(words.listId, listIds))
      .groupBy(words.listId),
    db
      .select({
        wordId: revisions.wordId,
      })
      .from(revisions)
      .where(and(eq(revisions.userId, userId), eq(revisions.success, true))),
    db
      .select({ id: words.id, listId: words.listId })
      .from(words)
      .where(inArray(words.listId, listIds)),
  ]);

  const countByList = new Map(wordCounts.map((r) => [r.listId, r.count]));
  const successWordIds = new Set(successCounts.map((r) => r.wordId));

  const successByList = new Map<string, number>();
  for (const w of wordToList) {
    if (successWordIds.has(w.id)) {
      successByList.set(w.listId, (successByList.get(w.listId) ?? 0) + 1);
    }
  }

  const wordsByListId = new Map<string, string[]>();
  for (const w of wordToList) {
    const arr = wordsByListId.get(w.listId);
    if (arr) arr.push(w.id);
    else wordsByListId.set(w.listId, [w.id]);
  }

  const allWordIds = wordToList.map((w) => w.id);
  const now = new Date();
  const latestByWord = new Map<
    string,
    {
      nextReviewAt: Date;
      easeFactor: number | null;
      repetitions: number | null;
    }
  >();

  if (allWordIds.length > 0) {
    const revRows = await db
      .select({
        wordId: revisions.wordId,
        nextReviewAt: revisions.nextReviewAt,
        easeFactor: revisions.easeFactor,
        repetitions: revisions.repetitions,
        createdAt: revisions.createdAt,
      })
      .from(revisions)
      .where(
        and(eq(revisions.userId, userId), inArray(revisions.wordId, allWordIds))
      )
      .orderBy(desc(revisions.createdAt));

    for (const r of revRows) {
      if (!latestByWord.has(r.wordId)) {
        latestByWord.set(r.wordId, {
          nextReviewAt: r.nextReviewAt,
          easeFactor: r.easeFactor,
          repetitions: r.repetitions,
        });
      }
    }
  }

  const listsWithStats: BibliothequeListRow[] = filtered.map((l) => {
    const total = countByList.get(l.id) ?? 0;
    const success = successByList.get(l.id) ?? 0;
    const progressPercent = total > 0 ? Math.round((success / total) * 100) : 0;
    const wids = wordsByListId.get(l.id) ?? [];
    let sm2Mastered = 0;
    let dueToday = 0;
    for (const wid of wids) {
      const row = latestByWord.get(wid);
      if (classifyWordSm2Status(row) === "mastered") sm2Mastered++;
      if (!row || row.nextReviewAt <= now) dueToday++;
    }
    const sm2MasteryPct =
      wids.length > 0 ? Math.round((sm2Mastered / wids.length) * 100) : 0;
    return {
      id: l.id,
      familyId: l.familyId,
      familyName: l.familyName,
      name: l.name,
      language: l.language,
      wordCount: total,
      progressPercent,
      sm2MasteryPct,
      sm2MasteredCount: sm2Mastered,
      dueTodayCount: dueToday,
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

  return { lists: listsWithStats, languages };
}
