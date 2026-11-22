const DEFAULT_APP_PATH = "/app";
const REJOINDRE_PATH = /^\/rejoindre\/LX-[A-Z0-9]{4,16}$/;

/**
 * Valide un callback post-connexion : chemin /app, ou lien d'invitation /rejoindre/LX-…
 */
export function getSafeAppCallbackUrl(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_APP_PATH;
  const trimmed = raw.trim();
  if (trimmed.startsWith("//")) return DEFAULT_APP_PATH;
  if (trimmed.includes("://") || trimmed.includes("\\") || trimmed.includes("?")) {
    return DEFAULT_APP_PATH;
  }
  if (REJOINDRE_PATH.test(trimmed)) return trimmed;
  if (!trimmed.startsWith("/app")) return DEFAULT_APP_PATH;
  if (!/^\/app(\/.*)?$/.test(trimmed)) return DEFAULT_APP_PATH;
  return trimmed;
}
