/**
 * SQL à lancer à la main par Océane (Turso). Pas de drizzle-kit push, pas d'ALTER.
 * Les dates sont des secondes Unix, comme le mode timestamp de Drizzle.
 */
export const FEEDBACK_META_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS feedback_meta (
  id TEXT PRIMARY KEY NOT NULL,
  feedback_id TEXT NOT NULL,
  type TEXT NOT NULL,
  page TEXT,
  device TEXT,
  browser TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (feedback_id) REFERENCES feedbacks (id) ON UPDATE NO ACTION ON DELETE CASCADE
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS feedback_meta_feedback_id_unique ON feedback_meta (feedback_id)`,
] as const;

export const FEEDBACK_META_SCHEMA_SQL = FEEDBACK_META_SCHEMA_STATEMENTS.join(";\n\n") + ";\n";
