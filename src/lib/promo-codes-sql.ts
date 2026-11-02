/**
 * SQL à lancer à la main par Océane (Turso). Pas de drizzle-kit push.
 * Les dates sont des secondes Unix, comme le mode timestamp de Drizzle.
 * `active` : 1 = actif, 0 = inactif.
 */
export const PROMO_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS promo_codes (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL,
  benefit_type TEXT NOT NULL,
  value INTEGER NOT NULL,
  institution TEXT,
  max_uses INTEGER,
  ends_at INTEGER,
  applies_monthly INTEGER NOT NULL,
  applies_annual INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  stripe_coupon_id TEXT,
  created_at INTEGER NOT NULL
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS promo_codes_code_unique ON promo_codes (code)`,
  `CREATE TABLE IF NOT EXISTS promo_code_redemptions (
  id TEXT PRIMARY KEY NOT NULL,
  promo_code_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  redeemed_at INTEGER NOT NULL,
  FOREIGN KEY (promo_code_id) REFERENCES promo_codes (id) ON UPDATE NO ACTION ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE CASCADE
)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS promo_code_redemptions_code_user_unique ON promo_code_redemptions (promo_code_id, user_id)`,
] as const;

export const PROMO_SCHEMA_SQL = PROMO_SCHEMA_STATEMENTS.join(";\n\n") + ";\n";
