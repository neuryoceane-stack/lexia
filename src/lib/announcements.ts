import { KNOWN_LANGUAGE_CODES, PREFERRED_LANGUAGE_OPTIONS } from "@/lib/language";

export const ANNOUNCEMENT_TYPES = ["news", "info", "important"] as const;
export type AnnouncementType = (typeof ANNOUNCEMENT_TYPES)[number];

export const ANNOUNCEMENT_AUDIENCES = ["all", "trial", "subscribers", "language"] as const;
export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number];

export const ANNOUNCEMENT_STATUSES = ["draft", "published"] as const;
export type AnnouncementStatus = (typeof ANNOUNCEMENT_STATUSES)[number];

export const ANNOUNCEMENT_PHASES = ["draft", "scheduled", "live", "ended"] as const;
export type AnnouncementPhase = (typeof ANNOUNCEMENT_PHASES)[number];

export const ANNOUNCEMENT_MESSAGE_MAX = 140;
export const ANNOUNCEMENT_LINK_LABEL_MAX = 80;
export const ANNOUNCEMENT_LINK_URL_MAX = 500;

export const ANNOUNCEMENTS_TABLES_MISSING = "Les annonces ne sont pas encore en place.";
export const ANNOUNCEMENT_NOT_FOUND = "Cette annonce est introuvable.";
export const ANNOUNCEMENT_NOT_DISMISSIBLE = "Cette annonce ne peut pas être fermée.";
export const ANNOUNCEMENT_NOT_VISIBLE = "Cette annonce n'est plus affichée.";

const PARIS = "Europe/Paris";

export class AnnouncementError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AnnouncementError";
    this.status = status;
  }
}

export const ANNOUNCEMENT_TYPE_LABELS: Record<AnnouncementType, string> = {
  news: "Nouveauté",
  info: "Information",
  important: "Important",
};

export const ANNOUNCEMENT_AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  all: "Tous les élèves",
  trial: "En essai",
  subscribers: "Abonnés",
  language: "Une langue",
};

export const ANNOUNCEMENT_PHASE_LABELS: Record<AnnouncementPhase, string> = {
  draft: "Brouillon",
  scheduled: "Planifiée",
  live: "Publiée",
  ended: "Terminée",
};

export type AnnouncementDraft = {
  type: AnnouncementType;
  message: string;
  linkLabel: string | null;
  linkUrl: string | null;
  audience: AnnouncementAudience;
  languageCode: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  dismissible: boolean;
  status: AnnouncementStatus;
};

export type AnnouncementRecord = AnnouncementDraft & {
  id: string;
  createdAt: Date;
};

export type StudentAudience = {
  subscriptionStatus: string;
  languageCodes: readonly string[];
};

export type StudentBanner = {
  id: string;
  type: AnnouncementType;
  message: string;
  linkLabel: string | null;
  linkUrl: string | null;
  dismissible: boolean;
};

export type AnnouncementListItem = {
  id: string;
  type: AnnouncementType;
  typeLabel: string;
  message: string;
  linkLabel: string | null;
  linkUrl: string | null;
  audience: AnnouncementAudience;
  languageCode: string | null;
  audienceLabel: string;
  startsAt: string | null;
  endsAt: string | null;
  startsInput: string;
  endsInput: string;
  scheduleLabel: string;
  dismissible: boolean;
  status: AnnouncementStatus;
  phase: AnnouncementPhase;
  phaseLabel: string;
  createdAt: string;
};

export function messageCounterLabel(length: number): string {
  const noun = length === 1 ? "caractère" : "caractères";
  return `${length} ${noun} sur ${ANNOUNCEMENT_MESSAGE_MAX}`;
}

export function announcementMessageLength(message: string): number {
  return [...message].length;
}

export function clampAnnouncementMessage(message: string): string {
  const chars = [...message];
  if (chars.length <= ANNOUNCEMENT_MESSAGE_MAX) return message;
  return chars.slice(0, ANNOUNCEMENT_MESSAGE_MAX).join("");
}

export function languageName(code: string): string {
  return PREFERRED_LANGUAGE_OPTIONS.find((option) => option.value === code)?.label ?? code;
}

