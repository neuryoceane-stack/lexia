/** Texte court « actif il y a … » pour une date de dernière activité. */
export function formatActifIlYA(iso: string | null | undefined): string {
  if (!iso) return "pas encore d’activité sur les listes";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "pas encore d’activité sur les listes";
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 10) return "à l’instant";
  if (s < 60) return `il y a ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `il y a ${days} j`;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

export function formatDerniereActivite(iso: string | null | undefined): string {
  if (!iso) return "aucune";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "aucune";
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
