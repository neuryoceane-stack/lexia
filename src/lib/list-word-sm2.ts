export type ListWordSm2Status = "mastered" | "progress" | "new";

/**
 * Statut d’affichage pour un mot de liste (dernière révision SM-2 utilisateur).
 * Sans ligne `revisions` → nouveau.
 */
export function classifyWordSm2Status(row: {
  easeFactor: number | null;
  repetitions: number | null;
} | undefined): ListWordSm2Status {
  if (!row) return "new";
  const rep = row.repetitions ?? 0;
  const ease = row.easeFactor ?? 2.5;
  const mastered = ease >= 2.5 || rep >= 3;
  if (mastered) return "mastered";
  if (rep >= 1) return "progress";
  return "new";
}
