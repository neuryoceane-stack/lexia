/**
 * Calculs de la section Élèves (liste, fiche, usage).
 * Aucun accès base : les requêtes sont dans creator-students-stats.ts.
 *
 * Ce qui n'est pas enregistré n'est pas estimé :
 * - pas de dernière connexion (l'activité vient des révisions) ;
 * - pas d'historique d'objectif hebdomadaire (semaine en cours seulement) ;
 * - pas de statut « essai terminé » sans une résiliation dont le plan est trial.
 */

import type { SQL } from "drizzle-orm";
import {
  errorText,
  formatCount,
  formatCsvDate,
  formatDepartureDate,
  isCancellationPlan,
  isCancellationStorageUnavailable,
  parisParts,
  toCsv,
  type CancellationPlan,
} from "@/lib/cancellation";
import { isMissingPromoTable } from "@/lib/promo-codes";

/** Base sur laquelle les lectures élèves envoient leur SQL. */
export type Queryable = {
  all<T = unknown>(query: SQL): T[] | Promise<T[]>;
};

export const STUDENT_PAGE_SIZE = 50;
export const STUDENT_SEARCH_MAX = 120;
export const INACTIVE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;
export const STREAK_LOOKBACK_DAYS = 365;
export const LANGUAGE_TOP_COUNT = 4;

export const STUDENT_FILTERS = ["all", "trial", "subscribed", "inactive"] as const;
export type StudentFilter = (typeof STUDENT_FILTERS)[number];

export const STUDENT_STATUS_KEYS = [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "trial_ended",
  "inactive",
] as const;
export type StudentStatusKey = (typeof STUDENT_STATUS_KEYS)[number];

export const STUDENT_STATUS_LABELS: Record<StudentStatusKey, string> = {
  trialing: "Essai",
  active: "Abonné",
  past_due: "Impayé",
  canceled: "Résilié",
  trial_ended: "Essai terminé",
  inactive: "Sans abonnement",
};

export const FILTER_LABELS: Record<StudentFilter, string> = {
  all: "Tous",
  trial: "En essai",
  subscribed: "Abonnés",
  inactive: "Inactifs depuis 7 jours",
};

/** Modes enregistrés sur revision_sessions.mode. */
export const SESSION_MODE_LABELS: Record<string, string> = {
  flashcard: "Flashcards",
  dictee: "Dictée",
};

export const USAGE_PERIOD_LABEL = "7 derniers jours";
export const GOAL_HISTORY_NOTE =
  "Les semaines précédentes ne sont pas affichées : seul l'objectif en cours est enregistré, pas celui des semaines passées.";

export const STUDENT_CSV_HEADERS = [
  "Élève",
  "E-mail",
  "Statut",
  "Inscription",
  "Dernière activité",
  "Listes",
  "Série",
  "Code",
] as const;

/**
 * Accents français repliés avant la recherche.
 * SQLite ne minusculise pas « É » : le SQL applique les deux casses,
 * le repli JavaScript minusculise d'abord.
 */
export const SEARCH_REPLACEMENTS: readonly (readonly [string, string])[] = [
  ["à", "a"], ["á", "a"], ["â", "a"], ["ä", "a"], ["ã", "a"], ["å", "a"],
  ["À", "a"], ["Á", "a"], ["Â", "a"], ["Ä", "a"], ["Ã", "a"], ["Å", "a"],
  ["é", "e"], ["è", "e"], ["ê", "e"], ["ë", "e"],
  ["É", "e"], ["È", "e"], ["Ê", "e"], ["Ë", "e"],
  ["ï", "i"], ["î", "i"], ["ì", "i"], ["í", "i"],
  ["Ï", "i"], ["Î", "i"], ["Ì", "i"], ["Í", "i"],
  ["ô", "o"], ["ö", "o"], ["ò", "o"], ["ó", "o"], ["õ", "o"],
  ["Ô", "o"], ["Ö", "o"], ["Ò", "o"], ["Ó", "o"], ["Õ", "o"],
  ["ù", "u"], ["û", "u"], ["ü", "u"], ["ú", "u"],
  ["Ù", "u"], ["Û", "u"], ["Ü", "u"], ["Ú", "u"],
  ["ç", "c"], ["Ç", "c"],
  ["ñ", "n"], ["Ñ", "n"],
  ["œ", "oe"], ["Œ", "oe"],
  ["æ", "ae"], ["Æ", "ae"],
  ["ÿ", "y"], ["Ÿ", "y"],
  ["ý", "y"], ["Ý", "y"],
];

