"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { FlagDisplay } from "@/components/flag-display";
import type { LucideIcon } from "lucide-react";
import {
  Star,
  Clock,
  Zap,
  Check,
  Pencil,
  Sprout,
  TreePine,
  Flame,
  BookOpen,
  Trophy,
  Languages,
  Sparkles,
  BarChart3,
} from "lucide-react";

type ChartPeriod = "7j" | "30j" | "3m";

/** Hauteur fixe du cadre graphique — identique pour 7j / 30j / 3m et en état vide. */
const CHART_FRAME_HEIGHT_PX = 240;
/** Zone utile pour les barres (hors labels 7j). */
const CHART_BAR_MAX_PX = 196;

type SyntheseData = {
  totalDurationSeconds: number;
  wordsRetained: number;
  wordsWritten: number;
  languagesAvailable: string[];
  sessionsByDay: Record<
    string,
    { count: number; durationSeconds: number; wordsRetained?: number }
  >;
  wordsByLanguage?: Record<
    string,
    { wordsRetained: number; wordsWritten: number }
  >;
  avatarState: number;
};

const VIOLET = "#6C3FC8";
const VIOLET_DARK = "#4B3A9E";
const GOLD = "#F5A623";
const GOLD_DARK = "#A06800";
const GREEN = "#1D9E75";

const LANG_LABELS: Record<string, string> = {
  eng: "Anglais",
  fra: "Français",
  deu: "Allemand",
  spa: "Espagnol",
  ita: "Italien",
  por: "Portugais",
  nld: "Néerlandais",
  pol: "Polonais",
  rus: "Russe",
  jpn: "Japonais",
  zho: "Mandarin",
  ell: "Grec",
};

const LEVEL_NAMES: Record<number, string> = {
  1: "Graine",
  2: "Pousse",
  3: "Explorateur",
  4: "Apprenti",
  5: "Maître",
};

const BADGES_DEF: Array<{
  id: string;
  label: string;
  condition: string;
  type: "violet" | "gold";
  Icon: LucideIcon;
  check: (d: SyntheseData, s: number) => boolean;
}> = [
  {
    id: "10_words",
    label: "10 mots appris",
    condition: "Maîtrise 10 mots",
    type: "violet",
    Icon: BookOpen,
    check: (d) => d.wordsRetained >= 10,
  },
  {
    id: "first_dictation",
    label: "Première dictée",
    condition: "Complète une dictée",
    type: "gold",
    Icon: Pencil,
    check: (d) => d.wordsWritten >= 1,
  },
  {
    id: "100_words",
    label: "100 mots appris",
    condition: "Maîtrise 100 mots",
    type: "violet",
    Icon: Trophy,
    check: (d) => d.wordsRetained >= 100,
  },
  {
    id: "streak_7",
    label: "Streak 7 jours",
    condition: "7 jours d'affilée",
    type: "gold",
    Icon: Flame,
    check: (_d, s) => s >= 7,
  },
  {
    id: "2_languages",
    label: "2 langues actives",
    condition: "Révise 2 langues",
    type: "violet",
    Icon: Languages,
    check: (d) => (d.languagesAvailable?.length ?? 0) >= 2,
  },
  {
    id: "50_sessions",
    label: "50 sessions",
    condition: "50 sessions complétées",
    type: "violet",
    Icon: Zap,
    check: (d) =>
      Object.values(d.sessionsByDay).reduce((a, x) => a + x.count, 0) >= 50,
  },
  {
    id: "streak_30",
    label: "Streak 30 jours",
    condition: "30 jours d'affilée",
    type: "gold",
    Icon: Flame,
    check: (_d, s) => s >= 30,
  },
  {
    id: "first_streak",
    label: "Première série",
    condition: "1 jour de série",
    type: "gold",
    Icon: Sparkles,
    check: (_d, s) => s >= 1,
  },
];

function langLabel(code: string): string {
  return LANG_LABELS[code] ?? code;
}

