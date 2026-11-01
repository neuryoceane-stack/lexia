/**
 * Algorithme SM-2 (SuperMemo 2) pour l'espacement des révisions.
 *
 * Sans plafond, une longue série de réussites fait croître l'intervalle
 * sans limite (par exemple 365 829 807 jours). `Date#setDate` sort alors
 * de la plage représentable, `nextReviewAt` devient une date invalide
 * (timestamp NaN) et l'insertion dans `revisions` lève
 * « RangeError: Only finite numbers (not Infinity or NaN) can be passed
 * as arguments ».
 *
 * Plafonds, appliqués même quand l'état précédent est déjà aberrant :
 * - intervalle : 365 jours maximum, soit min(intervalle précédent × facteur, 365)
 *   à partir de la troisième répétition réussie ;
 * - facteur de facilité : 2,8 maximum, minimum 1,3 inchangé, arrondi à 2 décimales.
 *
 * Un échec (note inférieure à 2) remet les répétitions à 0 et l'intervalle à 1.
 * La prochaine révision est alors dans 10 minutes, comme auparavant.
 * Le facteur stocké est tout de même ramené dans [1,3 ; 2,8].
 */

export const SM2_MIN_EASE_FACTOR = 1.3;
export const SM2_MAX_EASE_FACTOR = 2.8;
export const SM2_MAX_INTERVAL_DAYS = 365;
export const SM2_DEFAULT_EASE_FACTOR = 2.5;

const FAILURE_REVIEW_DELAY_MS = 10 * 60 * 1000;

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

/** Ramène le facteur dans [1,3 ; 2,8] et l'arrondit à 2 décimales. */
export function clampEaseFactor(value: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return SM2_DEFAULT_EASE_FACTOR;
  }
  const clamped = Math.min(
    SM2_MAX_EASE_FACTOR,
    Math.max(SM2_MIN_EASE_FACTOR, value),
  );
  const rounded = Math.round(clamped * 100) / 100;
  if (!Number.isFinite(rounded) || rounded > SM2_MAX_EASE_FACTOR) {
    return SM2_MAX_EASE_FACTOR;
  }
  if (rounded < SM2_MIN_EASE_FACTOR) return SM2_MIN_EASE_FACTOR;
  return rounded;
}

function addDays(from: Date, days: number): Date {
  const next = new Date(from.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

export function computeSM2(input: SM2Input, now: Date = new Date()): SM2Output {
  const easeFactor =
    typeof input.easeFactor === "number" ? input.easeFactor : SM2_DEFAULT_EASE_FACTOR;
  const interval = typeof input.interval === "number" ? input.interval : 1;
  const repetitions = typeof input.repetitions === "number" ? input.repetitions : 0;
  const { rating } = input;

  if (!Number.isFinite(rating) || rating < 2) {
    return {
      easeFactor: clampEaseFactor(easeFactor),
      interval: 1,
      repetitions: 0,
      nextReviewAt: new Date(now.getTime() + FAILURE_REVIEW_DELAY_MS),
    };
  }

  const rawEase =
    easeFactor + 0.1 - (3 - rating) * (0.08 + (3 - rating) * 0.02);
  const newEaseFactor = clampEaseFactor(rawEase);

  let newInterval: number;
  let newRepetitions: number;

  if (!Number.isFinite(repetitions)) {
    newInterval = Number.NaN;
    newRepetitions = Number.NaN;
  } else if (repetitions <= 0) {
    newInterval = 1;
    newRepetitions = 1;
  } else if (repetitions === 1) {
    newInterval = 3;
    newRepetitions = 2;
  } else {
    const product = interval * newEaseFactor;
    if (Number.isFinite(product)) {
      const grown = Math.round(product);
      newInterval = Math.min(
        SM2_MAX_INTERVAL_DAYS,
        grown >= 1 ? grown : 1,
      );
    } else if (product === Number.POSITIVE_INFINITY) {
      newInterval = SM2_MAX_INTERVAL_DAYS;
    } else {
      newInterval = Number.NaN;
    }
    newRepetitions = repetitions + 1;
  }

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewAt: Number.isFinite(newInterval)
      ? addDays(now, newInterval)
      : new Date(Number.NaN),
  };
}

export function isFiniteSm2Result(result: SM2Output): boolean {
  return (
    result.nextReviewAt instanceof Date &&
    Number.isFinite(result.nextReviewAt.getTime()) &&
    Number.isFinite(result.interval) &&
    Number.isFinite(result.easeFactor) &&
    Number.isFinite(result.repetitions)
  );
}

/**
 * Dernier contrôle avant l'insertion. Si la date ou l'un des paramètres
 * SM-2 n'est pas un nombre fini, remplace l'état par un intervalle d'un
 * jour et journalise l'identifiant du mot au lieu de faire échouer la requête.
 */
export function ensureFiniteSm2ForInsert(
  result: SM2Output,
  wordId: string,
  now: Date = new Date(),
  warn: (message: string) => void = console.warn,
): SM2Output {
  if (isFiniteSm2Result(result)) return result;

  const nextReviewAt = result.nextReviewAt;
  const nextReviewAtMs =
    nextReviewAt instanceof Date ? nextReviewAt.getTime() : NaN;
  warn(
    `[sm2] Valeurs non finies avant insertion pour le mot ${wordId} ` +
      `(nextReviewAt=${String(nextReviewAtMs)}, interval=${String(result.interval)}, ` +
      `easeFactor=${String(result.easeFactor)}, repetitions=${String(result.repetitions)}). ` +
      "Repli : intervalle 1 jour.",
  );

  return {
    easeFactor: SM2_DEFAULT_EASE_FACTOR,
    interval: 1,
    repetitions: 0,
    nextReviewAt: addDays(now, 1),
  };
}
