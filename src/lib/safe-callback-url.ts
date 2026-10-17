const DEFAULT_APP_PATH = "/app";

/**
 * Valide un callback post-connexion : chemin relatif commençant par /app uniquement.
 */
export function getSafeAppCallbackUrl(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_APP_PATH;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/app")) return DEFAULT_APP_PATH;
  if (trimmed.startsWith("//")) return DEFAULT_APP_PATH;
  if (trimmed.includes("://") || trimmed.includes("\\")) return DEFAULT_APP_PATH;
  if (!/^\/app(\/.*)?$/.test(trimmed)) return DEFAULT_APP_PATH;
  return trimmed;
}