const STATUS_KEY_SET = new Set<string>(STUDENT_STATUS_KEYS);

export function isStudentStatus(value: string): value is StudentStatusKey {
  return STATUS_KEY_SET.has(value);
}

export function isStudentId(value: string): boolean {
  return /^[A-Za-z0-9_-]{1,64}$/.test(value);
}

export function parseStudentFilter(value: string | null): StudentFilter | null {
  if (value == null || value === "" || value === "all") return "all";
  if ((STUDENT_FILTERS as readonly string[]).includes(value)) return value as StudentFilter;
  return null;
}

export function parsePage(value: string | null): number | null {
  if (value == null || value === "") return 1;
  if (!/^[1-9]\d{0,4}$/.test(value)) return null;
  const page = Number(value);
  return page <= 10_000 ? page : null;
}

export function parseStudentSearch(value: string | null): { ok: true; query: string } | { ok: false } {
  const query = (value ?? "").trim();
  if (query.length > STUDENT_SEARCH_MAX) return { ok: false };
  return { ok: true, query };
}

export function foldSearch(value: string): string {
  let text = value.trim().toLocaleLowerCase("fr-FR");
  for (const [from, to] of SEARCH_REPLACEMENTS) {
    if (from === from.toLocaleLowerCase("fr-FR")) text = text.replaceAll(from, to);
  }
  return text;
}

export function likeContains(folded: string): string {
  return `%${folded.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

/**
 * Dernière activité connue, sinon la date d'inscription.
 * Un compte ouvert hier sans révision n'est pas inactif depuis 7 jours.
 * Sept jours pile comptent comme inactifs.
 */
export function isInactive(lastActivity: Date | null, signedUpAt: Date, now: Date): boolean {
  const reference = lastActivity ?? signedUpAt;
  return now.getTime() - reference.getTime() >= INACTIVE_AFTER_MS;
}

export function inactiveCutoffSeconds(now: Date): number {
  return Math.floor((now.getTime() - INACTIVE_AFTER_MS) / 1000);
}

/**
 * Statut affiché à partir de users.subscription_status.
 * « Essai terminé » seulement si la dernière résiliation enregistrée est un essai
 * et que le compte n'est plus en essai ni abonné.
 */
export function resolveStudentStatus(
  subscriptionStatus: string,
  latestCancellationPlan: CancellationPlan | null,
): StudentStatusKey {
  switch (subscriptionStatus) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return latestCancellationPlan === "trial" ? "trial_ended" : "canceled";
    case "inactive":
      return latestCancellationPlan === "trial" ? "trial_ended" : "inactive";
    default:
      throw new Error(`Statut d'abonnement inattendu : ${subscriptionStatus}`);
  }
}

export function readCancellationPlan(value: unknown): CancellationPlan | null {
  if (value == null || value === "") return null;
  if (typeof value === "string" && isCancellationPlan(value)) return value;
  throw new Error("Plan de résiliation inattendu");
}

/** Prénom et nom du profil, sinon le nom du compte. Jamais l'e-mail à la place du nom. */
export function studentDisplayName(input: {
  firstName: string | null;
  lastName: string | null;
  name: string | null;
}): string | null {
  const profile = [input.firstName, input.lastName]
    .map((part) => part?.trim() ?? "")
    .filter((part) => part.length > 0)
    .join(" ");
  if (profile) return profile;
  const account = input.name?.trim() ?? "";
  return account.length > 0 ? account : null;
}

export function studentInitial(name: string | null, email: string): string {
  const source = (name ?? email).trim();
  const first = Array.from(source)[0];
  return first ? first.toLocaleUpperCase("fr-FR") : "?";
}

export function parisCalendarDaysBetween(earlier: Date, later: Date): number {
  const start = parisParts(earlier);
  const end = parisParts(later);
  const startUtc = Date.UTC(start.year, start.month - 1, start.day);
  const endUtc = Date.UTC(end.year, end.month - 1, end.day);
  return Math.round((endUtc - startUtc) / DAY_MS);
}

