"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BackLink } from "@/components/back-link";
import { SyntheseAvatar } from "@/components/synthese-avatar";
import { FlagDisplay } from "@/components/flag-display";

type AvatarType = "arbre" | "phenix" | "koala";
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
  zho: "Chinois",
  ell: "Grec",
};

const BADGES = [
  { id: "first_streak", emoji: "🔥", label: "Première série", check: (d: SyntheseData, s: number) => s >= 1 },
  { id: "100_words", emoji: "📚", label: "100 mots appris", check: (d: SyntheseData) => d.wordsRetained >= 100 },
  { id: "first_dictation", emoji: "⚡", label: "Première dictée", check: (d: SyntheseData) => d.wordsWritten >= 1 },
  { id: "3_languages", emoji: "🌍", label: "3 langues", check: (d: SyntheseData) => (d.languagesAvailable?.length ?? 0) >= 3 },
  { id: "streak_7", emoji: "🏆", label: "Streak 7 jours", check: (_d: SyntheseData, s: number) => s >= 7 },
  { id: "500_words", emoji: "📖", label: "500 mots appris", check: (d: SyntheseData) => d.wordsRetained >= 500 },
  { id: "1000_words", emoji: "🎯", label: "1000 mots appris", check: (d: SyntheseData) => d.wordsRetained >= 1000 },
  { id: "streak_30", emoji: "⭐", label: "Streak 30 jours", check: (_d: SyntheseData, s: number) => s >= 30 },
] as const;

const VIOLET = "#6C3FC8";
const VIOLET_BG = "#F3EEFF";

function langLabel(code: string): string {
  return LANG_LABELS[code] ?? code;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (s === 0) return `${m} min`;
  return `${m} min ${s} s`;
}

function getWordsThisWeek(sessionsByDay: SyntheseData["sessionsByDay"]): number {
  const now = new Date();
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const s = sessionsByDay[key];
    total += s?.wordsRetained ?? 0;
  }
  return total;
}

function getChartData(
  period: ChartPeriod,
  sessionsByDay: SyntheseData["sessionsByDay"]
): { date: string; label: string; mots: number }[] {
  const now = new Date();
  const days =
    period === "7j" ? 7 : period === "30j" ? 30 : 90;
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
        : period === "30j"
          ? `${d.getDate()}/${d.getMonth() + 1}`
          : `${d.getDate()}/${d.getMonth() + 1}`;
    out.push({ date: dateKey, label, mots });
  }
  return out;
}

function getMainLanguage(
  wordsByLanguage?: Record<string, { wordsRetained: number }>
): string {
  if (!wordsByLanguage || Object.keys(wordsByLanguage).length === 0)
    return "";
  return Object.entries(wordsByLanguage).sort(
    (a, b) => (b[1]?.wordsRetained ?? 0) - (a[1]?.wordsRetained ?? 0)
  )[0]?.[0] ?? "";
}

function getPalierProgress(words: number): { current: number; palier: number; pct: number } {
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
  if (words >= 1000) {
    return { current: words, palier: 1000, pct: 100 };
  }
  const range = palier - prev;
  const pct = range > 0 ? Math.min(100, ((words - prev) / range) * 100) : 100;
  return { current: words, palier, pct };
}

