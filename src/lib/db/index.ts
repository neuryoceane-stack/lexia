import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

type DbInstance = BetterSQLite3Database<typeof schema>;

let _db: DbInstance | null = null;
/** Client brut (libsql ou better-sqlite3) pour exécuter du SQL de migration. */
let _rawClient: { execute?: (sql: string) => Promise<unknown>; exec?: (sql: string) => void } | null = null;

function getDb(): DbInstance {
  if (_db) return _db;

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoToken) {
    const { createClient } = require("@libsql/client/web");
    const { drizzle } = require("drizzle-orm/libsql");
    const client = createClient({ url: tursoUrl, authToken: tursoToken });
    _rawClient = client;
    _db = drizzle({ client, schema }) as DbInstance;
  } else {
    const { drizzle } = require("drizzle-orm/better-sqlite3");
    const Database = require("better-sqlite3");
    const dbPath = process.env.DATABASE_URL?.replace(/^file:/, "") ?? "vocab.db";
    const sqlite = new Database(dbPath);
    _rawClient = sqlite;
    _db = drizzle(sqlite, { schema });
  }
  return _db as DbInstance;
}

export const db = new Proxy({} as DbInstance, {
  get(_, prop) {
    return (getDb() as unknown as Record<string, unknown>)[prop as string];
  },
});

/**
 * Exécute une requête SQL brute (pour migrations ponctuelles).
 * Utilisé pour ajouter la colonne preferred_language si elle manque.
 */
export async function runRawSql(sql: string): Promise<void> {
  getDb(); // initialise _rawClient si besoin
  const c = _rawClient;
  if (!c) return;
  if (typeof c.execute === "function") {
    await c.execute(sql);
  } else if (typeof c.exec === "function") {
    c.exec(sql);
  }
}