/** « aujourd'hui », « hier », « il y a 12 jours », puis une date. Calendrier de Paris. */
export function formatStudentWhen(date: Date, now: Date): string {
  const days = parisCalendarDaysBetween(date, now);
  if (days < 0) return formatDepartureDate(date, now);
  if (days === 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 30) return `il y a ${formatCount(days)} jours`;
  return formatDepartureDate(date, now);
}

export function lastActivityLabel(date: Date | null, now: Date): string {
  if (!date) return "Aucune révision";
  return formatStudentWhen(date, now);
}

export function codeLabel(promoCode: string | null, promoCodesAvailable: boolean): string {
  if (!promoCodesAvailable) return "Non disponible";
  return promoCode ?? "—";
}

export function trialDaysRemaining(periodEnd: Date, now: Date): number {
  const diff = periodEnd.getTime() - now.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / DAY_MS);
}

/** Détail du badge. null si la date de fin de période n'est pas enregistrée. */
export function statusDetail(input: {
  status: StudentStatusKey;
  periodEnd: Date | null;
  now: Date;
}): string | null {
  const { status, periodEnd, now } = input;
  if (status === "trialing") {
    if (!periodEnd) return null;
    const days = trialDaysRemaining(periodEnd, now);
    if (days <= 0) return "Essai : se termine aujourd'hui";
    if (days === 1) return "Essai : 1 jour restant";
    return `Essai : ${formatCount(days)} jours restants`;
  }
  if (status === "active") {
    if (!periodEnd) return null;
    return `Renouvellement le ${formatDepartureDate(periodEnd, now)}`;
  }
  if (status === "canceled" || status === "trial_ended") {
    if (!periodEnd) return null;
    if (periodEnd.getTime() > now.getTime()) {
      return `Accès jusqu'au ${formatDepartureDate(periodEnd, now)}`;
    }
    return `Terminé le ${formatDepartureDate(periodEnd, now)}`;
  }
  return null;
}

export function formatStreak(days: number): string {
  if (!Number.isInteger(days) || days < 0) throw new Error("Série invalide");
  if (days > 1) return `${formatCount(days)} jours`;
  return `${days} jour`;
}

export function formatListsAndWords(listCount: number, wordCount: number): string {
  return `${formatCount(listCount)} · ${formatCount(wordCount)}`;
}

export function formatPercent(value: number): string {
  return `${formatCount(value)}\u00a0%`;
}

export function countDelta(current: number, previous: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) {
    throw new Error("Écart invalide");
  }
  return current - previous;
}

export function countDeltaHint(delta: number): string {
  if (delta > 0) return `+${formatCount(delta)} par rapport à la semaine dernière`;
  if (delta < 0) return `−${formatCount(Math.abs(delta))} par rapport à la semaine dernière`;
  return "Identique à la semaine dernière";
}

export function dictationDeltaHint(points: number): string {
  const abs = Math.abs(points);
  const unit = abs > 1 ? "points" : "point";
  if (points > 0) return `+${formatCount(abs)} ${unit} sur 4 semaines`;
  if (points < 0) return `−${formatCount(abs)} ${unit} sur 4 semaines`;
  return "Identique sur 4 semaines";
}

/** null s'il n'y a aucun mot vu : 0 % serait une réussite inventée. */
export function sharePercent(part: number, total: number): number | null {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0 || part < 0) return null;
  return Math.round((part / total) * 100);
}

export function dictationSuccessPercent(retained: number, seen: number): number | null {
  return sharePercent(retained, seen);
}

export function dictationPresentation(
  currentPercent: number | null,
  baselinePercent: number | null,
): { percent: number | null; hint: string } {
  if (currentPercent == null) {
    return { percent: null, hint: "Aucune dictée sur les 7 derniers jours." };
  }
  if (baselinePercent == null) {
    return {
      percent: currentPercent,
      hint: "Pas de comparaison : aucune dictée il y a 4 semaines.",
    };
  }
  return {
    percent: currentPercent,
    hint: dictationDeltaHint(currentPercent - baselinePercent),
  };
}

/**
 * Répartit 100 points entiers. Le reste va aux plus grandes parties décimales,
 * puis à l'index le plus petit en cas d'égalité.
 */
