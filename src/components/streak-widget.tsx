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
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="h-16 animate-pulse rounded-lg bg-page" aria-hidden />
      </div>
    );
  }

  const streak = data?.currentStreak ?? 0;
  const longest = data?.longestStreak ?? 0;

  return (
    <div className="rounded-2xl border border-line bg-gradient-to-br from-surface to-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-mark text-3xl"
            aria-hidden
          >
            🔥
          </span>
          <div>
            <p className="text-lg font-bold text-ink">
              {streak > 0 ? (
                <>
                  {streak} jour{streak !== 1 ? "s" : ""} d&apos;affilée
                </>
              ) : (
                "Aucune série en cours"
              )}
            </p>
            <p className="text-sm text-muted">
              {streak > 0
                ? "Continue comme ça ! Réviser chaque jour entretient ta mémoire."
                : "Lance une session de révision aujourd’hui pour commencer ta série."}
            </p>
          </div>
        </div>
        {longest > 0 && (
          <p className="text-sm text-ink">
            Record : <span className="font-semibold">{longest} jours</span>
          </p>
        )}
        <Link
          href="/app/revision"
          className="shrink-0 rounded-full bg-surface0 px-4 py-2 text-sm font-medium text-surface shadow-sm hover:bg-ink-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
        >
          {streak > 0 ? "Réviser pour garder la série" : "Commencer une session"}
        </Link>
      </div>
    </div>
  );
}