function formatMinutes(seconds: number): number {
  return Math.max(1, Math.round(seconds / 60));
}

function getChartData(
  period: ChartPeriod,
  sessionsByDay: SyntheseData["sessionsByDay"]
): { date: string; label: string; mots: number }[] {
  const now = new Date();
  const days = period === "7j" ? 7 : period === "30j" ? 30 : 90;
  const out: { date: string; label: string; mots: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    const s = sessionsByDay[dateKey];
    const mots = s?.wordsRetained ?? 0;
    const label =
      period === "7j"
        ? ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][d.getDay()]
        : `${d.getDate()}/${d.getMonth() + 1}`;
    out.push({ date: dateKey, label, mots });
  }
  return out;
}

function getPalierProgress(words: number): {
  current: number;
  palier: number;
  pct: number;
  remaining: number;
} {
  const paliers = [100, 500, 1000];
  let palier = 100;
  let prev = 0;
  for (const p of paliers) {
    if (words < p) {
      palier = p;
      break;
    }
    prev = p;
    palier = p;
  }
  if (words >= 1000)
    return { current: words, palier: 1000, pct: 100, remaining: 0 };
  const range = palier - prev;
  const pct = range > 0 ? Math.min(100, ((words - prev) / range) * 100) : 100;
  return { current: words, palier, pct, remaining: palier - words };
}

function getLevelName(level: number): string {
  if (level >= 6) return "Légende";
  return LEVEL_NAMES[level] ?? "Graine";
}

function computeXP(data: SyntheseData): { xp: number; level: number } {
  const totalSessions = Object.values(data.sessionsByDay).reduce(
    (a, x) => a + x.count,
    0
  );
  const xp = data.wordsRetained * 5 + totalSessions * 20 + data.wordsWritten * 3;
  const level = Math.max(1, Math.min(6, Math.floor(xp / 1000) + 1));
  return { xp, level };
}

function getLevelVisual(level: number): {
  Icon: LucideIcon;
  iconSize: number;
  accent: string;
  accentSoft: string;
  ring: string;
  heroGradient: string;
} {
  if (level <= 2) {
    return {
      Icon: Sprout,
      iconSize: 44,
      accent: GREEN,
      accentSoft: "#EAF4EF",
      ring: "rgba(29, 158, 117, 0.35)",
      heroGradient:
        "linear-gradient(135deg, rgba(29,158,117,0.12) 0%, rgba(108,63,200,0.08) 55%, rgba(245,166,35,0.06) 100%)",
    };
  }
  if (level <= 4) {
    return {
      Icon: TreePine,
      iconSize: 40,
      accent: VIOLET,
      accentSoft: "#F0EDF8",
      ring: "rgba(108, 63, 200, 0.35)",
      heroGradient:
        "linear-gradient(135deg, rgba(108,63,200,0.14) 0%, rgba(108,63,200,0.06) 50%, rgba(245,166,35,0.08) 100%)",
    };
  }
  return {
    Icon: Flame,
    iconSize: 40,
    accent: GOLD,
    accentSoft: "#FEF3DC",
    ring: "rgba(245, 166, 35, 0.45)",
    heroGradient:
      "linear-gradient(135deg, rgba(245,166,35,0.16) 0%, rgba(108,63,200,0.1) 50%, rgba(245,166,35,0.12) 100%)",
  };
}