export function distributePercents(weights: readonly number[]): number[] {
  if (weights.some((weight) => !Number.isFinite(weight) || weight < 0)) {
    throw new Error("Part négative ou invalide");
  }
  if (weights.length === 0) return [];
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) return weights.map(() => 0);
  const exact = weights.map((weight) => (weight / total) * 100);
  const floors = exact.map((value) => Math.floor(value));
  let remainder = 100 - floors.reduce((sum, value) => sum + value, 0);
  const order = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((left, right) => right.fraction - left.fraction || left.index - right.index);
  const result = [...floors];
  for (const item of order) {
    if (remainder <= 0) break;
    const current = result[item.index];
    if (current == null) break;
    result[item.index] = current + 1;
    remainder -= 1;
  }
  return result;
}

export type ShareRow = { label: string; percent: number };

/**
 * Top des langues nommées, le reste dans « Autres ».
 * Un code sans libellé (ou vide) rejoint « Autres » : on n'invente pas de nom.
 */
export function groupLanguageShares(
  entries: readonly { label: string | null; words: number }[],
  top = LANGUAGE_TOP_COUNT,
): ShareRow[] {
  const buckets = new Map<string, number>();
  let other = 0;
  for (const entry of entries) {
    if (!Number.isFinite(entry.words) || entry.words < 0) {
      throw new Error("Volume de mots invalide");
    }
    if (entry.words === 0) continue;
    const label = entry.label?.trim() || null;
    if (!label) {
      other += entry.words;
      continue;
    }
    buckets.set(label, (buckets.get(label) ?? 0) + entry.words);
  }
  const named = [...buckets.entries()].sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "fr"),
  );
  const rows: { label: string; words: number }[] = named
    .slice(0, top)
    .map(([label, words]) => ({ label, words }));
  for (const [, words] of named.slice(top)) other += words;
  if (other > 0) rows.push({ label: "Autres", words: other });
  const percents = distributePercents(rows.map((row) => row.words));
  return rows.map((row, index) => ({ label: row.label, percent: percents[index] ?? 0 }));
}

/**
 * Part des sessions par mode. Les deux modes connus restent visibles
 * dès qu'il y a au moins une session, y compris à 0 %.
 */
export function groupModeShares(
  entries: readonly { mode: string | null; sessions: number }[],
): ShareRow[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    if (!Number.isFinite(entry.sessions) || entry.sessions < 0) {
      throw new Error("Nombre de sessions invalide");
    }
    if (entry.sessions === 0) continue;
    const mode = entry.mode?.trim() ?? "";
    counts.set(mode, (counts.get(mode) ?? 0) + entry.sessions);
  }
  const recorded = [...counts.values()].reduce((sum, count) => sum + count, 0);
  if (recorded === 0) return [];
  if (!counts.has("flashcard")) counts.set("flashcard", 0);
  if (!counts.has("dictee")) counts.set("dictee", 0);
  const extras = [...counts.keys()]
    .filter((mode) => mode !== "flashcard" && mode !== "dictee")
    .sort((left, right) => left.localeCompare(right, "fr"));
  const order = ["flashcard", "dictee", ...extras];
  const rows = order.map((mode) => ({
    label: mode === "" ? "Non disponible" : (SESSION_MODE_LABELS[mode] ?? mode),
    count: counts.get(mode) ?? 0,
  }));
  const percents = distributePercents(rows.map((row) => row.count));
  return rows.map((row, index) => ({ label: row.label, percent: percents[index] ?? 0 }));
}

export function utcDayIndex(date: Date): number {
  return Math.floor(date.getTime() / DAY_MS);
}

/**
 * Même règle que GET /api/streak : la série compte les jours UTC consécutifs
 * et vaut 0 si aucune session n'a commencé aujourd'hui (UTC).
 */
export function currentStreakFromDayIndexes(dayIndexes: readonly number[], todayIndex: number): number {
  const days = new Set(dayIndexes);
  if (!days.has(todayIndex)) return 0;
  let streak = 0;
  let cursor = todayIndex;
  while (days.has(cursor)) {
    streak += 1;
    cursor -= 1;
  }
  return streak;
}

/** Lundi 00:00 UTC. En production le serveur est en UTC, comme la route élève. */
export function utcWeekStart(now: Date): Date {
  const daysFromMonday = (now.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysFromMonday));
}

