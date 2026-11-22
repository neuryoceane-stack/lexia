/** Nombre de mots par session de révision (écran de sélection listes). */

export const REVISION_SESSION_WORD_LIMIT_STORAGE_KEY =
  "lexiva.revisionSessionWordLimit";

export const DEFAULT_REVISION_SESSION_WORD_LIMIT = 20;

export const REVISION_SESSION_WORD_STEP = 5;

export const REVISION_SESSION_WORD_MIN = 5;

/** Repères rapides cliquables (Tout = total mots sélectionnés). */
export const REVISION_SESSION_WORD_PRESETS = [10, 20, 30, 50] as const;

export function parseStoredRevisionSessionWordLimit(
  raw: string | null | undefined
): number | null {
  if (raw == null || raw.trim() === "") return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < REVISION_SESSION_WORD_MIN) return null;
  return n;
}

export function readRevisionSessionWordLimitFromStorage(): number {
  if (typeof window === "undefined") return DEFAULT_REVISION_SESSION_WORD_LIMIT;
  try {
    const stored = parseStoredRevisionSessionWordLimit(
      localStorage.getItem(REVISION_SESSION_WORD_LIMIT_STORAGE_KEY)
    );
    return stored ?? DEFAULT_REVISION_SESSION_WORD_LIMIT;
  } catch {
    return DEFAULT_REVISION_SESSION_WORD_LIMIT;
  }
}

export function writeRevisionSessionWordLimitToStorage(limit: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REVISION_SESSION_WORD_LIMIT_STORAGE_KEY, String(limit));
  } catch {
    /* quota / mode privé */
  }
}

/** Valeur maximale autorisée pour une sélection (au moins le minimum ou le total). */
export function revisionSessionWordMax(totalWords: number): number {
  if (totalWords <= 0) return 0;
  return Math.max(totalWords, REVISION_SESSION_WORD_MIN);
}

export function isRevisionSessionAllWords(
  limit: number,
  totalWords: number
): boolean {
  if (totalWords <= 0) return true;
  return limit >= totalWords;
}

/**
 * Ajuste le curseur sur le pas de 5, sans dépasser le total.
 * Si `allowFullTotal` et la valeur est proche du total, on retourne le total exact (Tout).
 */
export function snapRevisionSessionWordLimit(
  value: number,
  totalWords: number,
  options?: { allowFullTotal?: boolean }
): number {
  if (totalWords <= 0) return REVISION_SESSION_WORD_MIN;
  const max = revisionSessionWordMax(totalWords);
  const clamped = Math.min(Math.max(value, REVISION_SESSION_WORD_MIN), max);
  if (options?.allowFullTotal && clamped >= totalWords) return totalWords;
  const snapped =
    Math.round(clamped / REVISION_SESSION_WORD_STEP) * REVISION_SESSION_WORD_STEP;
  return Math.min(Math.max(snapped, REVISION_SESSION_WORD_MIN), max);
}

/** Plafonne la préférence quand la sélection change (sans erreur). */
export function clampRevisionSessionWordLimit(
  desired: number,
  totalWords: number
): number {
  if (totalWords <= 0) return DEFAULT_REVISION_SESSION_WORD_LIMIT;
  const max = revisionSessionWordMax(totalWords);
  const clamped = Math.min(Math.max(desired, REVISION_SESSION_WORD_MIN), max);
  if (clamped >= totalWords) return totalWords;
  return snapRevisionSessionWordLimit(clamped, totalWords);
}

export function initialRevisionSessionWordLimit(
  storedOrDefault: number,
  totalWords: number
): number {
  if (totalWords <= 0) return DEFAULT_REVISION_SESSION_WORD_LIMIT;
  return clampRevisionSessionWordLimit(storedOrDefault, totalWords);
}

export function parseRevisionSessionWordLimitQuery(
  raw: string | null | undefined
): number | undefined {
  if (raw == null || raw.trim() === "") return undefined;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.floor(n);
}

/** Indices du slider accessibles (pas de 5 + total si différent). */
export function revisionSessionSliderValues(totalWords: number): number[] {
  if (totalWords <= 0) return [];
  const max = revisionSessionWordMax(totalWords);
  const values: number[] = [];
  for (let v = REVISION_SESSION_WORD_MIN; v <= max; v += REVISION_SESSION_WORD_STEP) {
    values.push(v);
  }
  if (values.length === 0 || values[values.length - 1] !== totalWords) {
    if (totalWords >= REVISION_SESSION_WORD_MIN && !values.includes(totalWords)) {
      values.push(totalWords);
    }
  }
  return values.sort((a, b) => a - b);
}

export function presetRevisionSessionWordLimit(
  preset: number | "all",
  totalWords: number
): number {
  if (preset === "all" || preset >= totalWords) return totalWords;
  return clampRevisionSessionWordLimit(preset, totalWords);
}