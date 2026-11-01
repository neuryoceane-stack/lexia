/**
 * Liste, en lecture seule, les mots dont le dernier intervalle SM-2
 * dépasse 365 jours. N'écrit rien : pas d'INSERT, d'UPDATE, ni d'ALTER.
 *
 * Pour chaque mot, la ligne retenue est la révision la plus récente
 * de la paire (utilisateur, mot). La sortie donne le compte total,
 * le compte par utilisateur, puis le détail.
 *
 * Usage (depuis la racine du projet) :
 *   npm run db:liste-intervalles-aberrants
 *
 * Charge `.env.local`. Refuse de démarrer si la base n'est pas configurée
 * et n'ouvre un fichier SQLite local qu'en lecture seule.
 */
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { SM2_MAX_INTERVAL_DAYS } from "../src/lib/sm2";

config({ path: resolve(process.cwd(), ".env.local") });

const LIST_SQL = `
WITH latest AS (
  SELECT
    word_id,
    user_id,
    "interval" AS interval_days,
    ease_factor,
    repetitions,
    next_review_at,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, word_id
      ORDER BY created_at DESC, rowid DESC
    ) AS rn
  FROM revisions
)
SELECT
  word_id,
  user_id,
  interval_days,
  ease_factor,
  repetitions,
  next_review_at,
  created_at
FROM latest
WHERE rn = 1
  AND interval_days > ?
ORDER BY interval_days DESC, user_id ASC, word_id ASC
`.trim();

type SqlValue = null | string | number | bigint | ArrayBuffer;

interface RawRow {
  word_id: SqlValue;
  user_id: SqlValue;
  interval_days: SqlValue;
  ease_factor: SqlValue;
  repetitions: SqlValue;
  next_review_at: SqlValue;
  created_at: SqlValue;
}

interface ListedWord {
  userId: string;
  wordId: string;
  intervalDays: number;
  easeFactor: string;
  repetitions: string;
  nextReviewAt: string;
  createdAt: string;
}

type DatabaseTarget =
  | { kind: "turso"; url: string; authToken: string }
  | { kind: "sqlite"; filePath: string };

function assertReadOnlySelect(sql: string): void {
  const withoutComments = sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ")
    .trim();
  if (!/^(select|with)\b/i.test(withoutComments)) {
    throw new Error("Le script n'autorise qu'une requête SELECT.");
  }
  if (
    /\b(insert|update|delete|drop|alter|create|replace|pragma|attach|detach|reindex|vacuum)\b/i.test(
      withoutComments,
    )
  ) {
    throw new Error("Requête refusée : une écriture a été détectée.");
  }
}

function asText(value: SqlValue): string {
  if (value === null) return "";
  if (typeof value === "bigint") return value.toString();
  if (value instanceof ArrayBuffer) return "";
  return String(value);
}

function asNumber(value: SqlValue): number | null {
  if (typeof value === "bigint") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
}

/** Le timestamp Drizzle est un entier en millisecondes. */
function formatTimestamp(value: SqlValue): string {
  const numeric = asNumber(value);
  if (numeric === null) return "";
  const date = new Date(numeric);
  if (!Number.isFinite(date.getTime())) return asText(value);
  return date.toISOString();
}

function toListedWord(row: RawRow): ListedWord {
  const intervalDays = asNumber(row.interval_days);
  if (intervalDays === null) {
    throw new Error("Intervalle illisible dans le résultat de la requête.");
  }
  return {
    userId: asText(row.user_id),
    wordId: asText(row.word_id),
    intervalDays,
    easeFactor: asText(row.ease_factor),
    repetitions: asText(row.repetitions),
    nextReviewAt: formatTimestamp(row.next_review_at),
    createdAt: formatTimestamp(row.created_at),
  };
}

function printReport(words: ListedWord[]): void {
  console.log(
    `Compte : ${words.length} mot(s) dont le dernier intervalle dépasse ${SM2_MAX_INTERVAL_DAYS} jours.`,
  );

  const countByUser = new Map<string, number>();
  for (const word of words) {
    countByUser.set(word.userId, (countByUser.get(word.userId) ?? 0) + 1);
  }

  console.log("Compte par utilisateur :");
  if (countByUser.size === 0) {
    console.log("(aucun)");
  } else {
    const lines = [...countByUser.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );
    for (const [userId, count] of lines) {
      console.log(`${count}\t${userId}`);
    }
  }

  console.log(
    "user_id\tword_id\tinterval_jours\tease_factor\trepetitions\tnext_review_at\tcreated_at",
  );
  for (const word of words) {
    console.log(
      [
        word.userId,
        word.wordId,
        String(word.intervalDays),
        word.easeFactor,
        word.repetitions,
        word.nextReviewAt,
        word.createdAt,
      ].join("\t"),
    );
  }
}

function resolveDatabase(): DatabaseTarget {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim() ?? "";
  const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim() ?? "";
  if (tursoUrl || tursoToken) {
    if (!tursoUrl || !tursoToken) {
      throw new Error(
        "TURSO_DATABASE_URL et TURSO_AUTH_TOKEN doivent être définis ensemble.",
      );
    }
    return { kind: "turso", url: tursoUrl, authToken: tursoToken };
  }

  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
  if (!databaseUrl) {
    throw new Error(
      "Base non configurée. Définis TURSO_DATABASE_URL et TURSO_AUTH_TOKEN, ou DATABASE_URL. Ce script ne crée pas de base et n'écrit rien.",
    );
  }

  const rawPath = databaseUrl.replace(/^file:/, "");
  const filePath = isAbsolute(rawPath) ? rawPath : resolve(process.cwd(), rawPath);
  if (!existsSync(filePath)) {
    throw new Error(`Fichier SQLite introuvable : ${filePath}`);
  }
  return { kind: "sqlite", filePath };
}

function rowFromUnknown(value: unknown): RawRow {
  if (value === null || typeof value !== "object") {
    throw new Error("Ligne SQL inattendue.");
  }
  const record = value as Record<string, SqlValue>;
  return {
    word_id: record.word_id ?? null,
    user_id: record.user_id ?? null,
    interval_days: record.interval_days ?? null,
    ease_factor: record.ease_factor ?? null,
    repetitions: record.repetitions ?? null,
    next_review_at: record.next_review_at ?? null,
    created_at: record.created_at ?? null,
  };
}

async function queryRows(target: DatabaseTarget): Promise<RawRow[]> {
  assertReadOnlySelect(LIST_SQL);

  if (target.kind === "turso") {
    const { createClient } = await import("@libsql/client");
    const client = createClient({
      url: target.url,
      authToken: target.authToken,
    });
    try {
      const result = await client.execute({
        sql: LIST_SQL,
        args: [SM2_MAX_INTERVAL_DAYS],
      });
      return result.rows.map((row) => rowFromUnknown(row));
    } finally {
      client.close();
    }
  }

  const { default: Database } = await import("better-sqlite3");
  const sqlite = new Database(target.filePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const statement = sqlite.prepare<[number], Record<string, SqlValue>>(LIST_SQL);
    return statement.all(SM2_MAX_INTERVAL_DAYS).map((row) => rowFromUnknown(row));
  } finally {
    sqlite.close();
  }
}

async function main(): Promise<void> {
  const target = resolveDatabase();
  const words = (await queryRows(target)).map((row) => toListedWord(row));
  printReport(words);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
