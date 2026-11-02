/**
 * Résiliation : motifs, libellés et calculs partagés
 * entre la fenêtre élève, le webhook et l'espace créateur.
 * Aucun accès base ni Stripe ici.
 */

export const CANCELLATION_REASONS = [
  "too_expensive",
  "exam_passed",
  "not_used_enough",
  "missing_feature",
  "technical_issue",
  "other",
] as const;

export type CancellationReason = (typeof CANCELLATION_REASONS)[number];

export const CANCELLATION_PLANS = ["monthly", "annual", "trial"] as const;
export type CancellationPlan = (typeof CANCELLATION_PLANS)[number];

/** Fenêtre élève, vouvoiement, phrases demandées pour la mission. */
export const CANCELLATION_MODAL_LABELS: Record<CancellationReason, string> = {
  too_expensive: "Trop cher",
  exam_passed: "Je n'en ai plus besoin (examen passé)",
  not_used_enough: "Je ne l'utilise pas assez",
  missing_feature: "Il manque une fonctionnalité",
  technical_issue: "J'ai rencontré un problème technique",
  other: "Autre",
};

/** Barres « Pourquoi ils partent », alignées sur la maquette. */
export const CANCELLATION_BAR_LABELS: Record<CancellationReason, string> = {
  too_expensive: "Trop cher",
  exam_passed: "Je n'en ai plus besoin (examen passé)",
  not_used_enough: "Je ne l'utilise pas assez",
  missing_feature: "Il manque une fonctionnalité",
  technical_issue: "Problème technique",
  other: "Autre",
};

/** Pastilles du tableau et cellules du CSV : mêmes libellés. */
export const CANCELLATION_PILL_LABELS: Record<CancellationReason, string> = {
  too_expensive: "Trop cher",
  exam_passed: "Examen passé",
  not_used_enough: "Pas assez utilisé",
  missing_feature: "Fonctionnalité manquante",
  technical_issue: "Problème technique",
  other: "Autre",
};

export const CANCELLATION_PLAN_LABELS: Record<CancellationPlan, string> = {
  monthly: "Mensuel",
  annual: "Annuel",
  trial: "Essai",
};

export const UNSPECIFIED_REASON_LABEL = "Non précisé";

export const CANCELLATION_COMMENT_MAX = 1000;

const PARIS = "Europe/Paris";

export type ChurnReasonKey = CancellationReason | "unspecified";

export const CHURN_REASON_KEYS: readonly ChurnReasonKey[] = [
  ...CANCELLATION_REASONS,
  "unspecified",
];

export type CancellationStamp = {
  userId: string;
  startedAt: Date;
  cancelledAt: Date;
  reason: CancellationReason | null;
};

export type ChurnReasonCount = {
  reason: ChurnReasonKey;
  count: number;
};

export type ChurnSummary = {
  total: number;
  cancellationsThisMonth: number;
  subscribersAtMonthStart: number;
  churnPercent: number | null;
  averageTenureDays: number | null;
  reasons30d: ChurnReasonCount[];
};

export type ChurnDeparture = {
  cancelledAt: string;
  student: string;
  plan: CancellationPlan;
  tenureDays: number;
  reason: CancellationReason | null;
  comment: string | null;
};

export type ChurnDashboard = ChurnSummary & {
  available: true;
  recent: ChurnDeparture[];
};

export type ChurnResponse = { available: false } | ChurnDashboard;

export function isCancellationReason(value: string): value is CancellationReason {
  return (CANCELLATION_REASONS as readonly string[]).includes(value);
}

export function isCancellationPlan(value: string): value is CancellationPlan {
  return (CANCELLATION_PLANS as readonly string[]).includes(value);
}

/** null si le motif est absent. "invalid" si la valeur n'est pas un motif connu. */
export function parseCancellationReason(value: unknown): CancellationReason | null | "invalid" {
  if (value == null || value === "") return null;
  if (typeof value === "string" && isCancellationReason(value)) return value;
  return "invalid";
}

/** null si vide. "invalid" si le type ou la longueur est refusée. */
export function normalizeCancellationComment(value: unknown): string | null | "invalid" {
  if (value == null) return null;
  if (typeof value !== "string") return "invalid";
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > CANCELLATION_COMMENT_MAX) return "invalid";
  return trimmed;
}

export function reasonBarLabel(reason: ChurnReasonKey): string {
  if (reason === "unspecified") return UNSPECIFIED_REASON_LABEL;
  return CANCELLATION_BAR_LABELS[reason];
}

export function reasonPillLabel(reason: CancellationReason | null): string {
  if (!reason) return UNSPECIFIED_REASON_LABEL;
  return CANCELLATION_PILL_LABELS[reason];
}

