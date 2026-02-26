"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type StreakData = {
  currentStreak: number;
  longestStreak: number;
};

export function StreakWidget() {
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/streak", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (typeof json.currentStreak === "number") {
          setData({
            currentStreak: json.currentStreak,
            longestStreak: typeof json.longestStreak === "number" ? json.longestStreak : 0,
          });
        } else {
          setData(null);
        }
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-600 dark:bg-slate-800">
        <div className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-700" aria-hidden />
      </div>
    );
  }

  const streak = data?.currentStreak ?? 0;
  const longest = data?.longestStreak ?? 0;

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm dark:border-amber-800/50 dark:from-amber-950/30 dark:to-orange-950/20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-3xl dark:bg-amber-900/40"
            aria-hidden
          >
            🔥
          </span>
          <div>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {streak > 0 ? (
                <>
                  {streak} jour{streak !== 1 ? "s" : ""} d&apos;affilée
                </>
              ) : (
                "Aucune série en cours"
              )}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {streak > 0
                ? "Continue comme ça ! Réviser chaque jour entretient ta mémoire."
                : "Lance une session de révision aujourd’hui pour commencer ta série."}
            </p>
          </div>
        </div>
        {longest > 0 && (
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Record : <span className="font-semibold">{longest} jours</span>
          </p>
        )}
        <Link
          href="/app/revision"
          className="shrink-0 rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:bg-amber-600 dark:hover:bg-amber-700"
        >
          {streak > 0 ? "Réviser pour garder la série" : "Commencer une session"}
        </Link>
      </div>
    </div>
  );
}
