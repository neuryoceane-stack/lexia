/**
 * Lectures de la section Élèves. Aucune écriture, aucun schéma nouveau.
 *
 * Professeurs (users.role = teacher) et compte créateur sont exclus :
 * la section compte les élèves, pas les autres rôles. Ils ne sont pas
 * affichés à part.
 *
 * Activité = max(fin de session, date de révision). La connexion n'est pas
 * enregistrée. Série = même calcul que GET /api/streak (jours UTC).
 * Mots révisés = somme de revision_sessions.words_seen.
 * Réussite en dictée = words_retained / words_seen des sessions mode dictee.
 * Listes = bibliothèque de l'élève (word_families → lists), pas les listes de classe.
 * Code promo = le plus récent (à égalité de date, le code le plus petit).
 *
 * Ces agrégats parcourent revision_sessions, revisions et word_families.
 * Aucun index n'existe sur (user_id, ended_at) ni (user_id, started_at) :
 * avec plusieurs milliers d'élèves et un an de sessions, le parcours complet
 * peut devenir lent. La liste reste limitée à 50 lignes ; la série et l'export
 * ne relisent que les élèves de la page, ou tous les élèves pour le CSV.
 */

import { sql, type SQL } from "drizzle-orm";
import { PREFERRED_LANGUAGE_OPTIONS } from "@/lib/language";
import {
  DAY_MS,
  STUDENT_PAGE_SIZE,
  STREAK_LOOKBACK_DAYS,
  buildStudentSheet,
  buildUsageReport,
  choosePrimaryLanguage,
  countForFilter,
  currentStreakFromDayIndexes,
  inactiveCutoffSeconds,
  likeContains,
  foldSearch,
  missingStudentsTable,
  SEARCH_REPLACEMENTS,
  readCancellationPlan,
  studentCsv,
  toListItem,
  unknownLanguageLabel,
  usageWindows,
  utcDayIndex,
  type Queryable,
  type StudentFacts,
  type StudentFilter,
  type StudentListResponse,
  type StudentSheet,
  type UsageReport,
} from "@/lib/creator-students";

export type { Queryable } from "@/lib/creator-students";

const LANGUAGE_LABELS = new Map(
  PREFERRED_LANGUAGE_OPTIONS.map((option) => [option.value, option.label]),
);

const STREAK_CHUNK = 400;

type OptionalTables = { promo: boolean; cancellation: boolean };

type RawStudent = {
  id: unknown;
  email: unknown;
  name: unknown;
  first_name: unknown;
  last_name: unknown;
  subscription_status: unknown;
  created_at: unknown;
  last_at: unknown;
  list_count: unknown;
  promo_code: unknown;
  cancellation_plan: unknown;
};

function knownLanguageLabel(code: string | null): string | null {
  if (!code) return null;
  return LANGUAGE_LABELS.get(code.trim().toLowerCase()) ?? null;
}

function displayLanguageLabel(code: string | null): string | null {
  return knownLanguageLabel(code) ?? unknownLanguageLabel(code);
}

async function rowsOf<T>(database: Queryable, query: SQL): Promise<T[]> {
  const result = await database.all<T>(query);
  if (!Array.isArray(result)) throw new Error("Réponse SQL inattendue");
  return result;
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === "bigint") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readInt(value: unknown, label: string): number {
  const parsed = coerceNumber(value);
  if (parsed == null || !Number.isInteger(parsed)) {
    throw new Error(`Compteur invalide (${label})`);
  }
  return parsed;
}

function readUnix(value: unknown, label: string): number | null {
  if (value == null) return null;
  const parsed = coerceNumber(value);
  if (parsed == null) throw new Error(`Horodatage invalide (${label})`);
  return parsed;
}

function fromUnix(seconds: number): Date {
  return new Date(seconds * 1000);
}

function readRequiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Champ invalide (${label})`);
  }
  return value;
}

function readNullableString(value: unknown, label: string): string | null {
  if (value == null) return null;
  if (typeof value !== "string") throw new Error(`Champ invalide (${label})`);
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function seconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

function folded(expr: SQL): SQL {
  let current = sql`coalesce(${expr}, '')`;
  for (const [from, to] of SEARCH_REPLACEMENTS) {
    current = sql`replace(${current}, ${from}, ${to})`;
  }
  return sql`lower(${current})`;
}

function searchSql(query: string): SQL {
  if (!query) return sql`1 = 1`;
  const pattern = likeContains(foldSearch(query));
  const columns = [
    sql`u.email`,
    sql`u.name`,
    sql`p.first_name`,
    sql`p.last_name`,
    sql`trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, ''))`,
  ];
  const parts = columns.map((column) => sql`${folded(column)} LIKE ${pattern} ESCAPE '\\'`);
  return sql`(${sql.join(parts, sql` OR `)})`;
}

function statusSql(filter: StudentFilter, cutoff: number): SQL {
  if (filter === "trial") return sql`u.subscription_status = 'trialing'`;
  if (filter === "subscribed") return sql`u.subscription_status = 'active'`;
  if (filter === "inactive") {
    return sql`(CASE WHEN a.last_at IS NULL THEN u.created_at ELSE a.last_at END) <= ${cutoff}`;
  }
  return sql`1 = 1`;
}

const activityCte = sql`
  activity AS (
    SELECT user_id, MAX(last_at) AS last_at
    FROM (
      SELECT user_id, MAX(ended_at) AS last_at
      FROM revision_sessions
      GROUP BY user_id
      UNION ALL
      SELECT user_id, MAX(created_at) AS last_at
      FROM revisions
      GROUP BY user_id
    ) AS activity_sources
    GROUP BY user_id
  )
`;

const listCountCte = sql`
  list_counts AS (
    SELECT wf.user_id AS user_id, COUNT(l.id) AS list_count
    FROM word_families wf
    LEFT JOIN lists l ON l.family_id = wf.id
    GROUP BY wf.user_id
  )
`;

const promoCte = sql`
  promo_last AS (
    SELECT r.user_id AS user_id, MIN(pc.code) AS code
    FROM promo_code_redemptions r
    INNER JOIN promo_codes pc ON pc.id = r.promo_code_id
    INNER JOIN (
      SELECT user_id, MAX(redeemed_at) AS redeemed_at
      FROM promo_code_redemptions
      GROUP BY user_id
    ) AS promo_max
      ON promo_max.user_id = r.user_id AND promo_max.redeemed_at = r.redeemed_at
    GROUP BY r.user_id
  )
`;

const cancelCte = sql`
  cancel_last AS (
    SELECT cf.user_id AS user_id, cf.plan AS plan
    FROM cancellation_feedback cf
    WHERE cf.id = (
      SELECT cf2.id
      FROM cancellation_feedback cf2
      WHERE cf2.user_id = cf.user_id
      ORDER BY cf2.cancelled_at DESC, cf2.id DESC
      LIMIT 1
    )
  )
