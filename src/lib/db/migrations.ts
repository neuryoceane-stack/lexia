import { runRawSql } from "./index";

async function addColumnIfMissing(sql: string): Promise<void> {
  try {
    await runRawSql(sql);
  } catch {
    /* colonne déjà présente ou table incompatible — ignoré */
  }
}

/** Colonnes users alignées sur src/lib/db/schema.ts (users). */
export async function ensureUsersTable(): Promise<void> {
  await runRawSql(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'student',
      created_at INTEGER NOT NULL,
      subject TEXT,
      school_name TEXT,
      weekly_goal INTEGER NOT NULL DEFAULT 20,
      plan TEXT NOT NULL DEFAULT 'free',
      subscription_status TEXT NOT NULL DEFAULT 'inactive'
    )
  `);

  await addColumnIfMissing("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student'");
  await addColumnIfMissing("ALTER TABLE users ADD COLUMN subject TEXT");
  await addColumnIfMissing("ALTER TABLE users ADD COLUMN school_name TEXT");
  await addColumnIfMissing("ALTER TABLE users ADD COLUMN weekly_goal INTEGER DEFAULT 20");
  await addColumnIfMissing("ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free'");
  await addColumnIfMissing("ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'inactive'");
  await addColumnIfMissing("ALTER TABLE users ADD COLUMN created_at INTEGER");
  await addColumnIfMissing("ALTER TABLE users ADD COLUMN referral_code TEXT");
  await addColumnIfMissing("ALTER TABLE users ADD COLUMN referral_count INTEGER DEFAULT 0");
  await addColumnIfMissing(
    "ALTER TABLE users ADD COLUMN referred_by_user_id TEXT REFERENCES users(id)"
  );
  try {
    await runRawSql(
      "CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_unique ON users(referral_code)"
    );
  } catch {
    /* index déjà présent */
  }
}

/** Colonnes user_profiles alignées sur src/lib/db/schema.ts (userProfiles). */
async function ensureUserProfilesTable(): Promise<void> {
  await runRawSql(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      date_of_birth TEXT,
      city TEXT,
      phone TEXT,
      status TEXT,
      institution_name TEXT,
      role TEXT,
      onboarding_completed INTEGER NOT NULL DEFAULT 0,
      acquisition_source TEXT,
      streak_goal INTEGER,
      institution_code TEXT,
      updated_at INTEGER NOT NULL
    )
  `);

  await addColumnIfMissing("ALTER TABLE user_profiles ADD COLUMN role TEXT");
  await addColumnIfMissing("ALTER TABLE user_profiles ADD COLUMN date_of_birth TEXT");
  await addColumnIfMissing("ALTER TABLE user_profiles ADD COLUMN city TEXT");
  await addColumnIfMissing("ALTER TABLE user_profiles ADD COLUMN phone TEXT");
  await addColumnIfMissing("ALTER TABLE user_profiles ADD COLUMN status TEXT");
  await addColumnIfMissing("ALTER TABLE user_profiles ADD COLUMN institution_name TEXT");
  await addColumnIfMissing("ALTER TABLE user_profiles ADD COLUMN onboarding_completed INTEGER DEFAULT 0");
  await addColumnIfMissing("ALTER TABLE user_profiles ADD COLUMN acquisition_source TEXT");
  await addColumnIfMissing("ALTER TABLE user_profiles ADD COLUMN streak_goal INTEGER");
  await addColumnIfMissing("ALTER TABLE user_profiles ADD COLUMN institution_code TEXT");
  await addColumnIfMissing("ALTER TABLE user_profiles ADD COLUMN updated_at INTEGER");
}

export async function ensureClassTables() {
  await ensureUsersTable();
  await ensureUserProfilesTable();

  await runRawSql(`
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      identifier TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      language TEXT,
      created_at INTEGER NOT NULL
    )
  `);
  await runRawSql(`
    CREATE TABLE IF NOT EXISTS class_members (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      joined_at INTEGER NOT NULL
    )
  `);
  await runRawSql(`
    CREATE TABLE IF NOT EXISTS class_lists (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      list_id TEXT NOT NULL,
      is_visible INTEGER NOT NULL DEFAULT 0,
      order_index INTEGER NOT NULL DEFAULT 0,
      added_at INTEGER NOT NULL
    )
  `);
}