export function audienceLabel(audience: AnnouncementAudience, languageCode: string | null): string {
  if (audience === "language" && languageCode) return languageName(languageCode);
  return ANNOUNCEMENT_AUDIENCE_LABELS[audience];
}

/** Heure de Paris, « 2 nov. 2026, 21:00 ». */
export function formatParisDateTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PARIS,
  }).format(date);
}

/** Valeur `datetime-local`, lue et affichée comme l'heure de Paris. */
export function formatParisInput(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PARIS,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  const hour = String(Number(map.hour) % 24).padStart(2, "0");
  return `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}`;
}

/**
 * Interprète « 2026-11-02T21:00 » comme l'heure de Paris.
 * Retourne null si la date n'existe pas (changement d'heure).
 */
export function parseParisDateTime(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (month < 1 || month > 12 || hour > 23 || minute > 59) return null;
  const calendar = new Date(Date.UTC(year, month - 1, day));
  if (
    calendar.getUTCFullYear() !== year ||
    calendar.getUTCMonth() !== month - 1 ||
    calendar.getUTCDate() !== day
  ) {
    return null;
  }
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let instant = localAsUtc - timeZoneOffsetMs(new Date(localAsUtc), PARIS);
  instant = localAsUtc - timeZoneOffsetMs(new Date(instant), PARIS);
  const result = new Date(instant);
  if (formatParisInput(result) !== value) return null;
  return result;
}

export function scheduleLabel(startsAt: Date | null, endsAt: Date | null): string {
  if (!startsAt && !endsAt) return "Sans limite de dates";
  if (startsAt && endsAt) {
    return `Du ${formatParisDateTime(startsAt)} au ${formatParisDateTime(endsAt)}`;
  }
  if (startsAt) return `À partir du ${formatParisDateTime(startsAt)}`;
  return `Jusqu'au ${formatParisDateTime(endsAt as Date)}`;
}

export function announcementPhase(record: Pick<AnnouncementRecord, "status" | "startsAt" | "endsAt">, now: Date): AnnouncementPhase {
  if (record.status === "draft") return "draft";
  if (record.startsAt && record.startsAt.getTime() > now.getTime()) return "scheduled";
  if (record.endsAt && record.endsAt.getTime() <= now.getTime()) return "ended";
  return "live";
}

export function isAnnouncementInWindow(
  record: Pick<AnnouncementRecord, "startsAt" | "endsAt">,
  now: Date,
): boolean {
  if (record.startsAt && record.startsAt.getTime() > now.getTime()) return false;
  if (record.endsAt && record.endsAt.getTime() <= now.getTime()) return false;
  return true;
}

export function announcementMatchesStudent(record: Pick<AnnouncementRecord, "audience" | "languageCode">, student: StudentAudience): boolean {
  switch (record.audience) {
    case "all":
      return true;
    case "trial":
      return student.subscriptionStatus === "trialing";
    case "subscribers":
      return student.subscriptionStatus === "active";
    case "language": {
      if (!record.languageCode) return false;
      const wanted = record.languageCode.toLowerCase();
      return student.languageCodes.some((code) => code.toLowerCase() === wanted);
    }
    default: {
      const unexpected: never = record.audience;
      return unexpected === undefined;
    }
  }
}

/**
 * Annonce affichée : publiée, dans les dates, pour cet élève.
 * Important passe avant les autres, puis la plus récente.
 * Les annonces déjà fermées ne doivent pas être passées ici.
 */
export function pickActiveAnnouncement(
  rows: readonly AnnouncementRecord[],
  student: StudentAudience,
  now: Date,
): AnnouncementRecord | null {
  const eligible = rows.filter(
    (row) =>
      row.status === "published" &&
      isAnnouncementInWindow(row, now) &&
      announcementMatchesStudent(row, student),
  );
  eligible.sort((a, b) => {
    const rank = (type: AnnouncementType) => (type === "important" ? 0 : 1);
    const byType = rank(a.type) - rank(b.type);
    if (byType !== 0) return byType;
    const byDate = b.createdAt.getTime() - a.createdAt.getTime();
    if (byDate !== 0) return byDate;
    return a.id < b.id ? -1 : 1;
  });
  return eligible[0] ?? null;
}

