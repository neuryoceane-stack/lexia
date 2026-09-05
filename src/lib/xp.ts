/** Formule XP globale : mots retenus, sessions complétées, mots écrits (dictée). */
export function computeTotalXP({
  wordsRetained,
  wordsWritten,
  sessionCount,
}: {
  wordsRetained: number;
  wordsWritten: number;
  sessionCount: number;
}): number {
  const retained = Math.max(0, wordsRetained);
  const written = Math.max(0, wordsWritten);
  const sessions = Math.max(0, sessionCount);
  return retained * 5 + sessions * 20 + written * 3;
}

/** XP gagnée pour une session terminée (+20 = session enregistrée). */
export function computeSessionXP({
  wordsRetained,
  wordsWritten,
}: {
  wordsRetained: number;
  wordsWritten?: number;
}): number {
  return computeTotalXP({
    wordsRetained,
    wordsWritten: wordsWritten ?? 0,
    sessionCount: 1,
  });
}

/** Niveau dérivé de l'XP totale (1–6, paliers de 1000 XP). */
export function computeLevelFromXP(xp: number): number {
  return Math.max(1, Math.min(6, Math.floor(Math.max(0, xp) / 1000) + 1));
}
