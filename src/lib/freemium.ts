/** Freemium élève actif uniquement si la variable vaut exactement "true". */
export function isFreemiumEnabled(): boolean {
  return process.env.FREEMIUM_ENABLED === "true";
}