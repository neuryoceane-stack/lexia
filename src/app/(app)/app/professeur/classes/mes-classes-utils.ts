import type { TeacherClassListRow } from "@/lib/teacher-classes-list-stats";

export const PAGE_BG = "#F8F7FF";
export const PRIMARY = "#6C3FC8";
export const BORDER_TERTIARY = "#E2DCF5";
export const GREEN = "#1D9E75";
export const GOLD = "#F5A623";

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
    { bg: "#F0EDF8", color: "#4B3A9E" },
    { bg: "#FEF3DC", color: "#A06800" },
    { bg: "#EAF4EF", color: "#1A6645" },
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
