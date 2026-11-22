import { db } from "@/lib/db";
import { revisions, revisionSessions, words } from "@/lib/db/schema";
import { and, inArray } from "drizzle-orm";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type StudentRosterActivity = {
  userId: string;
  /** Mots distincts des listes de la classe, déjà révisés par l'élève. */
  wordCount: number;
  /** Révisions de ces mots sur les 7 derniers jours. */
  revisionsThisWeek: number;
  lastActivityAt: Date | null;
  /** Silence d'au moins 7 jours (adhésion comprise s'il n'y a jamais eu d'activité). */
  inactiveFor7Days: boolean;
};

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
  if (listIds.length === 0) {
    return {
      globalMasteryPct: 0,
      listProgress: [],
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

  /** Nombre de mots dans chaque liste (table words), indépendamment des révisions. */
  const listProgressZeroMastery = (): ListProgressAnalytics[] =>
    assignments.map((a) => ({
      classListId: a.classListId,
      listId: a.listId,
      name: a.name,
      familyName: a.familyName,
      masteryPct: 0,
      studentsRevisedCount: 0,
      wordCount: wordsByList.get(a.listId)?.length ?? 0,
      lastActivityAt: null,
    }));

  if (acceptedUserIds.length === 0) {
    return {
      globalMasteryPct: 0,
      listProgress: listProgressZeroMastery(),
      byUserId: {},
    };
  }

  const allWordIds = wordRows.map((w) => w.id);
  if (allWordIds.length === 0) {
    return {
      globalMasteryPct: 0,
      listProgress: listProgressZeroMastery(),
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

/**
 * Suivi de classe : mots des listes assignées, révisions de la semaine,
 * dernière activité (révision de ces mots ou session), inactifs depuis 7 jours.
 */
export async function getClassRosterActivity(
  accepted: { userId: string; joinedAt: Date | null }[],
  listIds: string[]
): Promise<{
  activeThisWeekCount: number;
  byUserId: Record<string, StudentRosterActivity>;
}> {
  const cutoff = new Date(Date.now() - WEEK_MS);
  const byUserId: Record<string, StudentRosterActivity> = {};
  for (const member of accepted) {
    byUserId[member.userId] = {
      userId: member.userId,
      wordCount: 0,
      revisionsThisWeek: 0,
      lastActivityAt: null,
      inactiveFor7Days: false,
    };
  }
  if (accepted.length === 0) {
    return { activeThisWeekCount: 0, byUserId };
  }

  const userIds = accepted.map((member) => member.userId);
  const wordsById = new Set<string>();
  if (listIds.length > 0) {
    const wordRows = await db
      .select({ id: words.id })
      .from(words)
      .where(inArray(words.listId, listIds));
    for (const word of wordRows) wordsById.add(word.id);
  }

  if (wordsById.size > 0) {
    const revRows = await db
      .select({
        userId: revisions.userId,
        wordId: revisions.wordId,
        createdAt: revisions.createdAt,
      })
      .from(revisions)
      .where(
        and(
          inArray(revisions.userId, userIds),
          inArray(revisions.wordId, [...wordsById])
        )
      );
    const seenWords = new Map<string, Set<string>>();
    for (const row of revRows) {
      const bucket = byUserId[row.userId];
      if (!bucket) continue;
      const seen = seenWords.get(row.userId) ?? new Set<string>();
      seen.add(row.wordId);
      seenWords.set(row.userId, seen);
      if (row.createdAt >= cutoff) bucket.revisionsThisWeek += 1;
      if (!bucket.lastActivityAt || row.createdAt > bucket.lastActivityAt) {
        bucket.lastActivityAt = row.createdAt;
      }
    }
    for (const [userId, seen] of seenWords) {
      const bucket = byUserId[userId];
      if (bucket) bucket.wordCount = seen.size;
    }
  }

  const sessions = await db
    .select({
      userId: revisionSessions.userId,
      endedAt: revisionSessions.endedAt,
    })
    .from(revisionSessions)
    .where(inArray(revisionSessions.userId, userIds));
  for (const session of sessions) {
    const bucket = byUserId[session.userId];
    if (!bucket) continue;
    if (!bucket.lastActivityAt || session.endedAt > bucket.lastActivityAt) {
      bucket.lastActivityAt = session.endedAt;
    }
  }

  let activeThisWeekCount = 0;
  const joinedAtByUser = new Map(accepted.map((member) => [member.userId, member.joinedAt]));
  for (const bucket of Object.values(byUserId)) {
    const activeThisWeek =
      bucket.revisionsThisWeek > 0 ||
      (bucket.lastActivityAt !== null && bucket.lastActivityAt >= cutoff);
    if (activeThisWeek) activeThisWeekCount += 1;
    const joinedAt = joinedAtByUser.get(bucket.userId) ?? null;
    const silentSinceJoin = joinedAt !== null && joinedAt <= cutoff;
    bucket.inactiveFor7Days = bucket.lastActivityAt
      ? bucket.lastActivityAt < cutoff
      : silentSinceJoin;
  }

  return { activeThisWeekCount, byUserId };
}