export function JardinClient() {
  const [data, setData] = useState<SyntheseData | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [userName, setUserName] = useState<string>("");
  const [avatarType, setAvatarType] = useState<AvatarType>("arbre");
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("7j");
  const [claudeMessage, setClaudeMessage] = useState<string | null>(null);
  const [claudeLoading, setClaudeLoading] = useState(false);

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

  useEffect(() => {
    fetch("/api/user/preferences")
      .then((r) => r.json())
      .then((d) => {
        if (d.avatarType && ["arbre", "phenix", "koala"].includes(d.avatarType)) {
          setAvatarType(d.avatarType);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!data) return;
    setClaudeLoading(true);
    const wordsThisWeek = getWordsThisWeek(data.sessionsByDay);
    const mainLang = getMainLanguage(data.wordsByLanguage);
    fetch("/api/synthese/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        streak,
        wordsThisWeek,
        mainLanguage: mainLang,
      }),
    })
      .then((r) => r.json())
      .then((d) => setClaudeMessage(d.message ?? null))
      .catch(() => setClaudeMessage(null))
      .finally(() => setClaudeLoading(false));
  }, [data, streak]);

  const totalSessions = data
    ? Object.values(data.sessionsByDay).reduce((acc, d) => acc + d.count, 0)
    : 0;
  const avatarStateNum = data
    ? (Math.min(5, Math.max(1, data.avatarState)) as 1 | 2 | 3 | 4 | 5)
    : 1;
  const chartData = data ? getChartData(chartPeriod, data.sessionsByDay) : [];
  const wordsByLang = Object.fromEntries(
    Object.entries(data?.wordsByLanguage ?? {}).filter(
      ([k]) => k && k !== "unknown"
    )
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <BackLink href="/app" />

      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-4xl">
          Synthèse
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Ta progression en un coup d&apos;œil
        </p>
      </header>

      {loading && !data ? (
        <div className="space-y-8">
          <div className="flex justify-center">
            <div className="h-24 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700"
              />
            ))}
          </div>
        </div>
      ) : data ? (
        <>
          {/* Avatar centré + nom + niveau */}
          <section className="flex flex-col items-center gap-4">
            <div className="scale-125">
              <SyntheseAvatar
                state={avatarStateNum}
                type={avatarType}
                showLabel
              />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {userName}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Niveau {avatarStateNum}
              </p>
            </div>
            <Link
              href="/app/parametres"
              className="text-sm text-slate-500 underline decoration-slate-300 hover:text-[#6C3FC8] hover:decoration-[#6C3FC8] dark:text-slate-400"
            >
              Changer l&apos;avatar
            </Link>
          </section>

          {/* Message Claude */}
          <section
            className="rounded-xl border border-slate-200 p-4 dark:border-slate-600"
            style={{ backgroundColor: VIOLET_BG, borderLeftWidth: 4, borderLeftColor: VIOLET }}
          >
            <div className="flex gap-3">
              <span className="text-xl" aria-hidden>✨</span>
              <div className="min-w-0 flex-1">
                {claudeLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 w-full animate-pulse rounded bg-slate-300/50" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-slate-300/50" />
                  </div>
                ) : claudeMessage ? (
                  <p className="text-slate-700 dark:text-slate-300">
                    {claudeMessage}
                  </p>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400">
                    Lance des sessions pour recevoir un message personnalisé !
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* 4 cartes métriques */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon="⏱️"
              label="Temps total de révision"
              value={formatDuration(data.totalDurationSeconds)}
              borderColor="#f59e0b"
            />
            <MetricCard
              icon="🎯"
              label="Sessions complétées"
              value={String(totalSessions)}
              borderColor="#10b981"
            />
            <MetricCard
              icon="📚"
              label="Mots mémorisés"
              value={String(data.wordsRetained)}
              borderColor="#3b82f6"
            />
            <MetricCard
              icon="✍️"
              label="Mots écrits"
              value={String(data.wordsWritten)}
              borderColor="#f43f5e"
            />
          </div>

          {/* Graphique de progression */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-600 dark:bg-slate-800">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Progression
              </h2>
              <div className="flex gap-2">
                {(["7j", "30j", "3m"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setChartPeriod(p)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C3FC8] focus-visible:ring-offset-2 ${
                      chartPeriod === p
                        ? "bg-[#6C3FC8] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {p === "7j" ? "7 jours" : p === "30j" ? "30 jours" : "3 mois"}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                    stroke="#64748b"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#64748b"
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                    }}
                    formatter={(value) => [`${value ?? 0} mots`, "Mots révisés"]}
                    labelFormatter={(_label, payload) =>
                      payload?.[0]?.payload?.date ?? ""
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="mots"
                    stroke={VIOLET}
                    strokeWidth={2}
                    dot={{ fill: VIOLET, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Progression par langue */}
          {Object.keys(wordsByLang).length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Progression par langue
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(wordsByLang).map(([code, stats]) => {
                  const { current, palier, pct } = getPalierProgress(
                    stats.wordsRetained ?? 0
                  );
                  return (
                    <div
                      key={code}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <FlagDisplay langCode={code} size={24} />
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {langLabel(code)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {current} mots appris · prochain palier : {palier}
                      </p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: VIOLET,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Badges */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Tes badges 🏆
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {BADGES.map((badge) => {
                const earned = badge.check(data, streak);
                return (
                  <div
                    key={badge.id}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center ${
                      earned
                        ? "border-[#6C3FC8]/30 bg-[#F3EEFF] dark:bg-[#6C3FC8]/10"
                        : "border-slate-200 bg-slate-50 opacity-60 dark:border-slate-600 dark:bg-slate-800/50"
                    }`}
                  >
                    <span className="text-2xl">
                      {earned ? badge.emoji : "🔒"}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        earned
                          ? "text-slate-800 dark:text-slate-100"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-600 dark:bg-slate-800/50">
          <p className="text-slate-600 dark:text-slate-400">
            Aucune activité pour le moment.
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">
            Lance une session d&apos;évaluation pour voir ta progression ici.
          </p>
          <Link
            href="/app/revision"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#6C3FC8] px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#5a35b0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C3FC8] focus-visible:ring-offset-2"
          >
            Commencer une session
          </Link>
        </section>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  borderColor,
}: {
  icon: string;
  label: string;
  value: string;
  borderColor: string;
}) {
  return (
    <div
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-600 dark:bg-slate-800"
      style={{ borderLeftWidth: 4, borderLeftColor: borderColor }}
    >
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {icon} {label}
      </p>
      <p
        className="mt-2 text-2xl font-bold"
        style={{ color: VIOLET }}
      >
        {value}
      </p>
    </div>
  );
}
