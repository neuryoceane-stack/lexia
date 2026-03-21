import { db } from "@/lib/db";
import { revisions, words } from "@/lib/db/schema";
import { and, inArray } from "drizzle-orm";

export type ListProgressAnalytics = {
  classListId: string;
  listId: string;
  name: string;
  familyName: string;
  masteryPct: number;
  studentsRevisedCount: number;
  wordCount: number;
  lastActivityAt: Date | null;
};

export type StudentProgressAnalytics = {
  userId: string;
  masteryPct: number;
  /** Mots distincts ayant au moins une révision réussie. */
  wordsMastered: number;
  lastActivityAt: Date | null;
};

function pctSuccess(rows: { success: boolean }[]): number {
  if (rows.length === 0) return 0;
  const ok = rows.filter((r) => r.success).length;
  return Math.round((100 * ok) / rows.length);
}

/**
 * Agrège maîtrise / activité par liste et par élève (révisions sur les mots des listes assignées).
 */
export async function getClassDetailAnalytics(
  acceptedUserIds: string[],
  assignments: {
    classListId: string;
    listId: string;
    name: string;
    familyName: string;
  }[]
): Promise<{
  globalMasteryPct: number;
  listProgress: ListProgressAnalytics[];
  byUserId: Record<string, StudentProgressAnalytics>;
}> {
  const listIds = [...new Set(assignments.map((a) => a.listId))];
  if (listIds.length === 0 || acceptedUserIds.length === 0) {
    return {
      globalMasteryPct: 0,
      listProgress: assignments.map((a) => ({
        classListId: a.classListId,
        listId: a.listId,
        name: a.name,
        familyName: a.familyName,
        masteryPct: 0,
        studentsRevisedCount: 0,
        wordCount: 0,
        lastActivityAt: null,
      })),
      byUserId: {},
    };
  }

  const wordRows = await db
    .select({ id: words.id, listId: words.listId })
    .from(words)
    .where(inArray(words.listId, listIds));

  const wordsByList = new Map<string, string[]>();
  for (const w of wordRows) {
    const arr = wordsByList.get(w.listId) ?? [];
    arr.push(w.id);
    wordsByList.set(w.listId, arr);
  }

  const allWordIds = wordRows.map((w) => w.id);
  if (allWordIds.length === 0) {
    return {
      globalMasteryPct: 0,
      listProgress: assignments.map((a) => ({
        classListId: a.classListId,
        listId: a.listId,
        name: a.name,
        familyName: a.familyName,
        masteryPct: 0,
        studentsRevisedCount: 0,
        wordCount: wordsByList.get(a.listId)?.length ?? 0,
        lastActivityAt: null,
      })),
      byUserId: Object.fromEntries(
        acceptedUserIds.map((uid) => [
          uid,
          {
            userId: uid,
            masteryPct: 0,
            wordsMastered: 0,
            lastActivityAt: null,
          },
        ])
      ),
    };
  }

  const revRows = await db
    .select({
      userId: revisions.userId,
      wordId: revisions.wordId,
      success: revisions.success,
      createdAt: revisions.createdAt,
    })
    .from(revisions)
    .where(
      and(
        inArray(revisions.userId, acceptedUserIds),
        inArray(revisions.wordId, allWordIds)
      )
    );

  const globalMasteryPct = pctSuccess(revRows);

  const listProgress: ListProgressAnalytics[] = assignments.map((a) => {
    const wids = new Set(wordsByList.get(a.listId) ?? []);
    const subset = revRows.filter((r) => wids.has(r.wordId));
    const users = new Set(subset.map((r) => r.userId));
    let last: Date | null = null;
    for (const r of subset) {
      if (!last || r.createdAt > last) last = r.createdAt;
    }
    return {
      classListId: a.classListId,
      listId: a.listId,
      name: a.name,
      familyName: a.familyName,
      masteryPct: pctSuccess(subset),
      studentsRevisedCount: users.size,
      wordCount: wids.size,
      lastActivityAt: last,
    };
  });

  const byUserId: Record<string, StudentProgressAnalytics> = {};
  for (const uid of acceptedUserIds) {
    const subset = revRows.filter((r) => r.userId === uid);
    const successWords = new Set(
      subset.filter((r) => r.success).map((r) => r.wordId)
    );
    let last: Date | null = null;
    for (const r of subset) {
      if (!last || r.createdAt > last) last = r.createdAt;
    }
    byUserId[uid] = {
      userId: uid,
      masteryPct: pctSuccess(subset),
      wordsMastered: successWords.size,
      lastActivityAt: last,
    };
  }

  return { globalMasteryPct, listProgress, byUserId };
}