export type UsageWindows = {
  now: Date;
  currentStart: Date;
  previousStart: Date;
  baselineStart: Date;
  baselineEnd: Date;
  weekStart: Date;
};

/**
 * Sessions et mots : 7 jours glissants, comparés aux 7 jours d'avant.
 * Dictée : ces 7 jours, comparés à la fenêtre d'il y a 4 semaines
 * (de J-35 inclus à J-28 exclus).
 * Objectif : semaine civile UTC en cours, lundi 00:00.
 */
export function usageWindows(now: Date): UsageWindows {
  return {
    now,
    currentStart: new Date(now.getTime() - 7 * DAY_MS),
    previousStart: new Date(now.getTime() - 14 * DAY_MS),
    baselineEnd: new Date(now.getTime() - 28 * DAY_MS),
    baselineStart: new Date(now.getTime() - 35 * DAY_MS),
    weekStart: utcWeekStart(now),
  };
}

export function summarizeWeeklyGoals(
  active: readonly { goal: number; words: number }[],
  chosen: readonly { goal: number; students: number }[],
): {
  activeStudents: number;
  reachedStudents: number;
  percent: number | null;
  mostChosen: { words: number; students: number } | null;
} {
  let reachedStudents = 0;
  for (const row of active) {
    if (!Number.isFinite(row.goal) || !Number.isFinite(row.words) || row.words < 0) {
      throw new Error("Objectif hebdomadaire invalide");
    }
    if (row.goal > 0 && row.words >= row.goal) reachedStudents += 1;
  }
  let mostChosen: { words: number; students: number } | null = null;
  for (const row of chosen) {
    if (!Number.isInteger(row.goal) || row.goal <= 0 || !Number.isInteger(row.students) || row.students <= 0) {
      continue;
    }
    if (
      !mostChosen ||
      row.students > mostChosen.students ||
      (row.students === mostChosen.students && row.goal < mostChosen.words)
    ) {
      mostChosen = { words: row.goal, students: row.students };
    }
  }
  return {
    activeStudents: active.length,
    reachedStudents,
    percent: sharePercent(reachedStudents, active.length),
    mostChosen,
  };
}

export function mostChosenGoalLabel(goal: { words: number }): string {
  const noun = goal.words > 1 ? "mots" : "mot";
  return `Objectif le plus choisi : ${formatCount(goal.words)} ${noun} par semaine`;
}

export function choosePrimaryLanguage(
  rows: readonly { label: string | null; words: number }[],
  preferredLabel: string | null,
): string | null {
  const ranked = rows
    .filter((row) => row.words > 0 && row.label && row.label.trim().length > 0)
    .map((row) => ({ label: row.label!.trim(), words: row.words }))
    .sort((left, right) => right.words - left.words || left.label.localeCompare(right.label, "fr"));
  if (ranked[0]) return ranked[0].label;
  const preferred = preferredLabel?.trim() ?? "";
  return preferred.length > 0 ? preferred : null;
}

/** Libellé d'un code inconnu de language.ts : le code lui-même, pas un nom inventé. */
export function unknownLanguageLabel(code: string | null): string | null {
  if (!code) return null;
  const trimmed = code.trim();
  if (!/^[A-Za-z]{2,3}$/.test(trimmed)) return null;
  return trimmed.toUpperCase();
}

export type StudentListItem = {
  id: string;
  name: string | null;
  email: string;
  initial: string;
  status: StudentStatusKey;
  statusLabel: string;
  signedUpLabel: string;
  lastActivityLabel: string;
  listLabel: string;
  streakLabel: string;
  codeLabel: string;
};

export type StudentCounts = {
  all: number;
  trial: number;
  subscribed: number;
  inactive: number;
};

export type StudentListResponse = {
  counts: StudentCounts;
  promoCodesAvailable: boolean;
  cancellationsAvailable: boolean;
  page: number;
  pageSize: number;
  total: number;
  students: StudentListItem[];
};

export type StudentSheet = {
  id: string;
  initial: string;
  name: string | null;
  email: string;
  status: StudentStatusKey;
  statusLabel: string;
  statusDetail: string | null;
  promoCode: string | null;
  promoCodesAvailable: boolean;
  fields: { label: string; value: string }[];
};

