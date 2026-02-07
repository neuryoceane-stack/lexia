import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

type DbInstance = BetterSQLite3Database<typeof schema>;

let _db: DbInstance | null = null;

function getDb(): DbInstance {
  if (_db) return _db;

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoToken) {
    const { createClient } = require("@libsql/client/web");
    const { drizzle } = require("drizzle-orm/libsql");
    const client = createClient({ url: tursoUrl, authToken: tursoToken });
    _db = drizzle({ client, schema }) as DbInstance;
  } else {
    const { drizzle } = require("drizzle-orm/better-sqlite3");
    const Database = require("better-sqlite3");
    const dbPath = process.env.DATABASE_URL?.replace(/^file:/, "") ?? "vocab.db";
    const sqlite = new Database(dbPath);
    _db = drizzle(sqlite, { schema });
  }
  return _db;
}

export const db = new Proxy({} as DbInstance, {
  get(_, prop) {
    return (getDb() as Record<string, unknown>)[prop as string];
  },
});
