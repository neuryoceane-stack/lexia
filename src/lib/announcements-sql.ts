/**
 * SQL à lancer à la main par Océane (Turso). Pas de drizzle-kit push, pas d'ALTER.
 * Les dates sont des secondes Unix, comme le mode timestamp de Drizzle.
 * `dismissible` : 1 = l'élève peut fermer l'annonce, 0 = elle reste affichée.
 */
export const ANNOUNCEMENT_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  link_label TEXT,
  link_url TEXT,
  audience TEXT NOT NULL,
  language_code TEXT,
  starts_at INTEGER,
  ends_at INTEGER,
  dismissible INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL
)`,
  `CREATE TABLE IF NOT EXISTS announcement_dismissals (
  id TEXT PRIMARY KEY NOT NULL,
  announcement_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  dismissed_at INTEGER NOT NULL,
  FOREIGN KEY (announcement_id) REFERENCES announcements (id) ON UPDATE NO ACTION ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE CASCADE
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS announcement_dismissals_announcement_user_unique ON announcement_dismissals (announcement_id, user_id)`,
] as const;

export const ANNOUNCEMENT_SCHEMA_SQL = ANNOUNCEMENT_SCHEMA_STATEMENTS.join(";\n\n") + ";\n";