export function JardinClient() {
  const [data, setData] = useState<SyntheseData | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("7j");

  const fetchSynthese = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/synthese?period=all");
      const json = await res.json().catch(() => ({}));
      if (res.ok) setData(json);
      else setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSynthese();
  }, [fetchSynthese]);

  useEffect(() => {
    fetch("/api/streak")
      .then((r) => r.json())
      .then((d) => setStreak(d.currentStreak ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => {
        const name = [d.firstName, d.lastName].filter(Boolean).join(" ").trim();
        setUserName(name || "Apprenant");
      })
      .catch(() => setUserName("Apprenant"));
  }, []);

  const totalSessions = data
    ? Object.values(data.sessionsByDay).reduce((acc, d) => acc + d.count, 0)
    : 0;
  const chartData = data ? getChartData(chartPeriod, data.sessionsByDay) : [];
  const wordsByLang = Object.fromEntries(
    Object.entries(data?.wordsByLanguage ?? {}).filter(
      ([k]) => k && k !== "unknown"
    )
  );
  const { xp, level } = data ? computeXP(data) : { xp: 0, level: 1 };
  const xpInLevel = xp % 1000;
  const xpPct = Math.min(100, (xpInLevel / 1000) * 100);
  const todayKey = new Date().toISOString().slice(0, 10);
  const maxMots = Math.max(1, ...chartData.map((d) => d.mots));
  const levelVisual = getLevelVisual(level);
  const LevelIcon = levelVisual.Icon;
  const chartEmpty = chartData.every((d) => d.mots === 0);

  return (
    <div
      className="mx-auto w-full max-w-6xl space-y-6 px-0 sm:px-1"
      style={{ fontFamily: "DM Sans, sans-serif" }}
    >
      <BackLink href="/app" />

      {loading && !data ? (
        <div className="space-y-4">
          <div
            className="h-44 animate-pulse rounded-[20px]"
            style={{ background: "var(--background-subtle)" }}
          />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-[14px]"
                style={{ background: "var(--background-subtle)" }}
              />
            ))}
          </div>
        </div>
      ) : data ? (
        <>
          {/* ========== HÉROS PROFIL ========== */}
          <section
            className="relative overflow-hidden rounded-[20px] border"
            style={{
              borderColor: "rgba(108, 63, 200, 0.18)",
              background: levelVisual.heroGradient,
              boxShadow: "0 8px 32px rgba(108, 63, 200, 0.08)",
            }}
          >
            <HoneycombPattern />
            <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6 lg:p-8">
              <div
                className="relative mx-auto flex shrink-0 items-center justify-center sm:mx-0"
                style={{
                  width: 108,
                  height: 108,
                  borderRadius: "50%",
                  background: levelVisual.accentSoft,
                  boxShadow: `0 0 0 4px ${levelVisual.ring}, 0 12px 28px rgba(108,63,200,0.12)`,
                }}
              >
                <LevelIcon
                  size={levelVisual.iconSize}
                  stroke={levelVisual.accent}
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: VIOLET, boxShadow: "0 2px 8px rgba(108,63,200,0.35)" }}
                >
                  {level}
                </span>
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p
                  className="text-lg font-semibold sm:text-xl"
                  style={{ color: "var(--foreground)" }}
                >
                  {userName}
                </p>
                <p
                  className="mt-1 inline-flex items-center justify-center gap-1.5 sm:justify-start"
                  style={{ fontSize: 14, fontWeight: 600, color: VIOLET_DARK }}
                >
                  <Sprout size={16} stroke={VIOLET} strokeWidth={2} aria-hidden />
                  Niveau {level} — {getLevelName(level)}
                </p>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span
                      style={{ fontSize: 12, fontWeight: 500, color: "var(--foreground-muted)" }}
                    >
                      Progression vers le niveau {Math.min(level + 1, 6)}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: VIOLET_DARK }}>
                      {xpInLevel}{" "}
                      <span style={{ fontWeight: 500, color: "var(--foreground-muted)" }}>
                        / 1000 XP
                      </span>
                    </span>
                  </div>
                  <div
                    className="overflow-hidden rounded-full"
                    style={{
                      height: 12,
                      background: "rgba(255,255,255,0.65)",
                      border: "1px solid rgba(108, 63, 200, 0.15)",
                    }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${xpPct}%`,
                        background: `linear-gradient(90deg, ${VIOLET} 0%, #9B6FE8 55%, ${GOLD} 100%)`,
                        boxShadow: xpPct > 0 ? "0 0 12px rgba(108,63,200,0.35)" : undefined,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1"
                    style={{ background: "#EAF4EF", color: "#1A6645", fontSize: 11, fontWeight: 600 }}
                  >
                    <Check size={12} strokeWidth={2.5} aria-hidden />
                    {data.wordsRetained} mots maîtrisés
                  </span>
                  {streak > 0 && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1"
                      style={{ background: "#FEF3DC", color: GOLD_DARK, fontSize: 11, fontWeight: 600 }}
                    >
                      <Flame size={12} strokeWidth={2.5} aria-hidden />
                      Série de {streak} jour{streak !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ========== STATS ========== */}
          <section>
            <SectionLabel>Statistiques</SectionLabel>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                icon={Clock}
                accent={VIOLET}
                accentBg="rgba(108, 63, 200, 0.1)"
                label="Temps total"
                value={String(formatMinutes(data.totalDurationSeconds))}
                unit="min"
                subLabel="minutes de révision"
              />
              <StatCard
                icon={Zap}
                accent={GOLD}
                accentBg="rgba(245, 166, 35, 0.12)"
                label="Sessions"
                value={String(totalSessions)}
                subLabel="sessions complétées"
              />
              <StatCard
                icon={Check}
                accent={GREEN}
                accentBg="rgba(29, 158, 117, 0.12)"
                label="Mots mémorisés"
                value={String(data.wordsRetained)}
                subLabel="par flashcards"
              />
              <StatCard
                icon={Pencil}
                accent="#0F6E56"
                accentBg="rgba(15, 110, 86, 0.1)"
                label="Mots écrits"
                value={String(data.wordsWritten)}
                subLabel="par dictée"
              />
            </div>
          </section>

          {/* ========== ACTIVITÉ + BADGES (desktop côte à côte) ========== */}
          <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
            <section className="lg:col-span-7">
              <SectionLabel>Activité</SectionLabel>
              <div
                className="rounded-[16px] border p-4 sm:p-5"
                style={{
                  background: "var(--background-card)",
                  borderColor: "rgba(108, 63, 200, 0.12)",
                  boxShadow: "0 4px 20px rgba(108, 63, 200, 0.04)",
                }}
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>
                    Mots appris par jour
                  </p>
                  <div className="flex gap-1 rounded-full p-0.5" style={{ background: "var(--background-subtle)" }}>
                    {(["7j", "30j", "3m"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setChartPeriod(p)}
                        className="rounded-full transition-colors"
                        style={{
                          background: chartPeriod === p ? VIOLET : "transparent",
                          color: chartPeriod === p ? "white" : "var(--foreground-muted)",
                          padding: "4px 12px",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          border: "none",
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className="overflow-hidden rounded-[12px]"
                  style={{
                    height: CHART_FRAME_HEIGHT_PX,
                    background: "rgba(108, 63, 200, 0.04)",
                  }}
                >
                  {chartEmpty ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-full"
                        style={{ background: "rgba(108, 63, 200, 0.1)" }}
                      >
                        <Sprout size={22} stroke={VIOLET} strokeWidth={1.75} aria-hidden />
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--foreground-muted)" }}>
                        Pas encore de données sur cette période
                      </p>
                      <p style={{ fontSize: 12, color: "var(--foreground-disabled)", maxWidth: 280 }}>
                        Reviens réviser pour voir ta progression ici
                      </p>
                    </div>
                  ) : (
                    <div
                      className="flex h-full items-end gap-[2px] overflow-x-auto overscroll-x-contain px-1 pb-2 pt-3"
                      role="img"
                      aria-label="Mots appris par jour"
                    >
                      {chartData.map((d) => {
                        const barPx =
                          d.mots > 0
                            ? Math.max(6, Math.round((d.mots / maxMots) * CHART_BAR_MAX_PX))
                            : 3;
                        const isToday = d.date === todayKey;
                        const colWidth =
                          chartPeriod === "7j" ? undefined : chartPeriod === "30j" ? 10 : 6;
                        return (
                          <div
                            key={d.date}
                            className="flex h-full min-w-0 flex-col items-center justify-end"
                            style={
                              chartPeriod === "7j"
                                ? { flex: "1 1 0" }
                                : { flex: "0 0 auto", width: colWidth, minWidth: colWidth }
                            }
                          >
                            <div
                              className="transition-all duration-300"
                              style={{
                                height: barPx,
                                width: chartPeriod === "7j" ? "100%" : colWidth,
                                minWidth: chartPeriod === "7j" ? 4 : colWidth,
                                background: isToday
                                  ? `linear-gradient(180deg, ${VIOLET} 0%, #9B6FE8 100%)`
                                  : "rgba(108, 63, 200, 0.2)",
                                borderRadius: "6px 6px 2px 2px",
                                boxShadow: isToday ? "0 4px 12px rgba(108,63,200,0.25)" : undefined,
                              }}
                              title={`${d.label}: ${d.mots} mots`}
                            />
                            {chartPeriod === "7j" && (
                              <span
                                className="mt-1.5 truncate"
                                style={{
                                  fontSize: 10,
                                  fontWeight: isToday ? 600 : 400,
                                  color: isToday ? VIOLET : "var(--foreground-disabled)",
                                }}
                              >
                                {d.label}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="lg:col-span-5">
              <SectionLabel>Badges</SectionLabel>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2">
                {BADGES_DEF.map((badge) => {
                  const earned = badge.check(data, streak);
                  const BadgeIcon = badge.Icon;
                  const isGold = badge.type === "gold";

                  if (earned) {
                    return (
                      <div
                        key={badge.id}
                        className="flex flex-col items-center gap-2 rounded-[14px] border text-center transition-transform hover:scale-[1.02]"
                        style={{
                          background: isGold
                            ? "linear-gradient(160deg, #FEF3DC 0%, #FAE5B0 100%)"
                            : "linear-gradient(160deg, #F0EDF8 0%, #E8E0F5 100%)",
                          borderColor: isGold ? "#F5D08A" : "#DDD6F5",
                          padding: "14px 8px",
                          boxShadow: isGold
                            ? "0 4px 16px rgba(245,166,35,0.2)"
                            : "0 4px 16px rgba(108,63,200,0.12)",
                        }}
                      >
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-full"
                          style={{
                            background: isGold ? "#F5A623" : VIOLET,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          }}
                        >
                          <BadgeIcon size={20} stroke="white" strokeWidth={2} aria-hidden />
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: isGold ? GOLD_DARK : VIOLET_DARK,
                            lineHeight: 1.3,
                          }}
                        >
                          {badge.label}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={badge.id}
                      className="flex flex-col items-center gap-2 rounded-[14px] border text-center"
                      style={{
                        background: "var(--background-card)",
                        borderColor: "var(--border)",
                        padding: "14px 8px",
                        opacity: 0.85,
                      }}
                    >
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed"
                        style={{
                          background: "var(--background-subtle)",
                          borderColor: "var(--border)",
                        }}
                      >
                        <BadgeIcon
                          size={20}
                          stroke="var(--foreground-disabled)"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--foreground-muted)",
                          lineHeight: 1.3,
                        }}
                      >
                        {badge.label}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          color: "var(--foreground-disabled)",
                          lineHeight: 1.35,
                        }}
                      >
                        {badge.condition}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* ========== PROGRESSION PAR LANGUE ========== */}
          {Object.keys(wordsByLang).length > 0 && (
            <section>
              <SectionLabel>Par langue</SectionLabel>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(wordsByLang).map(([code, stats]) => {
                  const { current, palier, pct, remaining } = getPalierProgress(
                    stats.wordsRetained ?? 0
                  );
                  return (
                    <div
                      key={code}
                      className="rounded-[14px] border p-4"
                      style={{
                        background: "var(--background-card)",
                        borderColor: "rgba(108, 63, 200, 0.1)",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FlagDisplay langCode={code} size={22} />
                          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>
                            {langLabel(code)}
                          </span>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: VIOLET }}>
                          {Math.round(pct)}%
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: "var(--foreground-muted)", marginTop: 4 }}>
                        {current} mots appris
                      </p>
                      <div
                        className="mt-2 overflow-hidden rounded-full"
                        style={{ height: 7, background: "var(--background-subtle)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${VIOLET}, #9B6FE8)`,
                          }}
                        />
                      </div>
                      <p style={{ fontSize: 11, color: "var(--foreground-disabled)", marginTop: 6 }}>
                        Prochain palier : {palier} mots — encore {remaining} à apprendre
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      ) : (
        <div
          className="text-center"
          style={{
            background: "var(--background-card)",
            border: "0.5px dashed var(--border)",
            borderRadius: 16,
            padding: "40px 20px",
          }}
        >
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: "rgba(108, 63, 200, 0.08)" }}
          >
            <BarChart3 size={32} stroke={VIOLET} strokeWidth={1.5} aria-hidden />
          </div>
          <p style={{ fontSize: 14, color: "var(--foreground-muted)" }}>
            Aucune activité pour le moment.
          </p>
          <p className="mt-1" style={{ fontSize: 12, color: "var(--foreground-disabled)" }}>
            Lance une session d&apos;évaluation pour voir ta progression ici.
          </p>
          <Link
            href="/app/revision"
            className="mt-4 inline-flex items-center justify-center no-underline transition hover:brightness-95"
            style={{
              background: VIOLET,
              color: "white",
              borderRadius: 20,
              padding: "10px 22px",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Commencer une session
          </Link>
        </div>
      )}
    </div>
  );
}

function HoneycombPattern() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.35]"
      aria-hidden
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='48' viewBox='0 0 56 48'%3E%3Cpath fill='none' stroke='%236C3FC8' stroke-width='0.6' opacity='0.35' d='M14 4 L28 4 L35 12 L28 20 L14 20 L7 12 Z M28 20 L42 20 L49 28 L42 36 L28 36 L21 28 Z'/%3E%3C/svg%3E")`,
        backgroundSize: "56px 48px",
      }}
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "var(--foreground-muted)",
        marginBottom: 10,
      }}
    >
      {children}
    </p>
  );
}

function StatCard({
  icon: Icon,
  accent,
  accentBg,
  label,
  value,
  unit,
  subLabel,
}: {
  icon: LucideIcon;
  accent: string;
  accentBg: string;
  label: string;
  value: string;
  unit?: string;
  subLabel: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[14px] border p-4"
      style={{
        background: accentBg,
        borderColor: `${accent}22`,
      }}
    >
      <div
        className="absolute -right-3 -top-3 h-16 w-16 rounded-full opacity-20"
        style={{ background: accent }}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-2">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-[12px]"
          style={{ background: "rgba(255,255,255,0.75)", boxShadow: `0 2px 8px ${accent}22` }}
        >
          <Icon size={20} stroke={accent} strokeWidth={2} aria-hidden />
        </div>
      </div>
      <p className="relative mt-3" style={{ fontSize: 11, fontWeight: 500, color: "var(--foreground-muted)" }}>
        {label}
      </p>
      <p className="relative mt-0.5 leading-none" style={{ fontSize: 32, fontWeight: 700, color: accent }}>
        {value}
        {unit && (
          <span style={{ fontSize: 14, fontWeight: 500, marginLeft: 2, opacity: 0.85 }}>
            {unit}
          </span>
        )}
      </p>
      <p className="relative mt-1.5" style={{ fontSize: 11, color: "var(--foreground-disabled)" }}>
        {subLabel}
      </p>
    </div>
  );
}