export type UsageReport = {
  periodLabel: typeof USAGE_PERIOD_LABEL;
  studentCount: number;
  sessions: { value: number; hint: string };
  words: { value: number; hint: string };
  dictation: { percent: number | null; hint: string };
  modes: ShareRow[];
  languages: ShareRow[];
  goals: {
    historyAvailable: false;
    percent: number | null;
    activeStudents: number;
    reachedStudents: number;
    mostChosenLabel: string | null;
    historyNote: string;
  };
};

export function countForFilter(counts: StudentCounts, filter: StudentFilter): number {
  if (filter === "trial") return counts.trial;
  if (filter === "subscribed") return counts.subscribed;
  if (filter === "inactive") return counts.inactive;
  return counts.all;
}

export function pageRangeLabel(page: number, pageSize: number, total: number): string | null {
  if (total <= 0 || page < 1 || pageSize < 1) return null;
  const start = (page - 1) * pageSize + 1;
  if (start > total) return null;
  const end = Math.min(total, page * pageSize);
  const noun = total > 1 ? "élèves" : "élève";
  if (total <= pageSize) return `${formatCount(total)} ${noun}`;
  const span = start === end ? formatCount(start) : `${formatCount(start)}–${formatCount(end)}`;
  return `${span} sur ${formatCount(total)} ${noun}`;
}

export function filterPillLabel(filter: StudentFilter, count: number): string {
  return `${FILTER_LABELS[filter]} · ${formatCount(count)}`;
}

export type StudentFacts = {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  subscriptionStatus: string;
  signedUpAt: Date;
  lastActivityAt: Date | null;
  listCount: number;
  promoCode: string | null;
  cancellationPlan: CancellationPlan | null;
  streak: number;
};

export function toListItem(facts: StudentFacts, now: Date, promoCodesAvailable: boolean): StudentListItem {
  const name = studentDisplayName(facts);
  const status = resolveStudentStatus(facts.subscriptionStatus, facts.cancellationPlan);
  return {
    id: facts.id,
    name,
    email: facts.email,
    initial: studentInitial(name, facts.email),
    status,
    statusLabel: STUDENT_STATUS_LABELS[status],
    signedUpLabel: formatStudentWhen(facts.signedUpAt, now),
    lastActivityLabel: lastActivityLabel(facts.lastActivityAt, now),
    listLabel: formatCount(facts.listCount),
    streakLabel: formatStreak(facts.streak),
    codeLabel: codeLabel(facts.promoCode, promoCodesAvailable),
  };
}

export function buildStudentSheet(
  input: {
    facts: StudentFacts;
    periodEnd: Date | null;
    wordCount: number;
    sessionCount: number;
    primaryLanguage: string | null;
    promoCodesAvailable: boolean;
  },
  now: Date,
): StudentSheet {
  const item = toListItem(input.facts, now, input.promoCodesAvailable);
  const detail = statusDetail({
    status: item.status,
    periodEnd: input.periodEnd,
    now,
  });
  return {
    id: item.id,
    initial: item.initial,
    name: item.name,
    email: item.email,
    status: item.status,
    statusLabel: item.statusLabel,
    statusDetail: detail,
    promoCode: input.promoCodesAvailable ? input.facts.promoCode : null,
    promoCodesAvailable: input.promoCodesAvailable,
    fields: [
      { label: "Inscription", value: item.signedUpLabel },
      { label: "Dernière activité", value: item.lastActivityLabel },
      { label: "Listes · mots", value: formatListsAndWords(input.facts.listCount, input.wordCount) },
      { label: "Série en cours", value: item.streakLabel },
      { label: "Sessions", value: formatCount(input.sessionCount) },
      { label: "Langue principale", value: input.primaryLanguage ?? "Non disponible" },
    ],
  };
}

