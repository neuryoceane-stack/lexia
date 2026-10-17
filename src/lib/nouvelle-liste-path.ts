/** Entrée unique pour créer une liste ou y ajouter des mots. */
export function nouvelleListePath(lang?: string | null): string {
  const code = lang?.trim();
  if (code) return `/app/familles/nouvelle-liste?lang=${encodeURIComponent(code)}`;
  return "/app/familles/nouvelle-liste";
}
