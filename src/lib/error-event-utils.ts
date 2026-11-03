import { createHash } from "crypto";

const MESSAGE_MAX = 300;

const EMAIL_PATTERN =
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const JWT_PATTERN = /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g;
const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
/** Jetons hex longs (au moins un chiffre pour ne pas confondre avec du texte). */
const LONG_HEX_PATTERN = /\b(?=[0-9a-f]*[0-9])[0-9a-f]{32,}\b/gi;
/** Identifiants type nanoid (21 caractères). */
const NANOID_PATTERN = /\b[A-Za-z0-9_-]{21}\b/g;
const BEARER_PATTERN = /Bearer\s+\S+/gi;
const QUERY_IN_TEXT_PATTERN = /\?[^\s'"]+/g;
const NUMBER_PATTERN = /\b\d+(?:\.\d+)?\b/g;

export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Erreur inconnue";
  }
}

/** Nettoie un message avant stockage (aucune donnée personnelle ni jeton). */
export function sanitizeErrorMessage(raw: string): string {
  let text = raw.replace(/\s+/g, " ").trim();
  text = text.replace(EMAIL_PATTERN, "<email>");
  text = text.replace(JWT_PATTERN, "<token>");
  text = text.replace(BEARER_PATTERN, "Bearer <token>");
  text = text.replace(UUID_PATTERN, "<id>");
  text = text.replace(LONG_HEX_PATTERN, "<token>");
  text = text.replace(NANOID_PATTERN, "<id>");
  text = text.replace(QUERY_IN_TEXT_PATTERN, "");
  text = text.replace(NUMBER_PATTERN, "<n>");
  if (text.length > MESSAGE_MAX) {
    return text.slice(0, MESSAGE_MAX);
  }
  return text;
}

/** Normalise le message pour le regroupement (fingerprint). */
export function normalizeMessageForFingerprint(sanitizedMessage: string): string {
  return sanitizedMessage.toLowerCase().replace(/\s+/g, " ").trim();
}

export function routeWithoutQuery(path: string): string {
  const trimmed = path.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      return new URL(trimmed).pathname;
    } catch {
      return trimmed.split("?")[0] ?? trimmed;
    }
  }
  return trimmed.split("?")[0] ?? trimmed;
}

export function buildErrorFingerprint(
  route: string,
  method: string | null | undefined,
  normalizedMessage: string,
): string {
  const safeRoute = routeWithoutQuery(route);
  const payload = `${(method ?? "UNKNOWN").toUpperCase()}\0${safeRoute}\0${normalizedMessage}`;
  return createHash("sha256").update(payload).digest("hex");
}

export function nextReviewStatusOnRecurrence(
  current: "new" | "to_check" | "fixed",
): "new" | "to_check" | "fixed" {
  if (current === "fixed") return "new";
  return current;
}

export function isMissingTechHealthTable(error: unknown): boolean {
  const text = error instanceof Error ? error.message : String(error);
  const cause =
    error instanceof Error && error.cause instanceof Error ? error.cause.message : "";
  const combined = `${text} ${cause}`;
  if (!/no such table/i.test(combined)) return false;
  return /error_events/i.test(combined) || /email_events/i.test(combined);
}