export function toStudentBanner(record: AnnouncementRecord): StudentBanner {
  const link = record.linkUrl ? safeAnnouncementLink(record.linkUrl) : null;
  return {
    id: record.id,
    type: record.type,
    message: record.message,
    linkLabel: link && record.linkLabel ? record.linkLabel : null,
    linkUrl: link && record.linkLabel ? link : null,
    dismissible: record.dismissible,
  };
}

export function toAnnouncementListItem(record: AnnouncementRecord, now: Date): AnnouncementListItem {
  const phase = announcementPhase(record, now);
  const link = record.linkUrl ? safeAnnouncementLink(record.linkUrl) : null;
  return {
    id: record.id,
    type: record.type,
    typeLabel: ANNOUNCEMENT_TYPE_LABELS[record.type],
    message: record.message,
    linkLabel: link && record.linkLabel ? record.linkLabel : null,
    linkUrl: link && record.linkLabel ? link : null,
    audience: record.audience,
    languageCode: record.languageCode,
    audienceLabel: audienceLabel(record.audience, record.languageCode),
    startsAt: record.startsAt ? record.startsAt.toISOString() : null,
    endsAt: record.endsAt ? record.endsAt.toISOString() : null,
    startsInput: record.startsAt ? formatParisInput(record.startsAt) : "",
    endsInput: record.endsAt ? formatParisInput(record.endsAt) : "",
    scheduleLabel: scheduleLabel(record.startsAt, record.endsAt),
    dismissible: record.dismissible,
    status: record.status,
    phase,
    phaseLabel: ANNOUNCEMENT_PHASE_LABELS[phase],
    createdAt: record.createdAt.toISOString(),
  };
}

/**
 * Chemin interne `/app` ou `/app/…`, ou adresse https.
 * Tout autre schéma (javascript:, data:, http:, //…) est refusé.
 */
export function safeAnnouncementLink(raw: string): string | null {
  if (/[\u0000-\u001F\u007F\u2028\u2029]/.test(raw) || raw.includes("\\")) return null;
  const value = raw.trim();
  if (!value || value.length > ANNOUNCEMENT_LINK_URL_MAX) return null;

  if (value.startsWith("/")) {
    if (!value.startsWith("/app/") && value !== "/app") return null;
    if (value.includes("//")) return null;
    let url: URL;
    try {
      url = new URL(value, "https://lexiva.invalid");
    } catch {
      return null;
    }
    if (url.origin !== "https://lexiva.invalid") return null;
    if (url.username || url.password) return null;
    if (url.pathname !== "/app" && !url.pathname.startsWith("/app/")) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (!url.hostname) return null;
  return url.toString();
}

export function parseAnnouncementDraft(
  body: unknown,
  now: Date,
): { ok: true; draft: AnnouncementDraft } | { ok: false; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Requête invalide." };
  }
  const record = body as Record<string, unknown>;

  if (!isAnnouncementType(record.type)) {
    return { ok: false, message: "Choisissez un type : Nouveauté, Information ou Important." };
  }
  if (typeof record.message !== "string") {
    return { ok: false, message: "Indiquez un message." };
  }
  const message = record.message.replace(/\r\n/g, "\n").trim();
  if (!message) return { ok: false, message: "Indiquez un message." };
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(message)) {
    return { ok: false, message: "Le message contient des caractères non affichés." };
  }
  if (announcementMessageLength(message) > ANNOUNCEMENT_MESSAGE_MAX) {
    return { ok: false, message: `Le message dépasse ${ANNOUNCEMENT_MESSAGE_MAX} caractères.` };
  }

  const link = readLinkPair(record.linkLabel, record.linkUrl);
  if (!link.ok) return link;

  if (!isAnnouncementAudience(record.audience)) {
    return { ok: false, message: "Choisissez qui verra cette annonce." };
  }
  let languageCode: string | null = null;
  if (record.audience === "language") {
    if (typeof record.languageCode !== "string" || record.languageCode.trim() === "") {
      return { ok: false, message: "Indiquez la langue." };
    }
    languageCode = record.languageCode.trim().toLowerCase();
    if (!KNOWN_LANGUAGE_CODES.has(languageCode)) {
      return { ok: false, message: "Cette langue n'est pas proposée." };
    }
  }

  const startsAt = readOptionalInstant(record.startsAt, "début");
  if (!startsAt.ok) return startsAt;
  const endsAt = readOptionalInstant(record.endsAt, "fin");
  if (!endsAt.ok) return endsAt;
  if (startsAt.value && endsAt.value && endsAt.value.getTime() <= startsAt.value.getTime()) {
    return { ok: false, message: "La fin est antérieure au début." };
  }

  if (typeof record.dismissible !== "boolean") {
    return { ok: false, message: "Indiquez si les élèves peuvent fermer l'annonce." };
  }
  if (!isAnnouncementStatus(record.status)) {
    return { ok: false, message: "Choisissez un statut : brouillon ou publiée." };
  }
  if (record.status === "published" && endsAt.value && endsAt.value.getTime() <= now.getTime()) {
    return {
      ok: false,
      message: "Cette annonce est déjà terminée. Choisissez une fin à venir, ou enregistrez-la en brouillon.",
    };
  }

  return {
    ok: true,
    draft: {
      type: record.type,
      message,
      linkLabel: link.label,
      linkUrl: link.url,
      audience: record.audience,
      languageCode,
      startsAt: startsAt.value,
      endsAt: endsAt.value,
      dismissible: record.dismissible,
      status: record.status,
    },
  };
}

