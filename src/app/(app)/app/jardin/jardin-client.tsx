"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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

export function JardinClient() {
  const [period, setPeriod] = useState<SynthesePeriod>("week");
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(new Set());
  const [data, setData] = useState<SyntheseData | null>(null);
  const [avatarType, setAvatarType] = useState<AvatarType>("arbre");
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-vocab-gray hover:text-primary dark:text-slate-400 dark:hover:text-primary-light"
        >
          ← Retour
        </Link>
      </div>

      <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
        Synthèse
      </h1>

      {/* Sélecteur de période */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PERIOD_LABELS) as SynthesePeriod[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`btn-relief rounded-lg border px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              period === p
                ? "border-p3-turquoise bg-p3-turquoise/15 text-p3-turquoise dark:bg-p3-turquoise/25 dark:text-p3-turquoise"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Filtre par langue */}
      {data && data.languagesAvailable.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-600 dark:bg-slate-800">
          <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            Langues
          </p>
          <div className="flex flex-wrap gap-3">
            {data.languagesAvailable.map((code) => (
              <label
                key={code}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 transition hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
              >
                <input
                  type="checkbox"
                  checked={selectedLanguages.has(code)}
                  onChange={() => toggleLanguage(code)}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary dark:border-slate-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {langLabel(code)}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Aucune sélection = toutes les langues
          </p>
        </div>
      )}

      {loading && !data ? (
        <p className="text-slate-500 dark:text-slate-400">Chargement…</p>
      ) : data ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Avatar */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-600 dark:bg-slate-800">
              <SyntheseAvatar
                state={Math.min(5, Math.max(1, data.avatarState)) as 1 | 2 | 3 | 4 | 5}
                type={avatarType}
                showLabel
              />
            </div>
            {/* Temps total */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-600 dark:bg-slate-800">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Temps passé
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                {formatDuration(data.totalDurationSeconds)}
              </p>
            </div>
            {/* Mots mémorisés */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-600 dark:bg-slate-800">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Mots mémorisés
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                {data.wordsRetained}
              </p>
            </div>
            {/* Mots écrits */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-600 dark:bg-slate-800">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Mots écrits
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                {data.wordsWritten}
              </p>
            </div>
          </div>

          {/* Vue calendaire (heatmap style) */}
          {calendarDays.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-600 dark:bg-slate-800">
              <p className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                Activité
              </p>
              <div
                className="grid gap-1.5"
                style={{
                  gridTemplateColumns: `repeat(7, minmax(0, 1fr))`,
                }}
              >
                {calendarDays.map(({ dateKey, label, count, durationSeconds }) => {
                  const maxDur =
                    Math.max(
                      ...calendarDays.map((d) => d.durationSeconds),
                      1
                    ) || 1;
                  const intensity = durationSeconds / maxDur;
                  const level =
                    durationSeconds === 0
                      ? 0
                      : intensity > 0.75
                        ? 4
                        : intensity > 0.5
                          ? 3
                          : intensity > 0.25
                            ? 2
                            : 1;
                  return (
                    <div
                      key={dateKey}
                      title={`${label}: ${count} session(s), ${formatDuration(durationSeconds)}`}
                      className={`flex aspect-square items-center justify-center rounded-md text-xs font-medium transition ${
                        level === 0
                          ? "bg-slate-100 dark:bg-slate-700/50"
                          : level === 1
                            ? "bg-p3-turquoise/20 text-slate-600 dark:text-slate-400"
                            : level === 2
                              ? "bg-p3-turquoise/40 text-slate-700 dark:text-slate-300"
                              : level === 3
                                ? "bg-p3-turquoise/60 text-slate-800 dark:text-slate-200"
                                : "bg-p3-turquoise text-white dark:bg-p3-turquoise/80"
                      }`}
                    >
                      {period === "day" || period === "week" ? label : ""}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-slate-500 dark:text-slate-400">
          Aucune donnée pour cette période.
        </p>
      )}

      <p className="text-sm text-slate-500 dark:text-slate-400">
        <Link href="/app/parametres" className="underline hover:text-primary">
          Paramètres
        </Link>
        {" "}
        — Choisir le type d&apos;avatar (arbre, phénix, koala).
      </p>
    </div>
  );
}

function getCalendarDays(
  period: SynthesePeriod,
  sessionsByDay: Record<string, { count: number; durationSeconds: number }>
): { dateKey: string; label: string; count: number; durationSeconds: number }[] {
  const now = new Date();
  const out: { dateKey: string; label: string; count: number; durationSeconds: number }[] = [];

  if (period === "day") {
    const today = now.toISOString().slice(0, 10);
    const s = sessionsByDay[today] ?? { count: 0, durationSeconds: 0 };
    out.push({
      dateKey: today,
      label: "Auj.",
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
      const s = sessionsByDay[dateKey] ?? { count: 0, durationSeconds: 0 };
      out.push({
        dateKey,
        label: i === 0 ? "Auj." : dayLabel,
        count: s.count,
        durationSeconds: s.durationSeconds,
      });
    }
    return out;
  }

  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().slice(0, 10);
      const s = sessionsByDay[dateKey] ?? { count: 0, durationSeconds: 0 };
      out.push({
        dateKey,
        label: String(d.getDate()),
        count: s.count,
        durationSeconds: s.durationSeconds,
      });
    }
    return out;
  }

  if (period === "year") {
    for (let m = 11; m >= 0; m--) {
      const d = new Date(now.getFullYear(), m, 1);
      const dateKey = d.toISOString().slice(0, 7);
      const monthLabel = [
        "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
        "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
      ][d.getMonth()];
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
        label: monthLabel,
        count,
        durationSeconds,
      });
    }
    return out.reverse();
  }

  if (period === "all") {
    const keys = Object.keys(sessionsByDay).sort();
    const recent = keys.slice(-35);
    for (const dateKey of recent) {
      const s = sessionsByDay[dateKey] ?? { count: 0, durationSeconds: 0 };
      const d = new Date(dateKey);
      out.push({
        dateKey,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        count: s.count,
        durationSeconds: s.durationSeconds,
      });
    }
    return out;
  }

  return out;
}
