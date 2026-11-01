import type { TeacherClassListRow } from "@/lib/teacher-classes-list-stats";

export const PAGE_BG = "var(--page)";
export const PRIMARY = "var(--ink)";
export const BORDER_TERTIARY = "var(--line)";
export const GREEN = "var(--ink)";
export const GOLD = "var(--ink)";

export function formatClassCode(identifier: string): string {
  const up = identifier.trim().toUpperCase();
  const core = up.startsWith("LX-") ? up : `LX-${up}`;
  return `Code : ${core}`;
}

export function shortBadgeLabel(title: string, maxLen = 16): string {
  const t = title.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
}

export function masteryColors(pct: number): { text: string; fill: string } {
  if (pct >= 70) return { text: GREEN, fill: GREEN };
  if (pct >= 40) return { text: PRIMARY, fill: PRIMARY };
  return { text: GOLD, fill: GOLD };
}

export function badgePalette(index: number): { bg: string; color: string } {
  const palettes = [
    { bg: "var(--background-subtle)", color: "var(--ink)" },
    { bg: "var(--mark)", color: "var(--ink)" },
    { bg: "var(--surface)", color: "var(--ink)" },
  ] as const;
  return palettes[index % 3];
}

export type MesClassesViewProps = {
  rows: TeacherClassListRow[];
  totalDistinctStudents: number;
  /** Ouvre la modale au chargement (ex. ?creer=1 ou redirection depuis /nouvelle). */
  initialOpenCreerModal: boolean;
  allLanguages: { value: string; label: string }[];
};
