const CORE = /^[A-Z0-9]{4,16}$/;

/** `LX-XXXXXX` ou le code nu, en majuscules. Null si le format est inutilisable. */
export function normalizeClassCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().toUpperCase();
  if (!trimmed) return null;
  const core = trimmed.startsWith("LX-") ? trimmed.slice(3) : trimmed;
  if (!CORE.test(core)) return null;
  return `LX-${core}`;
}

/** Identifiant stocké en base, sans le préfixe affiché. */
export function classCodeCore(displayOrRaw: string): string {
  const normalized = normalizeClassCode(displayOrRaw);
  if (!normalized) return "";
  return normalized.slice(3);
}

/** Chemin public d'invitation. Le code doit déjà être normalisé. */
export function classInvitePath(displayCode: string): string {
  return `/rejoindre/${displayCode}`;
}
