"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { FlagDisplay } from "@/components/flag-display";
import {
  Star,
  Clock,
  Zap,
  Check,
  Pencil,
  Lock,
  Sprout,
  TreePine,
  Flame,
} from "lucide-react";

type ChartPeriod = "7j" | "30j" | "3m";

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

const BADGES_DEF = [
  { id: "10_words", label: "10 mots appris", type: "violet" as const, check: (d: SyntheseData, _s: number) => d.wordsRetained >= 10 },
  { id: "first_dictation", label: "Première dictée", type: "gold" as const, check: (d: SyntheseData, _s: number) => d.wordsWritten >= 1 },
  { id: "100_words", label: "100 mots appris", type: "violet" as const, check: (d: SyntheseData, _s: number) => d.wordsRetained >= 100 },
  { id: "streak_7", label: "Streak 7 jours", type: "gold" as const, check: (_d: SyntheseData, s: number) => s >= 7 },
  { id: "2_languages", label: "2 langues actives", type: "violet" as const, check: (d: SyntheseData, _s: number) => (d.languagesAvailable?.length ?? 0) >= 2 },
  { id: "50_sessions", label: "50 sessions", type: "violet" as const, check: (d: SyntheseData, _s: number) => Object.values(d.sessionsByDay).reduce((a, x) => a + x.count, 0) >= 50 },
  { id: "streak_30", label: "Streak 30 jours", type: "gold" as const, check: (_d: SyntheseData, s: number) => s >= 30 },
  { id: "first_streak", label: "Première série", type: "gold" as const, check: (_d: SyntheseData, s: number) => s >= 1 },
] as const;

function langLabel(code: string): string {
  return LANG_LABELS[code] ?? code;
}

function formatMinutes(seconds: number): number {
  return Math.max(1, Math.round(seconds / 60));
}

