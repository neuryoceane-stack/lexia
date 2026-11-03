/**
 * SQL à lancer à la main par Océane (Turso). Pas de drizzle-kit push.
 * Les dates sont des secondes Unix, comme le mode timestamp de Drizzle.
 */
export const TECH_HEALTH_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS error_events (
  id TEXT PRIMARY KEY NOT NULL,
  fingerprint TEXT NOT NULL,
  source TEXT NOT NULL,
  route TEXT NOT NULL,
  method TEXT,
  message TEXT NOT NULL,
  status_code INTEGER,
  occurrences INTEGER NOT NULL DEFAULT 1,
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'new',
  last_user_id TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (last_user_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE SET NULL
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS error_events_fingerprint_unique ON error_events (fingerprint)`,
  `CREATE TABLE IF NOT EXISTS email_events (
  id TEXT PRIMARY KEY NOT NULL,
  to_email TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  error TEXT,
  provider_id TEXT,
  user_id TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE SET NULL
)`,
  `CREATE INDEX IF NOT EXISTS email_events_created_at_idx ON email_events (created_at)`,
] as const;

export const TECH_HEALTH_SCHEMA_SQL = TECH_HEALTH_SCHEMA_STATEMENTS.join(";\n\n") + ";\n";
