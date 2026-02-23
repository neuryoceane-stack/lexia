import { runRawSql } from "./index";

export async function ensureClassTables() {
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
      updated_at INTEGER NOT NULL
    )
  `);
  try {
    await runRawSql("ALTER TABLE user_profiles ADD COLUMN role TEXT");
  } catch {
    /* colonne déjà présente */
  }
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