export function parseAnnouncementList(data: unknown): AnnouncementListItem[] | null {
  if (!isRecord(data) || !Array.isArray(data.announcements)) return null;
  const items: AnnouncementListItem[] = [];
  for (const row of data.announcements) {
    const item = parseAnnouncementListItem(row);
    if (!item) return null;
    items.push(item);
  }
  return items;
}

export function isMissingAnnouncementTable(error: unknown): boolean {
  const text = errorText(error);
  return (
    /no such table:\s*announcements\b/i.test(text) ||
    /no such table:\s*announcement_dismissals\b/i.test(text)
  );
}

export function isAnnouncementUniqueConflict(error: unknown): boolean {
  const text = errorText(error);
  if (!/unique constraint failed|SQLITE_CONSTRAINT_UNIQUE/i.test(text)) return false;
  return /announcement_dismissals/i.test(text);
}

function parseAnnouncementListItem(row: unknown): AnnouncementListItem | null {
  if (!isRecord(row)) return null;
  if (typeof row.id !== "string" || !isAnnouncementType(row.type) || typeof row.typeLabel !== "string") {
    return null;
  }
  if (typeof row.message !== "string" || !isAnnouncementAudience(row.audience)) return null;
  if (typeof row.audienceLabel !== "string" || typeof row.scheduleLabel !== "string") return null;
  if (typeof row.dismissible !== "boolean" || !isAnnouncementStatus(row.status)) return null;
  if (!isAnnouncementPhase(row.phase) || typeof row.phaseLabel !== "string") return null;
  if (typeof row.startsInput !== "string" || typeof row.endsInput !== "string") return null;
  if (typeof row.createdAt !== "string") return null;
  const linkLabel = readNullableString(row.linkLabel);
  const linkUrl = readNullableString(row.linkUrl);
  const languageCode = readNullableString(row.languageCode);
  const startsAt = readNullableString(row.startsAt);
  const endsAt = readNullableString(row.endsAt);
  if (
    linkLabel === undefined ||
    linkUrl === undefined ||
    languageCode === undefined ||
    startsAt === undefined ||
    endsAt === undefined
  ) {
    return null;
  }
  return {
    id: row.id,
    type: row.type,
    typeLabel: row.typeLabel,
    message: row.message,
    linkLabel,
    linkUrl,
    audience: row.audience,
    languageCode,
    audienceLabel: row.audienceLabel,
    startsAt,
    endsAt,
    startsInput: row.startsInput,
    endsInput: row.endsInput,
    scheduleLabel: row.scheduleLabel,
    dismissible: row.dismissible,
    status: row.status,
    phase: row.phase,
    phaseLabel: row.phaseLabel,
    createdAt: row.createdAt,
  };
}