export function buildUsageReport(input: {
  studentCount: number;
  sessionsCurrent: number;
  sessionsPrevious: number;
  wordsCurrent: number;
  wordsPrevious: number;
  dictationRetainedCurrent: number;
  dictationSeenCurrent: number;
  dictationRetainedBaseline: number;
  dictationSeenBaseline: number;
  modes: readonly { mode: string | null; sessions: number }[];
  languages: readonly { label: string | null; words: number }[];
  activeGoals: readonly { goal: number; words: number }[];
  chosenGoals: readonly { goal: number; students: number }[];
}): UsageReport {
  const goals = summarizeWeeklyGoals(input.activeGoals, input.chosenGoals);
  const dictation = dictationPresentation(
    dictationSuccessPercent(input.dictationRetainedCurrent, input.dictationSeenCurrent),
    dictationSuccessPercent(input.dictationRetainedBaseline, input.dictationSeenBaseline),
  );
  return {
    periodLabel: USAGE_PERIOD_LABEL,
    studentCount: input.studentCount,
    sessions: {
      value: input.sessionsCurrent,
      hint: countDeltaHint(countDelta(input.sessionsCurrent, input.sessionsPrevious)),
    },
    words: {
      value: input.wordsCurrent,
      hint: countDeltaHint(countDelta(input.wordsCurrent, input.wordsPrevious)),
    },
    dictation,
    modes: groupModeShares(input.modes),
    languages: groupLanguageShares(input.languages),
    goals: {
      historyAvailable: false,
      percent: goals.percent,
      activeStudents: goals.activeStudents,
      reachedStudents: goals.reachedStudents,
      mostChosenLabel: goals.mostChosen ? mostChosenGoalLabel(goals.mostChosen) : null,
      historyNote: GOAL_HISTORY_NOTE,
    },
  };
}

function csvSafe(value: string): string {
  if (/^[=+\-@\t\r]/.test(value)) return `'${value}`;
  return value;
}

export function studentCsv(rows: readonly StudentFacts[], now: Date, promoCodesAvailable: boolean): string {
  const lines = rows.map((facts) => {
    const item = toListItem(facts, now, promoCodesAvailable);
    return [
      csvSafe(item.name ?? "Non disponible"),
      csvSafe(item.email),
      item.statusLabel,
      formatCsvDate(facts.signedUpAt),
      facts.lastActivityAt ? formatCsvDate(facts.lastActivityAt) : "Aucune révision",
      String(facts.listCount),
      String(facts.streak),
      item.codeLabel,
    ];
  });
  return toCsv([[...STUDENT_CSV_HEADERS], ...lines]);
}