/**
 * Formule au moment du départ.
 * L'essai prime sur le prix : un essai mensuel reste « essai ».
 * Un abonnement annulé pendant l'essai (canceled_at <= trial_end) aussi.
 */
export function resolveCancellationPlan(input: {
  status: string;
  trialEnd: number | null;
  canceledAt: number | null;
  metadataPlan: string | null;
  interval: string | null;
  pricePlan: "monthly" | "annual" | null;
}): CancellationPlan | null {
  if (input.status === "trialing") return "trial";
  if (
    input.status === "canceled" &&
    input.trialEnd != null &&
    input.canceledAt != null &&
    input.canceledAt <= input.trialEnd
  ) {
    return "trial";
  }
  if (input.pricePlan === "monthly" || input.pricePlan === "annual") return input.pricePlan;
  if (input.metadataPlan === "monthly" || input.metadataPlan === "annual") return input.metadataPlan;
  if (input.interval === "month") return "monthly";
  if (input.interval === "year") return "annual";
  return null;
}

export function churnPercent(parted: number, base: number): number | null {
  if (!Number.isFinite(parted) || !Number.isFinite(base) || base <= 0) return null;
  return Math.round((parted / base) * 100);
}

export function formatChurnPercent(value: number | null): string {
  if (value == null) return "—";
  return `${new Intl.NumberFormat("fr-FR").format(value)}\u00a0%`;
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

export function subscribersAtStartHint(count: number): string {
  if (count <= 0) return "aucun abonné en début de mois";
  if (count === 1) return "sur 1 abonné en début de mois";
  return `sur ${formatCount(count)} abonnés en début de mois`;
}

/** Durée affichée : jours en dessous de 60, mois au-delà. */
export function formatTenureDays(days: number): string {
  if (!Number.isFinite(days) || days < 0.5) return "moins d'un jour";
  const rounded = Math.round(days);
  if (rounded < 60) {
    return rounded === 1 ? "1 jour" : `${formatCount(rounded)} jours`;
  }
  const months = Math.max(1, Math.round(rounded / 30.4375));
  return months === 1 ? "1 mois" : `${formatCount(months)} mois`;
}

export function tenureDaysBetween(startedAt: Date, cancelledAt: Date): number {
  const ms = cancelledAt.getTime() - startedAt.getTime();
  if (!Number.isFinite(ms)) return 0;
  return Math.max(0, ms / 86_400_000);
}

export function studentLabel(firstName: string | null | undefined, email: string): string {
  const name = firstName?.trim();
  if (name) return name;
  return email;
}

export function parisParts(date: Date): { year: number; month: number; day: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: PARIS,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(date);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: read("year"), month: read("month"), day: read("day") };
}

/** 1er du mois civil de Paris, à 00:00, en instant UTC. */
export function parisMonthStart(now: Date): Date {
  const { year, month } = parisParts(now);
  const utcGuess = Date.UTC(year, month - 1, 1, 0, 0, 0);
  const start = new Date(utcGuess - timeZoneOffsetMs(PARIS, new Date(utcGuess)));
  return new Date(utcGuess - timeZoneOffsetMs(PARIS, start));
}

export function formatDepartureDate(date: Date, now = new Date()): string {
  const sameYear = parisParts(date).year === parisParts(now).year;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
    timeZone: PARIS,
  }).format(date);
}

