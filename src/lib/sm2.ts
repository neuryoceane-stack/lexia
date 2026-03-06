/**
 * Algorithme SM-2 (SuperMemo 2) pour l'espacement des révisions.
 * Utilisé pour calculer la prochaine date de révision selon la qualité de la réponse.
 */

export interface SM2Input {
  /** Facteur de facilité (défaut 2.5) */
  easeFactor: number;
  /** Intervalle en jours (défaut 1) */
  interval: number;
  /** Nombre de répétitions réussies consécutives (défaut 0) */
  repetitions: number;
  /** Qualité de la réponse : 0=oublié, 1=difficile, 2=bien, 3=parfait */
  rating: number;
}

export interface SM2Output {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: Date;
}

export function computeSM2(input: SM2Input): SM2Output {
  const {
    easeFactor = 2.5,
    interval = 1,
    repetitions = 0,
    rating,
  } = input;

  const now = new Date();

  if (rating < 2) {
    return {
      easeFactor,
      interval: 1,
      repetitions: 0,
      nextReviewAt: new Date(now.getTime() + 10 * 60 * 1000),
    };
  }

  let newEaseFactor =
    easeFactor + 0.1 - (3 - rating) * (0.08 + (3 - rating) * 0.02);
  newEaseFactor = Math.max(1.3, newEaseFactor);

  let newInterval: number;
  let newRepetitions: number;

  if (repetitions === 0) {
    newInterval = 1;
    newRepetitions = 1;
  } else if (repetitions === 1) {
    newInterval = 3;
    newRepetitions = 2;
  } else {
    newInterval = Math.round(interval * newEaseFactor);
    newRepetitions = repetitions + 1;
  }

  const nextReviewAt = new Date(now);
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewAt,
  };
}
