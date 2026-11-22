/** Vrai seulement pour un conflit de clé primaire ou d'unicité SQLite / libSQL. */
export function isSqliteUniqueConstraint(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return (
    /UNIQUE constraint failed/i.test(message) ||
    /SQLITE_CONSTRAINT_PRIMARYKEY/i.test(message) ||
    /SQLITE_CONSTRAINT_UNIQUE/i.test(message)
  );
}