export function formatCsvDate(date: Date): string {
  const { year, month, day } = parisParts(date);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

export function parisDayStamp(date: Date): string {
  const { year, month, day } = parisParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Désabonnements du mois / abonnés en début de mois.
 * L'effectif de début de mois = abonnés encore actifs, en essai ou impayés
 * + départs du mois dont l'abonnement avait commencé avant ce mois
 * et qui ne sont plus dans ces statuts.
 * Un abonné arrivé pendant le mois et encore actif reste dans l'effectif :
 * la date de début n'est pas stockée sur le compte.
 */
export function summarizeCancellations(
  rows: CancellationStamp[],
  subscribedUserIds: ReadonlySet<string>,
  now: Date,
): ChurnSummary {
  const monthStartMs = parisMonthStart(now).getTime();
  const since30Ms = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const departedStillGone = new Set<string>();
  let cancellationsThisMonth = 0;
  let tenureDays = 0;
  const reasonCounts = new Map<ChurnReasonKey, number>(
    CHURN_REASON_KEYS.map((key) => [key, 0]),
  );

  for (const row of rows) {
    tenureDays += tenureDaysBetween(row.startedAt, row.cancelledAt);
    const cancelledMs = row.cancelledAt.getTime();
    if (cancelledMs >= monthStartMs) {
      cancellationsThisMonth += 1;
      if (row.startedAt.getTime() < monthStartMs && !subscribedUserIds.has(row.userId)) {
        departedStillGone.add(row.userId);
      }
    }
    if (cancelledMs >= since30Ms) {
      const key: ChurnReasonKey = row.reason ?? "unspecified";
      reasonCounts.set(key, (reasonCounts.get(key) ?? 0) + 1);
    }
  }

  const subscribersAtMonthStart = subscribedUserIds.size + departedStillGone.size;
  return {
    total: rows.length,
    cancellationsThisMonth,
    subscribersAtMonthStart,
    churnPercent: churnPercent(cancellationsThisMonth, subscribersAtMonthStart),
    averageTenureDays: rows.length === 0 ? null : tenureDays / rows.length,
    reasons30d: CHURN_REASON_KEYS.map((reason) => ({
      reason,
      count: reasonCounts.get(reason) ?? 0,
    })),
  };
}

export const CHURN_CSV_HEADERS = [
  "Date",
  "Élève",
  "Plan",
  "Durée",
  "Motif",
  "Un mot laissé",
] as const;

export function departureToCsvRow(row: ChurnDeparture): string[] {
  const cancelledAt = new Date(row.cancelledAt);
  return [
    Number.isNaN(cancelledAt.getTime()) ? "" : formatCsvDate(cancelledAt),
    row.student,
    CANCELLATION_PLAN_LABELS[row.plan],
    formatTenureDays(row.tenureDays),
    reasonPillLabel(row.reason),
    row.comment ?? "",
  ];
}

export function toCsv(rows: string[][]): string {
  const lines = rows.map((line) => line.map(csvCell).join(","));
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export function errorText(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (current instanceof Error) {
      parts.push(current.message);
      current = current.cause;
    } else {
      parts.push(String(current));
      break;
    }
  }
  return parts.join(" ");
}

export function isCancellationStorageUnavailable(error: unknown): boolean {
  const text = errorText(error);
  return /no such table/i.test(text) && /cancellation_feedback/i.test(text);
}

export function isCancellationUniqueConflict(error: unknown): boolean {
  const text = errorText(error);
  return /unique constraint failed/i.test(text) && /cancellation_feedback/i.test(text);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseChurnResponse(data: unknown): ChurnResponse | null {
  if (!isRecord(data) || typeof data.available !== "boolean") return null;
  if (data.available === false) return { available: false };
  const total = readCount(data.total);
  const cancellationsThisMonth = readCount(data.cancellationsThisMonth);
  const subscribersAtMonthStart = readCount(data.subscribersAtMonthStart);
  const churn = readOptionalCount(data.churnPercent);
  const average = readOptionalDays(data.averageTenureDays);
  if (
    total === null ||
    cancellationsThisMonth === null ||
    subscribersAtMonthStart === null ||
    churn === "invalid" ||
    average === "invalid" ||
    !Array.isArray(data.reasons30d) ||
    !Array.isArray(data.recent)
  ) {
    return null;
  }

  const reasons30d: ChurnReasonCount[] = [];
  for (const row of data.reasons30d) {
    if (!isRecord(row) || typeof row.reason !== "string") return null;
    if (!(CHURN_REASON_KEYS as readonly string[]).includes(row.reason)) return null;
    const count = readCount(row.count);
    if (count === null) return null;
    reasons30d.push({ reason: row.reason as ChurnReasonKey, count });
  }

  const recent: ChurnDeparture[] = [];
  for (const row of data.recent) {
    if (!isRecord(row)) return null;
    if (typeof row.cancelledAt !== "string" || typeof row.student !== "string") return null;
    if (typeof row.plan !== "string" || !isCancellationPlan(row.plan)) return null;
    const tenureDays = readOptionalDays(row.tenureDays);
    if (tenureDays === "invalid" || tenureDays === null) return null;
    const reason = parseCancellationReason(row.reason);
    if (reason === "invalid") return null;
    if (row.comment != null && typeof row.comment !== "string") return null;
    recent.push({
      cancelledAt: row.cancelledAt,
      student: row.student,
      plan: row.plan,
      tenureDays,
      reason,
      comment: row.comment ?? null,
    });
  }

  return {
    available: true,
    total,
    cancellationsThisMonth,
    subscribersAtMonthStart,
    churnPercent: churn,
    averageTenureDays: average,
    reasons30d,
    recent,
  };
}

function readCount(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) return null;
  return value;
}

function readOptionalCount(value: unknown): number | null | "invalid" {
  if (value == null) return null;
  const count = readCount(value);
  return count === null ? "invalid" : count;
}

function readOptionalDays(value: unknown): number | null | "invalid" {
  if (value == null) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return "invalid";
  return value;
}

function timeZoneOffsetMs(timeZone: string, date: Date): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - date.getTime();
}

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
