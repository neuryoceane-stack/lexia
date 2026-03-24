"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";
import { ProfesseurSM2Modal } from "@/components/professeur-sm2-modal";
import WeeklyGoal from "@/components/WeeklyGoal";

type StreakData = { currentStreak: number; longestStreak: number };
type Stats = {
  listsCount: number;
  dueWordsCount: number;
  masteredWordsCount: number;
};

export function DashboardClient() {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayStreak, setDisplayStreak] = useState(0);
  const animatedRef = useRef(false);
  const [sm2Open, setSm2Open] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/streak", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/dashboard/stats", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([sd, st]) => {
        setStreak({
          currentStreak: sd.currentStreak ?? 0,
          longestStreak: sd.longestStreak ?? 0,
        });
        setStats({
          listsCount: st.listsCount ?? 0,
          dueWordsCount: st.dueWordsCount ?? 0,
          masteredWordsCount: st.masteredWordsCount ?? 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const end = streak?.currentStreak ?? 0;
    if (end === 0 || animatedRef.current) {
      setDisplayStreak(end);
      return;
    }
    animatedRef.current = true;
    const duration = 600;
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayStreak(Math.round(end * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [streak]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="skeleton" style={{ height: 160 }} />
        <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 120 }} />
          ))}
        </div>
      </div>
    );
  }

  const s = streak?.currentStreak ?? 0;
  const dueCount = stats?.dueWordsCount ?? 0;
  const listsCount = stats?.listsCount ?? 0;
  const masteredCount = stats?.masteredWordsCount ?? 0;

  const streakMessage =
    s === 0
      ? "Jour 1 — ta série commence maintenant."
      : s < 7
        ? "Tu progresses — continue comme ça."
        : "Tu es dans le rythme — ne lâche pas.";

  const streakBorderTertiary = "rgba(108, 63, 200, 0.14)";

  return (
    <div className="flex flex-col gap-[10px] bg-[var(--background)]">
      <div
        className="grid grid-cols-1 md:grid-cols-2"
        style={{ gap: 12, marginBottom: 12 }}
      >
        {/* Carte streak */}
        <section
          className="relative flex min-h-0 min-w-0 flex-col overflow-hidden"
          style={{
            gap: 10,
            background: "#FFFFFF",
            borderRadius: 14,
            border: `0.5px solid ${streakBorderTertiary}`,
            padding: 16,
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              bottom: -18,
              right: -18,
              width: 70,
              height: 70,
              borderRadius: "50%",
              background: "#F5A623",
              opacity: 0.07,
            }}
          />

          <div
            className="relative z-[1] flex justify-between"
            style={{ alignItems: "flex-start" }}
          >
            <div>
              <p
                style={{
                  fontSize: 42,
                  fontWeight: 500,
                  color: "#F5A623",
                  lineHeight: 1,
                }}
              >
                {displayStreak}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--foreground-muted)",
                  marginTop: 4,
                }}
              >
                jour{s !== 1 ? "s" : ""} d&apos;affilée
              </p>
            </div>
            <span style={{ fontSize: 22 }} aria-hidden>
              🔥
            </span>
          </div>

          <div className="relative z-[1] space-y-1">
            <p
              style={{
                fontSize: 12,
                color: "var(--foreground-muted)",
                lineHeight: 1.5,
              }}
            >
              {streakMessage}
            </p>
            <p
              style={{
                fontSize: 12,
                color: "var(--foreground-muted)",
                lineHeight: 1.5,
              }}
            >
              {dueCount} mot{dueCount !== 1 ? "s" : ""} à revoir aujourd&apos;hui
            </p>
          </div>

          <Link
            href="/app/revision/express"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
            }}
            className="relative z-[1] flex cursor-pointer items-center justify-between no-underline transition hover:brightness-95"
            style={{
              background: "#F5A623",
              borderRadius: 10,
              padding: "8px 12px",
            }}
          >
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5" style={{ gap: 6 }}>
                <Zap
                  className="h-[11px] w-[11px] shrink-0 text-white"
                  strokeWidth={2.2}
                  aria-hidden
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#FFFFFF",
                  }}
                >
                  Révision express
                </span>
              </div>
              <p
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.8)",
                  paddingLeft: 17,
                }}
              >
                5 min · 10 mots · SM-2
              </p>
            </div>
            <ArrowRight
              className="h-[13px] w-[13px] shrink-0 text-white"
              strokeWidth={2.2}
              aria-hidden
            />
          </Link>
        </section>

        <div className="min-h-0 min-w-0">
          <WeeklyGoal />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setSm2Open(true)}
        className="self-start text-[12px] font-medium text-[var(--primary)] transition hover:opacity-80"
        style={{
          color: "var(--primary)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          marginTop: -4,
        }}
      >
        🧠 Pourquoi réviser maintenant ?
      </button>

      <ProfesseurSM2Modal open={sm2Open} onClose={() => setSm2Open(false)} />

      {/* 3 Cartes */}
      <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-3">
        {/* Bibliothèque */}
        <Link
          href="/app/familles"
          className="card-hover flex flex-col gap-2 no-underline"
          style={{
            background: "var(--background-subtle)",
            border: "0.5px solid #DDD6F5",
            borderRadius: 10,
            padding: "14px 12px",
            cursor: "pointer",
          }}
        >
          <div className="flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 7, background: "#DDD6F5" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6C3FC8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>Bibliothèque</p>
          <span style={{ fontSize: 11, fontWeight: 500, color: "#6C3FC8", background: "#DDD6F5", borderRadius: 100, padding: "2px 8px", width: "fit-content" }}>
            {listsCount} liste{listsCount !== 1 ? "s" : ""}
          </span>
        </Link>

        {/* Évaluation */}
        <Link
          href="/app/revision"
          className="card-hover flex flex-col gap-2 no-underline"
          style={{
            background: "var(--background-card)",
            border: "0.5px solid #FAE5B0",
            borderRadius: 10,
            padding: "14px 12px",
            cursor: "pointer",
          }}
        >
          <div className="flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 7, background: "#FAE5B0" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C47D0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>Évaluation</p>
          <span
            className={dueCount > 0 ? "badge-urgent" : ""}
            style={{ fontSize: 11, fontWeight: 500, color: "#C47D0A", background: "#FAE5B0", borderRadius: 100, padding: "2px 8px", width: "fit-content" }}
          >
            {dueCount} mot{dueCount !== 1 ? "s" : ""} à revoir
          </span>
        </Link>

        {/* Synthèse */}
        <Link
          href="/app/jardin"
          className="card-hover flex flex-col gap-2 no-underline"
          style={{
            background: "var(--background-card)",
            border: "0.5px solid #C3E6D6",
            borderRadius: 10,
            padding: "14px 12px",
            cursor: "pointer",
          }}
        >
          <div className="flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 7, background: "#C3E6D6" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
            </svg>
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>Synthèse</p>
          <span style={{ fontSize: 11, fontWeight: 500, color: "#1D9E75", background: "#C3E6D6", borderRadius: 100, padding: "2px 8px", width: "fit-content" }}>
            {masteredCount} mot{masteredCount !== 1 ? "s" : ""} maîtrisé{masteredCount !== 1 ? "s" : ""}
          </span>
        </Link>
      </div>
    </div>
  );
}