export function missingStudentsTable(error: unknown): "promo" | "cancellation" | null {
  if (isMissingPromoTable(error)) return "promo";
  if (isCancellationStorageUnavailable(error)) return "cancellation";
  const text = errorText(error);
  if (/no such table/i.test(text) && /promo_code/i.test(text)) return "promo";
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readCount(value: unknown): number | null {
  const parsed = readNumber(value);
  if (parsed == null || !Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
}

export function parseStudentList(data: unknown): StudentListResponse | null {
  if (!isRecord(data) || !isRecord(data.counts) || !Array.isArray(data.students)) return null;
  const all = readCount(data.counts.all);
  const trial = readCount(data.counts.trial);
  const subscribed = readCount(data.counts.subscribed);
  const inactive = readCount(data.counts.inactive);
  const page = readCount(data.page);
  const pageSize = readCount(data.pageSize);
  const total = readCount(data.total);
  if (
    all == null ||
    trial == null ||
    subscribed == null ||
    inactive == null ||
    page == null ||
    pageSize == null ||
    total == null ||
    typeof data.promoCodesAvailable !== "boolean" ||
    typeof data.cancellationsAvailable !== "boolean"
  ) {
    return null;
  }
  const students: StudentListItem[] = [];
  for (const row of data.students) {
    if (!isRecord(row)) return null;
    const status = row.status;
    if (typeof status !== "string" || !isStudentStatus(status)) return null;
    if (
      typeof row.id !== "string" ||
      (row.name != null && typeof row.name !== "string") ||
      typeof row.email !== "string" ||
      typeof row.initial !== "string" ||
      typeof row.statusLabel !== "string" ||
      typeof row.signedUpLabel !== "string" ||
      typeof row.lastActivityLabel !== "string" ||
      typeof row.listLabel !== "string" ||
      typeof row.streakLabel !== "string" ||
      typeof row.codeLabel !== "string"
    ) {
      return null;
    }
    students.push({
      id: row.id,
      name: typeof row.name === "string" ? row.name : null,
      email: row.email,
      initial: row.initial,
      status,
      statusLabel: row.statusLabel,
      signedUpLabel: row.signedUpLabel,
      lastActivityLabel: row.lastActivityLabel,
      listLabel: row.listLabel,
      streakLabel: row.streakLabel,
      codeLabel: row.codeLabel,
    });
  }
  return {
    counts: { all, trial, subscribed, inactive },
    promoCodesAvailable: data.promoCodesAvailable,
    cancellationsAvailable: data.cancellationsAvailable,
    page,
    pageSize,
    total,
    students,
  };
}

export function parseStudentSheet(data: unknown): StudentSheet | null {
  if (!isRecord(data) || !Array.isArray(data.fields)) return null;
  const status = data.status;
  if (typeof status !== "string" || !isStudentStatus(status)) return null;
  if (
    typeof data.id !== "string" ||
    typeof data.initial !== "string" ||
    (data.name != null && typeof data.name !== "string") ||
    typeof data.email !== "string" ||
    typeof data.statusLabel !== "string" ||
    (data.statusDetail != null && typeof data.statusDetail !== "string") ||
    (data.promoCode != null && typeof data.promoCode !== "string") ||
    typeof data.promoCodesAvailable !== "boolean"
  ) {
    return null;
  }
  const fields: { label: string; value: string }[] = [];
  for (const field of data.fields) {
    if (!isRecord(field) || typeof field.label !== "string" || typeof field.value !== "string") return null;
    fields.push({ label: field.label, value: field.value });
  }
  if (fields.length === 0) return null;
  return {
    id: data.id,
    initial: data.initial,
    name: typeof data.name === "string" ? data.name : null,
    email: data.email,
    status,
    statusLabel: data.statusLabel,
    statusDetail: typeof data.statusDetail === "string" ? data.statusDetail : null,
    promoCode: typeof data.promoCode === "string" ? data.promoCode : null,
    promoCodesAvailable: data.promoCodesAvailable,
    fields,
  };
}

function parseShareRows(value: unknown): ShareRow[] | null {
  if (!Array.isArray(value)) return null;
  const rows: ShareRow[] = [];
  for (const row of value) {
    if (!isRecord(row) || typeof row.label !== "string") return null;
    const percent = readCount(row.percent);
    if (percent == null || percent > 100) return null;
    rows.push({ label: row.label, percent });
  }
  return rows;
}

export function parseUsageReport(data: unknown): UsageReport | null {
  if (!isRecord(data) || !isRecord(data.sessions) || !isRecord(data.words) || !isRecord(data.dictation)) {
    return null;
  }
  if (!isRecord(data.goals)) return null;
  const studentCount = readCount(data.studentCount);
  const sessions = readCount(data.sessions.value);
  const words = readCount(data.words.value);
  const dictationPercent = data.dictation.percent == null ? null : readCount(data.dictation.percent);
  const goalPercent = data.goals.percent == null ? null : readCount(data.goals.percent);
  const activeStudents = readCount(data.goals.activeStudents);
  const reachedStudents = readCount(data.goals.reachedStudents);
  const modes = parseShareRows(data.modes);
  const languages = parseShareRows(data.languages);
  if (
    data.periodLabel !== USAGE_PERIOD_LABEL ||
    studentCount == null ||
    sessions == null ||
    words == null ||
    (data.dictation.percent != null && dictationPercent == null) ||
    typeof data.sessions.hint !== "string" ||
    typeof data.words.hint !== "string" ||
    typeof data.dictation.hint !== "string" ||
    modes == null ||
    languages == null ||
    data.goals.historyAvailable !== false ||
    (data.goals.percent != null && goalPercent == null) ||
    activeStudents == null ||
    reachedStudents == null ||
    (data.goals.mostChosenLabel != null && typeof data.goals.mostChosenLabel !== "string") ||
    typeof data.goals.historyNote !== "string"
  ) {
    return null;
  }
  return {
    periodLabel: USAGE_PERIOD_LABEL,
    studentCount,
    sessions: { value: sessions, hint: data.sessions.hint },
    words: { value: words, hint: data.words.hint },
    dictation: { percent: dictationPercent, hint: data.dictation.hint },
    modes,
    languages,
    goals: {
      historyAvailable: false,
      percent: goalPercent,
      activeStudents,
      reachedStudents,
      mostChosenLabel: typeof data.goals.mostChosenLabel === "string" ? data.goals.mostChosenLabel : null,
      historyNote: data.goals.historyNote,
    },
  };
}
