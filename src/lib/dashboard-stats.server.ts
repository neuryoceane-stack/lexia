import "server-only";

import { db } from "@/lib/db";
import { wordFamilies, lists, words, revisions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export type DashboardStatsSnapshot = {
  listsCount: number;
  wordsCount: number;
  dueWordsCount: number;
  masteredWordsCount: number;
};

export async function computeDashboardStats(
  userId: string
): Promise<DashboardStatsSnapshot> {
  const now = new Date();

  const [userLists, userWords, allRevisions] = await Promise.all([
    db
      .select({ id: lists.id })
      .from(lists)
      .innerJoin(wordFamilies, eq(lists.familyId, wordFamilies.id))
      .where(eq(wordFamilies.userId, userId)),
    db
      .select({ id: words.id })
      .from(words)
      .innerJoin(lists, eq(words.listId, lists.id))
      .innerJoin(wordFamilies, eq(lists.familyId, wordFamilies.id))
      .where(eq(wordFamilies.userId, userId)),
    db
      .select({
        wordId: revisions.wordId,
        nextReviewAt: revisions.nextReviewAt,
        repetitions: revisions.repetitions,
        createdAt: revisions.createdAt,
      })
      .from(revisions)
      .where(eq(revisions.userId, userId))
      .orderBy(desc(revisions.createdAt)),
  ]);

  const listsCount = userLists.length;
  const wordsCount = userWords.length;

  if (wordsCount === 0) {
    return {
      listsCount,
      wordsCount: 0,
      dueWordsCount: 0,
      masteredWordsCount: 0,
    };
  }

  const latestByWord = new Map<
    string,
    { nextReviewAt: Date; repetitions: number | null }
  >();
  for (const r of allRevisions) {
    if (!latestByWord.has(r.wordId)) {
      latestByWord.set(r.wordId, {
        nextReviewAt: r.nextReviewAt,
        repetitions: r.repetitions,
      });
    }
  }

  let dueWordsCount = 0;
  let masteredWordsCount = 0;

  for (const w of userWords) {
    const latest = latestByWord.get(w.id);
    if (!latest) {
      dueWordsCount++;
      continue;
    }
    if (latest.nextReviewAt <= now) {
      dueWordsCount++;
    }
    if ((latest.repetitions ?? 0) >= 3) {
      masteredWordsCount++;
    }
  }

  return {
    listsCount,
    wordsCount,
    dueWordsCount,
    masteredWordsCount,
  };
}