function readLinkPair(
  labelRaw: unknown,
  urlRaw: unknown,
): { ok: true; label: string | null; url: string | null } | { ok: false; message: string } {
  const label = readOptionalText(labelRaw);
  const url = readOptionalText(urlRaw);
  if (label === "invalid" || url === "invalid") {
    return { ok: false, message: "Requête invalide." };
  }
  if (!label && !url) return { ok: true, label: null, url: null };
  if (!label || !url) {
    return {
      ok: false,
      message: "Indiquez le texte du lien et son adresse, ou laissez les deux vides.",
    };
  }
  if (announcementMessageLength(label) > ANNOUNCEMENT_LINK_LABEL_MAX) {
    return { ok: false, message: `Le texte du lien dépasse ${ANNOUNCEMENT_LINK_LABEL_MAX} caractères.` };
  }
  if (/[\u0000-\u001F\u007F]/.test(label)) {
    return { ok: false, message: "Le texte du lien contient des caractères non affichés." };
  }
  const safe = safeAnnouncementLink(url);
  if (!safe) {
    return {
      ok: false,
      message: "L'adresse du lien n'est pas acceptée. Utilisez un chemin /app/… ou une adresse https://.",
    };
  }
  return { ok: true, label, url: safe };
}

function readOptionalText(value: unknown): string | null | "invalid" {
  if (value == null) return null;
  if (typeof value !== "string") return "invalid";
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function readOptionalInstant(
  value: unknown,
  field: "début" | "fin",
): { ok: true; value: Date | null } | { ok: false; message: string } {
  if (value == null || value === "") return { ok: true, value: null };
  if (typeof value !== "string") {
    return { ok: false, message: `Indiquez une date de ${field} valide, à l'heure de Paris.` };
  }
  const trimmed = value.trim();
  if (trimmed === "") return { ok: true, value: null };
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    const parsed = parseParisDateTime(trimmed);
    if (!parsed) {
      return { ok: false, message: `Indiquez une date de ${field} valide, à l'heure de Paris.` };
    }
    return { ok: true, value: parsed };
  }
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(trimmed)) {
    return { ok: false, message: `Indiquez une date de ${field} valide, à l'heure de Paris.` };
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return { ok: false, message: `Indiquez une date de ${field} valide, à l'heure de Paris.` };
  }
  return { ok: true, value: parsed };
}

function readNullableString(value: unknown): string | null | undefined {
  if (value == null) return null;
  if (typeof value === "string") return value;
  return undefined;
}

function isAnnouncementType(value: unknown): value is AnnouncementType {
  return typeof value === "string" && (ANNOUNCEMENT_TYPES as readonly string[]).includes(value);
}

function isAnnouncementAudience(value: unknown): value is AnnouncementAudience {
  return typeof value === "string" && (ANNOUNCEMENT_AUDIENCES as readonly string[]).includes(value);
}

function isAnnouncementStatus(value: unknown): value is AnnouncementStatus {
  return typeof value === "string" && (ANNOUNCEMENT_STATUSES as readonly string[]).includes(value);
}

function isAnnouncementPhase(value: unknown): value is AnnouncementPhase {
  return typeof value === "string" && (ANNOUNCEMENT_PHASES as readonly string[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const floored = new Date(Math.floor(date.getTime() / 1000) * 1000);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(floored);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour) % 24,
    Number(map.minute),
    Number(map.second),
  );
  return asUtc - floored.getTime();
}

function errorText(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (current instanceof Error) {
      parts.push(current.message);
      const code = (current as { code?: unknown }).code;
      if (typeof code === "string") parts.push(code);
      current = current.cause;
    } else if (typeof current === "object") {
      const record = current as { message?: unknown; code?: unknown; cause?: unknown };
      if (typeof record.message === "string") parts.push(record.message);
      if (typeof record.code === "string") parts.push(record.code);
      current = record.cause;
    } else {
      parts.push(String(current));
      break;
    }
  }
  return parts.join(" ");
}