`;

function studentCtes(flags: OptionalTables): SQL {
  const parts = [activityCte, listCountCte];
  if (flags.promo) parts.push(promoCte);
  if (flags.cancellation) parts.push(cancelCte);
  return sql`WITH ${sql.join(parts, sql`, `)}`;
}

function studentSelect(
  flags: OptionalTables,
  filter: StudentFilter,
  query: string,
  cutoff: number,
  paging: { limit: number; offset: number } | null,
): SQL {
  const promoSelect = flags.promo ? sql`pr.code` : sql`NULL`;
  const cancelSelect = flags.cancellation ? sql`cl.plan` : sql`NULL`;
  const promoJoin = flags.promo ? sql`LEFT JOIN promo_last pr ON pr.user_id = u.id` : sql``;
  const cancelJoin = flags.cancellation ? sql`LEFT JOIN cancel_last cl ON cl.user_id = u.id` : sql``;
  const limit = paging ? sql`LIMIT ${paging.limit} OFFSET ${paging.offset}` : sql``;
  return sql`
    ${studentCtes(flags)}
    SELECT
      u.id AS id,
      u.email AS email,
      u.name AS name,
      p.first_name AS first_name,
      p.last_name AS last_name,
      u.subscription_status AS subscription_status,
      u.created_at AS created_at,
      a.last_at AS last_at,
      COALESCE(lc.list_count, 0) AS list_count,
      ${promoSelect} AS promo_code,
      ${cancelSelect} AS cancellation_plan
    FROM users u
    LEFT JOIN user_profiles p ON p.user_id = u.id
    LEFT JOIN activity a ON a.user_id = u.id
    LEFT JOIN list_counts lc ON lc.user_id = u.id
    ${promoJoin}
    ${cancelJoin}
    WHERE u.role = 'student'
      AND ${statusSql(filter, cutoff)}
      AND ${searchSql(query)}
    ORDER BY a.last_at IS NULL, a.last_at DESC, u.id ASC
    ${limit}
  `;
}

async function withOptionalTables<T>(
  run: (flags: OptionalTables) => Promise<T>,
  flags: OptionalTables = { promo: true, cancellation: true },
): Promise<{ value: T; flags: OptionalTables }> {
  try {
    return { value: await run(flags), flags };
  } catch (error) {
    const missing = missingStudentsTable(error);
    if (missing === "promo" && flags.promo) {
      return withOptionalTables(run, { ...flags, promo: false });
    }
    if (missing === "cancellation" && flags.cancellation) {
      return withOptionalTables(run, { ...flags, cancellation: false });
    }
    throw error;
  }
}

async function loadCounts(
  database: Queryable,
  query: string,
  cutoff: number,
): Promise<StudentListResponse["counts"]> {
  const [row] = await rowsOf<{
    all_count: unknown;
    trial_count: unknown;
    subscribed_count: unknown;
    inactive_count: unknown;
  }>(
    database,
    sql`
      WITH ${activityCte}
      SELECT
        COUNT(*) AS all_count,
        COALESCE(SUM(CASE WHEN u.subscription_status = 'trialing' THEN 1 ELSE 0 END), 0) AS trial_count,
        COALESCE(SUM(CASE WHEN u.subscription_status = 'active' THEN 1 ELSE 0 END), 0) AS subscribed_count,
        COALESCE(SUM(CASE
          WHEN (CASE WHEN a.last_at IS NULL THEN u.created_at ELSE a.last_at END) <= ${cutoff} THEN 1
          ELSE 0
        END), 0) AS inactive_count
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.id
      LEFT JOIN activity a ON a.user_id = u.id
      WHERE u.role = 'student'
        AND ${searchSql(query)}
    `,
  );
  if (!row) throw new Error("Effectifs élèves introuvables");
  return {
    all: readInt(row.all_count, "tous"),
    trial: readInt(row.trial_count, "essai"),
    subscribed: readInt(row.subscribed_count, "abonnés"),
    inactive: readInt(row.inactive_count, "inactifs"),
  };
}

async function loadStreakMap(database: Queryable, ids: readonly string[], now: Date): Promise<Map<string, number>> {
  const streaks = new Map<string, number>();
  if (ids.length === 0) return streaks;
  const since = Math.floor((now.getTime() - STREAK_LOOKBACK_DAYS * DAY_MS) / 1000);
  const today = utcDayIndex(now);
  const days = new Map<string, number[]>();
  for (let offset = 0; offset < ids.length; offset += STREAK_CHUNK) {
    const chunk = ids.slice(offset, offset + STREAK_CHUNK);
    const rows = await rowsOf<{ user_id: unknown; day_index: unknown }>(
      database,
      sql`
        SELECT user_id AS user_id, CAST(started_at / 86400 AS INTEGER) AS day_index
        FROM revision_sessions
        WHERE started_at >= ${since}
          AND user_id IN (${sql.join(chunk.map((id) => sql`${id}`), sql`, `)})
        GROUP BY user_id, day_index
      `,
    );
    for (const row of rows) {
      const userId = readRequiredString(row.user_id, "user_id");
      const day = readInt(row.day_index, "day_index");
      const list = days.get(userId) ?? [];
      list.push(day);
      days.set(userId, list);
    }
  }
  for (const [userId, indexes] of days) {
    streaks.set(userId, currentStreakFromDayIndexes(indexes, today));
  }
  return streaks;
}

function toFacts(row: RawStudent, streak: number): StudentFacts {
  const createdAt = readUnix(row.created_at, "created_at");
  if (createdAt == null) throw new Error("Date d'inscription absente");
  const lastAt = readUnix(row.last_at, "last_at");
  return {
    id: readRequiredString(row.id, "id"),
    email: readRequiredString(row.email, "email"),
    name: readNullableString(row.name, "name"),
    firstName: readNullableString(row.first_name, "first_name"),
    lastName: readNullableString(row.last_name, "last_name"),
    subscriptionStatus: readRequiredString(row.subscription_status, "subscription_status"),
    signedUpAt: fromUnix(createdAt),
    lastActivityAt: lastAt == null ? null : fromUnix(lastAt),
    listCount: readInt(row.list_count, "list_count"),
    promoCode: readNullableString(row.promo_code, "promo_code"),
    cancellationPlan: readCancellationPlan(row.cancellation_plan),
    streak,
  };
}

async function loadFacts(
  database: Queryable,
  input: { filter: StudentFilter; query: string; now: Date; paging: { limit: number; offset: number } | null },
): Promise<{ facts: StudentFacts[]; flags: OptionalTables }> {
  const cutoff = inactiveCutoffSeconds(input.now);
  const selected = await withOptionalTables((flags) =>
    rowsOf<RawStudent>(database, studentSelect(flags, input.filter, input.query, cutoff, input.paging)),
  );
  const ids = selected.value.map((row) => readRequiredString(row.id, "id"));
  const streaks = await loadStreakMap(database, ids, input.now);
  return {
    facts: selected.value.map((row) => toFacts(row, streaks.get(readRequiredString(row.id, "id")) ?? 0)),
    flags: selected.flags,
  };
}

export async function loadStudentList(
  database: Queryable,
  input: { filter: StudentFilter; query: string; page: number; now: Date },
): Promise<StudentListResponse> {
  const cutoff = inactiveCutoffSeconds(input.now);
  const [counts, loaded] = await Promise.all([
    loadCounts(database, input.query, cutoff),
    loadFacts(database, {
      filter: input.filter,
      query: input.query,
      now: input.now,
      paging: { limit: STUDENT_PAGE_SIZE, offset: (input.page - 1) * STUDENT_PAGE_SIZE },
    }),
  ]);
  return {
    counts,
    promoCodesAvailable: loaded.flags.promo,
    cancellationsAvailable: loaded.flags.cancellation,
    page: input.page,
    pageSize: STUDENT_PAGE_SIZE,
    total: countForFilter(counts, input.filter),
    students: loaded.facts.map((facts) => toListItem(facts, input.now, loaded.flags.promo)),
  };
}

export async function loadStudentCsv(
  database: Queryable,
  input: { filter: StudentFilter; query: string; now: Date },
): Promise<string> {
  const loaded = await loadFacts(database, { ...input, paging: null });
  return studentCsv(loaded.facts, input.now, loaded.flags.promo);
}

async function optionalCode(
  database: Queryable,
  id: string,
): Promise<{ code: string | null; available: boolean }> {
  try {
    const [row] = await rowsOf<{ code: unknown }>(
      database,
      sql`
        SELECT pc.code AS code
        FROM promo_code_redemptions r
        INNER JOIN promo_codes pc ON pc.id = r.promo_code_id
        WHERE r.user_id = ${id}
        ORDER BY r.redeemed_at DESC, pc.code ASC
        LIMIT 1
      `,
    );
    return { code: row ? readNullableString(row.code, "code") : null, available: true };
  } catch (error) {
    if (missingStudentsTable(error) === "promo") return { code: null, available: false };
    throw error;
  }
}

async function optionalPlan(
  database: Queryable,
  id: string,
): Promise<{ plan: StudentFacts["cancellationPlan"]; available: boolean }> {
  try {
    const [row] = await rowsOf<{ plan: unknown }>(
      database,
      sql`
        SELECT plan AS plan
        FROM cancellation_feedback
        WHERE user_id = ${id}
        ORDER BY cancelled_at DESC, id DESC
        LIMIT 1
      `,
    );
    return { plan: readCancellationPlan(row?.plan ?? null), available: true };
  } catch (error) {
    if (missingStudentsTable(error) === "cancellation") return { plan: null, available: false };
    throw error;
  }
}

export async function loadStudentSheet(
  database: Queryable,
  id: string,
  now: Date,
): Promise<StudentSheet | null> {
  const [userRows, countRows, promo, cancellation, streaks, languageRows, preferenceRows] = await Promise.all([
    rowsOf<{
      id: unknown;
      email: unknown;
      name: unknown;
      first_name: unknown;
      last_name: unknown;
      subscription_status: unknown;
      created_at: unknown;
      period_end: unknown;
    }>(
      database,
      sql`
        SELECT
          u.id AS id,
          u.email AS email,
          u.name AS name,
          p.first_name AS first_name,
          p.last_name AS last_name,
          u.subscription_status AS subscription_status,
          u.created_at AS created_at,
          u.subscription_current_period_end AS period_end
        FROM users u
        LEFT JOIN user_profiles p ON p.user_id = u.id
        WHERE u.id = ${id} AND u.role = 'student'
      `,
    ),
    rowsOf<{
      list_count: unknown;
      word_count: unknown;
      session_count: unknown;
      last_session: unknown;
      last_revision: unknown;
    }>(
      database,
      sql`
        SELECT
          (
            SELECT COUNT(l.id)
            FROM word_families wf
            LEFT JOIN lists l ON l.family_id = wf.id
            WHERE wf.user_id = ${id}
          ) AS list_count,
          (
            SELECT COUNT(w.id)
            FROM word_families wf
            INNER JOIN lists l ON l.family_id = wf.id
            INNER JOIN words w ON w.list_id = l.id
            WHERE wf.user_id = ${id}
          ) AS word_count,
          (SELECT COUNT(*) FROM revision_sessions WHERE user_id = ${id}) AS session_count,
          (SELECT MAX(ended_at) FROM revision_sessions WHERE user_id = ${id}) AS last_session,
          (SELECT MAX(created_at) FROM revisions WHERE user_id = ${id}) AS last_revision
      `,
    ),
    optionalCode(database, id),
    optionalPlan(database, id),
    loadStreakMap(database, [id], now),
    rowsOf<{ language: unknown; words: unknown }>(
      database,
      sql`
        SELECT language AS language, COALESCE(SUM(words_seen), 0) AS words
        FROM revision_sessions
        WHERE user_id = ${id}
        GROUP BY language
      `,
    ),
    rowsOf<{ preferred_language: unknown }>(
      database,
      sql`
        SELECT preferred_language AS preferred_language
        FROM user_preferences
        WHERE user_id = ${id}
      `,
    ),
  ]);

  const user = userRows[0];
  const counts = countRows[0];
  if (!user || !counts) return null;
  const createdAt = readUnix(user.created_at, "created_at");
  if (createdAt == null) throw new Error("Date d'inscription absente");
  const lastSession = readUnix(counts.last_session, "last_session");
  const lastRevision = readUnix(counts.last_revision, "last_revision");
  const lastAt = lastSession == null ? lastRevision : lastRevision == null ? lastSession : Math.max(lastSession, lastRevision);
  const periodEnd = readUnix(user.period_end, "period_end");
  const facts: StudentFacts = {
    id: readRequiredString(user.id, "id"),
    email: readRequiredString(user.email, "email"),
    name: readNullableString(user.name, "name"),
    firstName: readNullableString(user.first_name, "first_name"),
    lastName: readNullableString(user.last_name, "last_name"),
    subscriptionStatus: readRequiredString(user.subscription_status, "subscription_status"),
    signedUpAt: fromUnix(createdAt),
    lastActivityAt: lastAt == null ? null : fromUnix(lastAt),
    listCount: readInt(counts.list_count, "list_count"),
    promoCode: promo.code,
    cancellationPlan: cancellation.plan,
    streak: streaks.get(id) ?? 0,
  };
  const preferredCode = readNullableString(preferenceRows[0]?.preferred_language, "preferred_language");
  const primaryLanguage = choosePrimaryLanguage(
    languageRows.map((row) => {
      const code = readNullableString(row.language, "language");
      return { label: displayLanguageLabel(code), words: readInt(row.words, "words") };
    }),
    displayLanguageLabel(preferredCode),
  );
  return buildStudentSheet(
    {
      facts,
      periodEnd: periodEnd == null ? null : fromUnix(periodEnd),
      wordCount: readInt(counts.word_count, "word_count"),
      sessionCount: readInt(counts.session_count, "session_count"),
      primaryLanguage,
      promoCodesAvailable: promo.available,
    },
    now,
  );
}

export async function loadUsage(database: Queryable, now: Date): Promise<UsageReport> {
  const windows = usageWindows(now);
  const nowSec = seconds(windows.now);
  const currentStart = seconds(windows.currentStart);
  const previousStart = seconds(windows.previousStart);
  const baselineStart = seconds(windows.baselineStart);
  const baselineEnd = seconds(windows.baselineEnd);
  const weekStart = seconds(windows.weekStart);

  const [totalsRows, modeRows, languageRows, goalRows, chosenRows, countRows] = await Promise.all([
    rowsOf<{
      sessions_current: unknown;
      sessions_previous: unknown;
      words_current: unknown;
      words_previous: unknown;
      dict_retained_current: unknown;
      dict_seen_current: unknown;
      dict_retained_baseline: unknown;
      dict_seen_baseline: unknown;
    }>(
      database,
      sql`
        SELECT
          COALESCE(SUM(CASE WHEN rs.ended_at >= ${currentStart} AND rs.ended_at < ${nowSec} THEN 1 ELSE 0 END), 0) AS sessions_current,
          COALESCE(SUM(CASE WHEN rs.ended_at >= ${previousStart} AND rs.ended_at < ${currentStart} THEN 1 ELSE 0 END), 0) AS sessions_previous,
          COALESCE(SUM(CASE WHEN rs.ended_at >= ${currentStart} AND rs.ended_at < ${nowSec} THEN rs.words_seen ELSE 0 END), 0) AS words_current,
          COALESCE(SUM(CASE WHEN rs.ended_at >= ${previousStart} AND rs.ended_at < ${currentStart} THEN rs.words_seen ELSE 0 END), 0) AS words_previous,
          COALESCE(SUM(CASE WHEN rs.mode = 'dictee' AND rs.ended_at >= ${currentStart} AND rs.ended_at < ${nowSec} THEN rs.words_retained ELSE 0 END), 0) AS dict_retained_current,
          COALESCE(SUM(CASE WHEN rs.mode = 'dictee' AND rs.ended_at >= ${currentStart} AND rs.ended_at < ${nowSec} THEN rs.words_seen ELSE 0 END), 0) AS dict_seen_current,
          COALESCE(SUM(CASE WHEN rs.mode = 'dictee' AND rs.ended_at >= ${baselineStart} AND rs.ended_at < ${baselineEnd} THEN rs.words_retained ELSE 0 END), 0) AS dict_retained_baseline,
          COALESCE(SUM(CASE WHEN rs.mode = 'dictee' AND rs.ended_at >= ${baselineStart} AND rs.ended_at < ${baselineEnd} THEN rs.words_seen ELSE 0 END), 0) AS dict_seen_baseline
        FROM revision_sessions rs
        INNER JOIN users u ON u.id = rs.user_id
        WHERE u.role = 'student'
          AND rs.ended_at >= ${baselineStart}
          AND rs.ended_at < ${nowSec}
      `,
    ),
    rowsOf<{ mode: unknown; sessions: unknown }>(
      database,
      sql`
        SELECT rs.mode AS mode, COUNT(*) AS sessions
        FROM revision_sessions rs
        INNER JOIN users u ON u.id = rs.user_id
        WHERE u.role = 'student'
          AND rs.ended_at >= ${currentStart}
          AND rs.ended_at < ${nowSec}
        GROUP BY rs.mode
      `,
    ),
    rowsOf<{ language: unknown; words: unknown }>(
      database,
      sql`
        SELECT rs.language AS language, COALESCE(SUM(rs.words_seen), 0) AS words
        FROM revision_sessions rs
        INNER JOIN users u ON u.id = rs.user_id
        WHERE u.role = 'student'
          AND rs.ended_at >= ${currentStart}
          AND rs.ended_at < ${nowSec}
        GROUP BY rs.language
      `,
    ),
    rowsOf<{ goal: unknown; words: unknown }>(
      database,
      sql`
        SELECT u.weekly_goal AS goal, COALESCE(SUM(rs.words_seen), 0) AS words
        FROM users u
        INNER JOIN revision_sessions rs
          ON rs.user_id = u.id
         AND rs.ended_at >= ${weekStart}
         AND rs.ended_at < ${nowSec}
        WHERE u.role = 'student'
        GROUP BY u.id, u.weekly_goal
      `,
    ),
    rowsOf<{ goal: unknown; students: unknown }>(
      database,
      sql`
        SELECT weekly_goal AS goal, COUNT(*) AS students
        FROM users
        WHERE role = 'student' AND weekly_goal > 0
        GROUP BY weekly_goal
      `,
    ),
    rowsOf<{ student_count: unknown }>(
      database,
      sql`SELECT COUNT(*) AS student_count FROM users WHERE role = 'student'`,
    ),
  ]);

  const totals = totalsRows[0];
  const studentCount = countRows[0];
  if (!totals || !studentCount) throw new Error("Usage élèves introuvable");

  return buildUsageReport({
    studentCount: readInt(studentCount.student_count, "élèves"),
    sessionsCurrent: readInt(totals.sessions_current, "sessions"),
    sessionsPrevious: readInt(totals.sessions_previous, "sessions précédentes"),
    wordsCurrent: readInt(totals.words_current, "mots"),
    wordsPrevious: readInt(totals.words_previous, "mots précédents"),
    dictationRetainedCurrent: readInt(totals.dict_retained_current, "dictée retenue"),
    dictationSeenCurrent: readInt(totals.dict_seen_current, "dictée vue"),
    dictationRetainedBaseline: readInt(totals.dict_retained_baseline, "dictée retenue, 4 semaines"),
    dictationSeenBaseline: readInt(totals.dict_seen_baseline, "dictée vue, 4 semaines"),
    modes: modeRows.map((row) => ({
      mode: readNullableString(row.mode, "mode"),
      sessions: readInt(row.sessions, "sessions du mode"),
    })),
    languages: languageRows.map((row) => ({
      label: knownLanguageLabel(readNullableString(row.language, "language")),
      words: readInt(row.words, "mots de la langue"),
    })),
    activeGoals: goalRows.map((row) => ({
      goal: readInt(row.goal, "objectif"),
      words: readInt(row.words, "mots de la semaine"),
    })),
    chosenGoals: chosenRows.map((row) => ({
      goal: readInt(row.goal, "objectif choisi"),
      students: readInt(row.students, "élèves de l'objectif"),
    })),
  });
}
