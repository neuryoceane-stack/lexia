/** Sélection des mots pour une session de révision (priorité SM-2, sans changer l’algo). */

export type RevisionSessionWordRow = {
  id: string;
  listId: string;
  term: string;
  definition: string;
};

const MS_NEW_WORD_SORT = Number.MAX_SAFE_INTEGER;

function revisionUrgencySortKey(
  wordId: string,
  latestNextReviewAt: Map<string, Date>,
  now: Date
): number {
  const next = latestNextReviewAt.get(wordId);
  if (!next) return MS_NEW_WORD_SORT;
  return next.getTime();
}

function isDueForRevision(
  wordId: string,
  latestNextReviewAt: Map<string, Date>,
  now: Date
): boolean {
  const next = latestNextReviewAt.get(wordId);
  if (!next) return true;
  return next.getTime() <= now.getTime();
}

/**
 * Quand `limit` est absent ou ≥ nombre de mots, l’ordre d’origine est conservé (tous les mots).
 * Sinon : mots en retard (nextReviewAt le plus ancien d’abord), puis nouveaux, puis le reste par date croissante.
 */
export function pickRevisionSessionWords<T extends RevisionSessionWordRow>(
  wordsInListOrder: T[],
  latestNextReviewAt: Map<string, Date>,
  limit: number | undefined,
  now: Date
): T[] {
  if (wordsInListOrder.length === 0) return [];
  if (limit == null || limit >= wordsInListOrder.length) {
    return [...wordsInListOrder];
  }
  const safeLimit = Math.max(1, Math.floor(limit));

  const overdue: T[] = [];
  const neverRevised: T[] = [];
  const notYetDue: T[] = [];

  for (const w of wordsInListOrder) {
    const next = latestNextReviewAt.get(w.id);
    if (!next) {
      neverRevised.push(w);
    } else if (next.getTime() <= now.getTime()) {
      overdue.push(w);
    } else {
      notYetDue.push(w);
    }
  }

  overdue.sort(
    (a, b) =>
      revisionUrgencySortKey(a.id, latestNextReviewAt, now) -
      revisionUrgencySortKey(b.id, latestNextReviewAt, now)
  );
  notYetDue.sort(
    (a, b) =>
      revisionUrgencySortKey(a.id, latestNextReviewAt, now) -
      revisionUrgencySortKey(b.id, latestNextReviewAt, now)
  );

  const prioritized = [...overdue, ...neverRevised, ...notYetDue];
  return prioritized.slice(0, safeLimit);
}

/** Compte les mots « disponibles » (dus ou jamais révisés) pour l’affichage. */
export function countUrgentRevisionWords(
  wordIds: string[],
  latestNextReviewAt: Map<string, Date>,
  now: Date
): number {
  return wordIds.filter((id) => isDueForRevision(id, latestNextReviewAt, now)).length;
}