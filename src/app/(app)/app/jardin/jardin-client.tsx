"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { SyntheseAvatar } from "@/components/synthese-avatar";

type SynthesePeriod = "day" | "week" | "month" | "year" | "all";
type AvatarType = "arbre" | "phenix" | "koala";

type SyntheseData = {
  totalDurationSeconds: number;
  wordsRetained: number;
  wordsWritten: number;
  languagesAvailable: string[];
  sessionsByDay: Record<string, { count: number; durationSeconds: number }>;
  avatarState: number;
};

const PERIOD_LABELS: Record<SynthesePeriod, string> = {
  day: "Jour",
  week: "Semaine",
  month: "Mois",
  year: "Année",
  all: "Tout",
};

const LANG_LABELS: Record<string, string> = {
  eng: "Anglais",
  fra: "Français",
  deu: "Allemand",
  spa: "Espagnol",
  ita: "Italien",
};

const ENCOURAGEMENT: Record<number, string> = {
  1: "Lance une session pour faire grandir ton avatar !",
  2: "Bien, tu as repris. Continue !",
  3: "Bonne régularité, continue comme ça.",
  4: "Forte progression, bravo !",
  5: "Niveau suprême, impressionnant !",
};

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

const validPeriods: SynthesePeriod[] = ["day", "week", "month", "year", "all"];

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}
function IconPlay({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function IconPencil({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

export function JardinClient() {
  const searchParams = useSearchParams();
  const periodFromUrl = searchParams.get("period")?.trim() as SynthesePeriod | null;
  const initialPeriod = periodFromUrl && validPeriods.includes(periodFromUrl) ? periodFromUrl : "week";

  const [period, setPeriodState] = useState<SynthesePeriod>(initialPeriod);
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(new Set());
  const [data, setData] = useState<SyntheseData | null>(null);
  const [avatarType, setAvatarType] = useState<AvatarType>("arbre");
  const [loading, setLoading] = useState(true);

  const setPeriod = useCallback((p: SynthesePeriod) => {
    setPeriodState(p);
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", p);
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [searchParams]);

  useEffect(() => {
    const p = periodFromUrl && validPeriods.includes(periodFromUrl) ? periodFromUrl : "week";
    setPeriodState(p);
  }, [periodFromUrl]);

  const fetchSynthese = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (selectedLanguages.size > 0) {
        params.set("languages", Array.from(selectedLanguages).join(","));
      }
      const res = await fetch(`/api/synthese?${params}`);
      const json = await res.json().catch(() => ({}));
      if (res.ok) setData(json);
      else setData(null);
    } finally {
      setLoading(false);
    }
  }, [period, selectedLanguages]);

  useEffect(() => {
    fetchSynthese();
  }, [fetchSynthese]);

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

  const toggleLanguage = (code: string) => {
    setSelectedLanguages((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const calendarDays = getCalendarDays(period, data?.sessionsByDay ?? {});
  const totalSessions = data
    ? Object.values(data.sessionsByDay).reduce((acc, d) => acc + d.count, 0)
    : 0;
  const avatarStateNum = data ? (Math.min(5, Math.max(1, data.avatarState)) as 1 | 2 | 3 | 4 | 5) : 1;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <BackLink href="/app" />

      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-3xl">
          Synthèse
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Vue d’ensemble de ta progression et de ton activité.
        </p>
      </header>

      {/* Barre période + langues */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PERIOD_LABELS) as SynthesePeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-p3-turquoise focus-visible:ring-offset-2 ${
                period === p
                  ? "bg-p3-turquoise text-white shadow-sm dark:bg-p3-turquoise/90 dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        {data && data.languagesAvailable.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Langues :
            </span>
            {data.languagesAvailable.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => toggleLanguage(code)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-p3-turquoise focus-visible:ring-offset-2 ${
                  selectedLanguages.has(code)
                    ? "bg-p3-turquoise/20 text-p3-turquoise dark:bg-p3-turquoise/30 dark:text-p3-turquoise"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600"
                }`}
              >
                {langLabel(code)}
              </button>
            ))}
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {selectedLanguages.size === 0 ? "Toutes" : ""}
            </span>
          </div>
        )}
      </div>

      {loading && !data ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700"
                aria-hidden
              />
            ))}
          </div>
          <div className="h-48 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" aria-hidden />
        </div>
      ) : data ? (
        <>
          {/* Bloc hero : avatar + message + paramètres */}
          <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-p3-turquoise/5 to-transparent p-6 dark:border-slate-600 dark:from-p3-turquoise/10">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col items-center gap-3 text-center sm:text-left">
                <SyntheseAvatar
                  state={avatarStateNum}
                  type={avatarType}
                  showLabel
                />
                <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">
                  {ENCOURAGEMENT[avatarStateNum]}
                </p>
              </div>
              <Link
                href="/app/parametres"
                className="text-sm text-slate-500 underline decoration-slate-300 hover:text-p3-turquoise hover:decoration-p3-turquoise dark:text-slate-400 dark:decoration-slate-600"
              >
                Changer l’avatar (arbre, phénix, koala)
              </Link>
            </div>
          </section>

          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-600 dark:bg-slate-800">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-p3-turquoise/10 text-p3-turquoise dark:bg-p3-turquoise/20">
                <IconClock className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Temps passé
                </p>
                <p className="mt-0.5 text-xl font-bold text-slate-800 dark:text-slate-100">
                  {formatDuration(data.totalDurationSeconds)}
                </p>
              </div>
            </div>
            <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-600 dark:bg-slate-800">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-p3-turquoise/10 text-p3-turquoise dark:bg-p3-turquoise/20">
                <IconPlay className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Sessions
                </p>
                <p className="mt-0.5 text-xl font-bold text-slate-800 dark:text-slate-100">
                  {totalSessions}
                </p>
              </div>
            </div>
            <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-600 dark:bg-slate-800">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-p3-turquoise/10 text-p3-turquoise dark:bg-p3-turquoise/20">
                <IconCheck className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Mots mémorisés
                </p>
                <p className="mt-0.5 text-xl font-bold text-slate-800 dark:text-slate-100">
                  {data.wordsRetained}
                </p>
              </div>
            </div>
            <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-600 dark:bg-slate-800">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-p3-turquoise/10 text-p3-turquoise dark:bg-p3-turquoise/20">
                <IconPencil className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Mots écrits
                </p>
                <p className="mt-0.5 text-xl font-bold text-slate-800 dark:text-slate-100">
                  {data.wordsWritten}
                </p>
              </div>
            </div>
          </div>

          {/* Activité : heatmap lisible */}
          {calendarDays.length > 0 && (
            <ActiviteSection
              period={period}
              calendarDays={calendarDays}
              formatDuration={formatDuration}
            />
          )}
        </>
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-600 dark:bg-slate-800/50">
          <p className="text-slate-600 dark:text-slate-400">
            Aucune activité sur cette période.
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">
            Lance une session d’évaluation pour voir ta progression ici.
          </p>
          <Link
            href="/app/revision"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-p3-turquoise px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-p3-turquoise/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-p3-turquoise focus-visible:ring-offset-2 dark:text-slate-900"
          >
            Commencer une session
          </Link>
        </section>
      )}
    </div>
  );
}

type CalendarDay = {
  dateKey: string;
  label: string;
  count: number;
  durationSeconds: number;
  /** Pour la vue mois : numéro du jour (1-31) ou 0 si padding */
  dayNum?: number;
  /** Pour la vue mois : libellé court (ex. "Lun") */
  weekdayLabel?: string;
};

function ActiviteSection({
  period,
  calendarDays,
  formatDuration,
}: {
  period: SynthesePeriod;
  calendarDays: CalendarDay[];
  formatDuration: (s: number) => string;
}) {
  const maxDur = Math.max(...calendarDays.map((d) => d.durationSeconds), 1);
  const cols = period === "year" ? 12 : 7;

  const getLevel = (durationSeconds: number) => {
    if (durationSeconds === 0) return 0;
    const intensity = durationSeconds / maxDur;
    if (intensity > 0.75) return 4;
    if (intensity > 0.5) return 3;
    if (intensity > 0.25) return 2;
    return 1;
  };

  const getTooltip = (d: CalendarDay) => {
    if (d.durationSeconds === 0 && d.count === 0) {
      return period === "year" ? d.label : `${d.label} — Aucune révision`;
    }
    return `${d.label} — ${d.count} session${d.count !== 1 ? "s" : ""}, ${formatDuration(d.durationSeconds)}`;
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-600 dark:bg-slate-800">
      <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
        Activité
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {period === "year"
          ? "Chaque carré = un mois. Plus c'est foncé, plus tu as révisé ce mois-là."
          : period === "all"
            ? "Chaque carré = un jour (35 derniers jours). Plus c'est foncé, plus tu as révisé ce jour-là."
            : "Chaque carré = un jour. Plus c'est foncé, plus tu as passé de temps à réviser ce jour-là."}
      </p>

      {/* En-têtes des jours de la semaine pour la vue mois */}
      {period === "month" && (
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((w) => (
            <div
              key={w}
              className="flex aspect-square items-center justify-center rounded-md text-xs font-medium text-slate-400 dark:text-slate-500"
            >
              {w}
            </div>
          ))}
        </div>
      )}

      <div
        className={`grid gap-1.5 ${period === "month" ? "mt-1.5" : "mt-4"}`}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {calendarDays.map((d) => {
          const level = getLevel(d.durationSeconds);
          const isEmpty = d.durationSeconds === 0 && d.count === 0;
          return (
            <div
              key={d.dateKey}
              title={getTooltip(d)}
              className={`flex aspect-square flex-col items-center justify-center rounded-lg text-center transition ${
                level === 0
                  ? "bg-slate-100 dark:bg-slate-700/50"
                  : level === 1
                    ? "bg-p3-turquoise/25 text-slate-700 dark:bg-p3-turquoise/20 dark:text-slate-300"
                    : level === 2
                      ? "bg-p3-turquoise/45 text-slate-800 dark:bg-p3-turquoise/35 dark:text-slate-200"
                      : level === 3
                        ? "bg-p3-turquoise/65 text-slate-900 dark:bg-p3-turquoise/55 dark:text-slate-100"
                        : "bg-p3-turquoise text-white dark:bg-p3-turquoise/90 dark:text-slate-900"
              }`}
            >
              <span className="text-xs font-medium">
                {period === "day"
                  ? (d.label || "Auj.")
                  : period === "week"
                    ? d.label
                    : period === "month"
                      ? (d.dayNum && d.dayNum > 0 ? String(d.dayNum) : "")
                      : d.label}
              </span>
              {!isEmpty && period !== "year" && (
                <span className="mt-0.5 text-[10px] font-medium opacity-90">
                  {d.durationSeconds < 60
                    ? `${d.durationSeconds}s`
                    : `${Math.floor(d.durationSeconds / 60)} min`}
                </span>
              )}
              {!isEmpty && period === "year" && (
                <span className="mt-0.5 text-[10px] font-medium opacity-90">
                  {formatDuration(d.durationSeconds)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4 dark:border-slate-600">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium">Légende :</span> plus le carré est foncé, plus le temps de révision est important. Passe la souris sur un carré pour voir le détail.
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Moins</span>
          <span className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((level) => (
              <span
                key={level}
                className={`inline-block h-3 w-3 rounded ${
                  level === 0
                    ? "bg-slate-100 dark:bg-slate-700/50"
                    : level === 1
                      ? "bg-p3-turquoise/25"
                      : level === 2
                        ? "bg-p3-turquoise/45"
                        : level === 3
                          ? "bg-p3-turquoise/65"
                          : "bg-p3-turquoise"
                }`}
                aria-hidden
              />
            ))}
          </span>
          <span>Plus</span>
        </div>
      </div>
    </section>
  );
}

function getCalendarDays(
  period: SynthesePeriod,
  sessionsByDay: Record<string, { count: number; durationSeconds: number }>
): CalendarDay[] {
  const now = new Date();
  const out: CalendarDay[] = [];
  const weekdays = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  if (period === "day") {
    const today = now.toISOString().slice(0, 10);
    const s = sessionsByDay[today] ?? { count: 0, durationSeconds: 0 };
    out.push({
      dateKey: today,
      label: "Aujourd'hui",
      count: s.count,
      durationSeconds: s.durationSeconds,
    });
    return out;
  }

  if (period === "week") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const dayLabel = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][d.getDay()];
      const dayNum = d.getDate();
      const isToday = i === 0;
      const s = sessionsByDay[dateKey] ?? { count: 0, durationSeconds: 0 };
      out.push({
        dateKey,
        label: isToday ? "Auj." : `${dayLabel} ${dayNum}`,
        count: s.count,
        durationSeconds: s.durationSeconds,
      });
    }
    return out;
  }

  if (period === "month") {
    const year = now.getFullYear();
    const month = now.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(now);
    const firstWeekday = (first.getDay() + 6) % 7; // Lun = 0
    for (let i = 0; i < firstWeekday; i++) {
      out.push({
        dateKey: `pad-${i}`,
        label: "",
        count: 0,
        durationSeconds: 0,
        dayNum: 0,
      });
    }
    for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().slice(0, 10);
      const s = sessionsByDay[dateKey] ?? { count: 0, durationSeconds: 0 };
      const dayNum = d.getDate();
      const weekdayLabel = weekdays[d.getDay()];
      out.push({
        dateKey,
        label: `${weekdayLabel} ${dayNum}`,
        count: s.count,
        durationSeconds: s.durationSeconds,
        dayNum,
        weekdayLabel,
      });
    }
    return out;
  }

  if (period === "year") {
    const monthNames = [
      "Janv", "Fév", "Mars", "Avr", "Mai", "Juin",
      "Juil", "Août", "Sept", "Oct", "Nov", "Déc",
    ];
    for (let m = 0; m < 12; m++) {
      const d = new Date(now.getFullYear(), m, 1);
      const dateKey = d.toISOString().slice(0, 7);
      let count = 0;
      let durationSeconds = 0;
      for (const [key, s] of Object.entries(sessionsByDay)) {
        if (key.startsWith(dateKey)) {
          count += s.count;
          durationSeconds += s.durationSeconds;
        }
      }
      out.push({
        dateKey,
        label: monthNames[m],
        count,
        durationSeconds,
      });
    }
    return out;
  }

  if (period === "all") {
    const keys = Object.keys(sessionsByDay).sort();
    const recent = keys.slice(-35);
    for (const dateKey of recent) {
      const s = sessionsByDay[dateKey] ?? { count: 0, durationSeconds: 0 };
      const d = new Date(dateKey);
      const dayLabel = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][d.getDay()];
      out.push({
        dateKey,
        label: `${dayLabel} ${d.getDate()}/${d.getMonth() + 1}`,
        count: s.count,
        durationSeconds: s.durationSeconds,
      });
    }
    return out;
  }

  return out;
}