function getChartData(
  period: ChartPeriod,
  sessionsByDay: SyntheseData["sessionsByDay"],
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

function getPalierProgress(words: number): { current: number; palier: number; pct: number; remaining: number } {
  const paliers = [100, 500, 1000];
  let palier = 100;
  let prev = 0;
  for (const p of paliers) {
    if (words < p) { palier = p; break; }
    prev = p;
    palier = p;
  }
  if (words >= 1000) return { current: words, palier: 1000, pct: 100, remaining: 0 };
  const range = palier - prev;
  const pct = range > 0 ? Math.min(100, ((words - prev) / range) * 100) : 100;
  return { current: words, palier, pct, remaining: palier - words };
}

function getLevelName(level: number): string {
  if (level >= 6) return "Légende";
  return LEVEL_NAMES[level] ?? "Graine";
}

function computeXP(data: SyntheseData): { xp: number; level: number } {
  const totalSessions = Object.values(data.sessionsByDay).reduce((a, x) => a + x.count, 0);
  const xp = data.wordsRetained * 5 + totalSessions * 20 + data.wordsWritten * 3;
  const level = Math.max(1, Math.min(6, Math.floor(xp / 1000) + 1));
  return { xp, level };
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

  useEffect(() => { fetchSynthese(); }, [fetchSynthese]);

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
    Object.entries(data?.wordsByLanguage ?? {}).filter(([k]) => k && k !== "unknown"),
  );
  const { xp, level } = data ? computeXP(data) : { xp: 0, level: 1 };
  const xpInLevel = xp % 1000;
  const todayKey = new Date().toISOString().slice(0, 10);
  const maxMots = Math.max(1, ...chartData.map((d) => d.mots));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href="/app" />

      {loading && !data ? (
        <div className="space-y-4">
          <div className="h-28 animate-pulse rounded-[14px]" style={{ background: "var(--background-subtle)" }} />
          <div className="grid grid-cols-2 gap-[10px]">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-[12px]" style={{ background: "var(--background-subtle)" }} />)}
          </div>
        </div>
      ) : data ? (
        <>
          {/* ========== HERO CARD ========== */}
          <div
            className="flex gap-4"
            style={{ background: "var(--background-subtle)", borderRadius: 14, padding: "20px 16px" }}
          >
            {/* Avatar */}
            <div
              className="flex shrink-0 items-center justify-center"
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                border: "3px solid #DDD6F5",
                background: level <= 2 ? "#EAF4EF" : level <= 4 ? "#F0EDF8" : "#FEF3DC",
              }}
            >
              {level <= 2 ? (
                <Sprout size={28} stroke="#1D9E75" />
              ) : level <= 4 ? (
                <TreePine size={28} stroke="#6C3FC8" />
              ) : (
                <Flame size={28} stroke="#F5A623" />
              )}
            </div>

            {/* Infos */}
            <div className="min-w-0 flex-1">
              <p style={{ fontSize: 16, fontWeight: 500, color: "var(--foreground)" }}>{userName}</p>
              <span
                className="mt-1 inline-flex items-center gap-[5px]"
                style={{
                  background: "#DDD6F5",
                  color: "#4B3A9E",
                  fontSize: 11,
                  fontWeight: 500,
                  padding: "3px 10px",
                  borderRadius: 10,
                }}
              >
                <Star size={10} stroke="#4B3A9E" />
                Niveau {level} — {getLevelName(level)}
              </span>

              {/* Barre XP */}
              <div style={{ marginTop: 8 }}>
                <div style={{ height: 5, background: "#DDD6F5", borderRadius: 3 }}>
                  <div
                    className="transition-all duration-300"
                    style={{ height: "100%", width: `${(xpInLevel / 1000) * 100}%`, background: "#6C3FC8", borderRadius: 3 }}
                  />
                </div>
                <p style={{ fontSize: 11, color: "var(--foreground-muted)", marginTop: 3 }}>
                  {xpInLevel} / 1000 XP vers le niveau suivant
                </p>
              </div>

              {/* Badges inline */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span style={{ background: "#EAF4EF", color: "#1A6645", fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 8 }}>
                  {data.wordsRetained} mots maîtrisés
                </span>
                {streak > 0 && (
                  <span style={{ background: "#FEF3DC", color: "#A06800", fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 8 }}>
                    Série active 🔥
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ========== STATS ========== */}
          <div>
            <SectionLabel>Statistiques</SectionLabel>
            <div className="grid grid-cols-2 gap-[10px]">
              <StatCard
                icon={<Clock size={14} stroke="#6C3FC8" />}
                iconBg="var(--background-subtle)"
                label="Temps total"
                value={String(formatMinutes(data.totalDurationSeconds))}
                unit="min"
                valueColor="#6C3FC8"
                subLabel="minutes de révision"
              />
              <StatCard
                icon={<Zap size={14} stroke="#F5A623" />}
                iconBg="#FEF3DC"
                label="Sessions"
                value={String(totalSessions)}
                valueColor="#F5A623"
                subLabel="sessions complétées"
              />
              <StatCard
                icon={<Check size={14} stroke="#1D9E75" />}
                iconBg="#EAF4EF"
                label="Mots mémorisés"
                value={String(data.wordsRetained)}
                valueColor="#1D9E75"
                subLabel="par flashcards"
              />
              <StatCard
                icon={<Pencil size={14} stroke="#0F6E56" />}
                iconBg="#E1F5EE"
                label="Mots écrits"
                value={String(data.wordsWritten)}
                valueColor="#0F6E56"
                subLabel="par dictée"
              />
            </div>
          </div>

          {/* ========== GRAPHE PROGRESSION ========== */}
          <div>
            <SectionLabel>Activité</SectionLabel>
            <div style={{ background: "var(--background-card)", border: "0.5px solid var(--border)", borderRadius: 12, padding: 14 }}>
              <div className="mb-3 flex items-center justify-between">
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>
                  Mots appris par jour
                </p>
                <div className="flex gap-1">
                  {(["7j", "30j", "3m"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setChartPeriod(p)}
                      style={{
                        background: chartPeriod === p ? "#6C3FC8" : "var(--background-card)",
                        color: chartPeriod === p ? "white" : "var(--foreground-muted)",
                        border: chartPeriod === p ? "none" : "0.5px solid var(--border)",
                        borderRadius: 20,
                        padding: "3px 10px",
                        fontSize: 11,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {chartData.every((d) => d.mots === 0) ? (
                <p className="py-10 text-center" style={{ fontSize: 13, color: "var(--foreground-disabled)" }}>
                  Continue tes révisions pour voir ta progression ici 💪
                </p>
              ) : (
                <div className="flex items-end gap-[3px]" style={{ height: 120 }}>
                  {chartData.map((d) => {
                    const h = d.mots > 0 ? Math.max(8, (d.mots / maxMots) * 100) : 0;
                    const isToday = d.date === todayKey;
                    return (
                      <div key={d.date} className="flex flex-1 flex-col items-center">
                        <div
                          className="w-full transition-all duration-200"
                          style={{
                            height: `${h}%`,
                            background: isToday ? "#6C3FC8" : "#DDD6F5",
                            borderRadius: "4px 4px 0 0",
                            minWidth: 4,
                          }}
                          title={`${d.label}: ${d.mots} mots`}
                        />
                        {chartPeriod === "7j" && (
                          <span className="mt-1" style={{ fontSize: 10, color: "var(--foreground-disabled)" }}>
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

          {/* ========== PROGRESSION PAR LANGUE ========== */}
          {Object.keys(wordsByLang).length > 0 && (
            <div>
              <SectionLabel>Par langue</SectionLabel>
              <div className="space-y-[10px]">
                {Object.entries(wordsByLang).map(([code, stats]) => {
                  const { current, palier, pct, remaining } = getPalierProgress(stats.wordsRetained ?? 0);
                  return (
                    <div
                      key={code}
                      style={{ background: "var(--background-card)", border: "0.5px solid var(--border)", borderRadius: 12, padding: 14 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FlagDisplay langCode={code} size={20} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>
                            {langLabel(code)}
                          </span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#6C3FC8" }}>
                          {Math.round(pct)}%
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: "var(--foreground-muted)", marginTop: 3 }}>
                        {current} mots appris
                      </p>
                      <div style={{ height: 6, background: "var(--background-subtle)", borderRadius: 3, marginTop: 6 }}>
                        <div
                          className="transition-all duration-300"
                          style={{ height: "100%", width: `${pct}%`, background: "#6C3FC8", borderRadius: 3 }}
                        />
                      </div>
                      <p style={{ fontSize: 11, color: "var(--foreground-disabled)", marginTop: 5 }}>
                        Prochain palier : {palier} mots — encore {remaining} à apprendre
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========== BADGES ========== */}
          <div>
            <SectionLabel>Badges</SectionLabel>
            <div className="grid grid-cols-4 gap-2">
              {BADGES_DEF.map((badge) => {
                const earned = badge.check(data, streak);
                if (earned) {
                  const isGold = badge.type === "gold";
                  return (
                    <div
                      key={badge.id}
                      className="flex flex-col items-center gap-1.5 text-center"
                      style={{
                        background: isGold ? "#FEF3DC" : "#F0EDF8",
                        border: `0.5px solid ${isGold ? "#F5D08A" : "#DDD6F5"}`,
                        borderRadius: 12,
                        padding: "12px 6px",
                      }}
                    >
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: isGold ? "#FAE5B0" : "#DDD6F5",
                        }}
                      >
                        {isGold ? (
                          <Flame size={16} stroke="#A06800" />
                        ) : (
                          <Star size={16} stroke="#4B3A9E" />
                        )}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 500, color: isGold ? "#A06800" : "#4B3A9E" }}>
                        {badge.label}
                      </span>
                    </div>
                  );
                }
                return (
                  <div
                    key={badge.id}
                    className="flex flex-col items-center gap-1.5 text-center"
                    style={{
                      background: "var(--background-card)",
                      border: "0.5px solid var(--border)",
                      borderRadius: 12,
                      padding: "12px 6px",
                    }}
                  >
                    <div
                      className="flex items-center justify-center"
                      style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--background-subtle)" }}
                    >
                      <Lock size={16} stroke="var(--foreground-disabled)" />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 500, color: "var(--foreground-disabled)" }}>
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div
          className="text-center"
          style={{ background: "var(--background-card)", border: "0.5px dashed var(--border)", borderRadius: 12, padding: "40px 20px" }}
        >
          <p style={{ fontSize: 14, color: "var(--foreground-muted)" }}>Aucune activité pour le moment.</p>
          <p className="mt-1" style={{ fontSize: 12, color: "var(--foreground-disabled)" }}>
            Lance une session d&apos;évaluation pour voir ta progression ici.
          </p>
          <Link
            href="/app/revision"
            className="mt-4 inline-flex items-center justify-center no-underline transition hover:brightness-95"
            style={{
              background: "#6C3FC8",
              color: "white",
              borderRadius: 20,
              padding: "9px 20px",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Commencer une session
          </Link>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: "var(--foreground-muted)",
        marginBottom: 10,
      }}
    >
      {children}
    </p>
  );
}

function StatCard({
  icon,
  iconBg,
  label,
  value,
  unit,
  valueColor,
  subLabel,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  unit?: string;
  valueColor: string;
  subLabel: string;
}) {
  return (
    <div style={{ background: "var(--background-card)", border: "0.5px solid var(--border)", borderRadius: 12, padding: 14 }}>
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center"
          style={{ width: 28, height: 28, borderRadius: 7, background: iconBg }}
        >
          {icon}
        </div>
        <span style={{ fontSize: 11, color: "var(--foreground-muted)" }}>{label}</span>
      </div>
      <p className="mt-2" style={{ fontSize: 28, fontWeight: 500, color: valueColor }}>
        {value}
        {unit && <span style={{ fontSize: 13, fontWeight: 400, marginLeft: 3 }}>{unit}</span>}
      </p>
      <p style={{ fontSize: 11, color: "var(--foreground-disabled)" }}>{subLabel}</p>
    </div>
  );
}
