"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Zap, ArrowRight, Plus, Flame, Brain, Folder, ChartColumn } from "lucide-react";
import { ProfesseurSM2Modal } from "@/components/professeur-sm2-modal";
import WeeklyGoal from "@/components/WeeklyGoal";

type StreakData = { currentStreak: number; longestStreak: number };
type Stats = {
  listsCount: number;
  wordsCount: number;
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
          wordsCount: st.wordsCount ?? 0,
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
  const wordsCount = stats?.wordsCount ?? 0;
  const masteredCount = stats?.masteredWordsCount ?? 0;
  const libraryEmpty = listsCount === 0 || wordsCount === 0;

  const streakMessage =
    s === 0
      ? "Jour 1 — ta série commence maintenant."
      : s < 7
        ? "Tu progresses — continue comme ça."
        : "Tu es dans le rythme — ne lâche pas.";

  const homeCardStyle = {
    background: "var(--surface)",
    borderRadius: 16,
    border: "1px solid var(--line)",
  } as const;
  const headingStyle = {
    fontFamily: "var(--font-heading)",
    fontWeight: 700,
    color: "var(--ink)",
  } as const;
  const inkBadgeStyle = {
    fontFamily: "var(--font-sans)",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--ink)",
    background: "var(--surface)",
    border: "1.5px solid var(--ink)",
    borderRadius: 999,
    minHeight: 44,
    padding: "0 12px",
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
  } as const;
  const iconTileStyle = {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "var(--surface)",
    border: "1.5px solid var(--line)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  } as const;

  return (
    <div className="flex flex-col gap-[10px]">
      <div
        className="grid grid-cols-1 md:grid-cols-2"
        style={{ gap: 12, marginBottom: 12 }}
      >
        {/* Carte streak */}
        <section
          className="relative flex min-h-0 min-w-0 flex-col"
          style={{
            gap: 10,
            ...homeCardStyle,
            padding: 16,
          }}
        >
          <div
            className="relative z-[1] flex justify-between"
            style={{ alignItems: "flex-start" }}
          >
            <div>
              <p
                className="nav-tab-mark inline-block"
                style={{
                  ...headingStyle,
                  fontSize: 42,
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
            <Flame className="shrink-0 text-ink" size={22} strokeWidth={1.8} aria-hidden />
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
            href={libraryEmpty ? "/app/familles/nouvelle-liste" : "/app/revision/express"}
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
            }}
            className="relative z-[1] flex min-h-11 cursor-pointer items-center justify-between rounded-full bg-ink px-4 py-2 no-underline transition-colors hover:bg-ink-hover"
          >
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5" style={{ gap: 6 }}>
                {libraryEmpty ? (
                  <Plus
                    className="h-[11px] w-[11px] shrink-0 text-white"
                    strokeWidth={2.2}
                    aria-hidden
                  />
                ) : (
                  <Zap
                    className="h-[11px] w-[11px] shrink-0 text-white"
                    strokeWidth={2.2}
                    aria-hidden
                  />
                )}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "white",
                  }}
                >
                  {libraryEmpty ? "Crée ta première liste →" : "Révision express"}
                </span>
              </div>
              <p
                style={{
                  fontSize: 10,
                  color: "color-mix(in srgb, white 80%, transparent)",
                  paddingLeft: 17,
                }}
              >
                {libraryEmpty
                  ? "Importe un texte ou crée une liste pour commencer."
                  : "5 min · 10 mots · SM-2"}
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
        className="inline-flex min-h-11 items-center gap-2 self-start text-ink transition hover:opacity-80"
        style={{
          ...headingStyle,
          fontSize: 16,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <Brain className="shrink-0" size={18} strokeWidth={1.8} aria-hidden />
        Pourquoi réviser maintenant ?
      </button>

      <ProfesseurSM2Modal open={sm2Open} onClose={() => setSm2Open(false)} />

      {/* 3 Cartes */}
      <div className="grid grid-cols-1 gap-[10px] md:grid-cols-3">
        {/* Bibliothèque */}
        <Link
          href="/app/familles"
          className="home-dash-card flex min-h-11 flex-col gap-2 no-underline"
          style={{
            borderRadius: 16,
            padding: "14px 12px",
            cursor: "pointer",
          }}
        >
          <div style={iconTileStyle}>
            <Folder className="text-ink" size={20} strokeWidth={1.8} aria-hidden />
          </div>
          <p style={{ ...headingStyle, fontSize: 16 }}>Bibliothèque</p>
          <span style={inkBadgeStyle}>
            {listsCount} liste{listsCount !== 1 ? "s" : ""}
          </span>
        </Link>

        {/* Révision */}
        <Link
          href="/app/revision"
          className="home-dash-card flex min-h-11 flex-col gap-2 no-underline"
          style={{
            borderRadius: 16,
            padding: "14px 12px",
            cursor: "pointer",
          }}
        >
          <div style={{ ...iconTileStyle, background: "var(--mark)", borderColor: "transparent" }}>
            <Zap className="text-ink" size={20} strokeWidth={1.8} aria-hidden />
          </div>
          <p style={{ ...headingStyle, fontSize: 16 }}>Révision</p>
          <span
            className={dueCount > 0 ? "badge-urgent" : ""}
            style={{ ...inkBadgeStyle, background: "var(--mark)", border: "none" }}
          >
            {dueCount} mot{dueCount !== 1 ? "s" : ""} à revoir
          </span>
        </Link>

        {/* Synthèse */}
        <Link
          href="/app/jardin"
          className="home-dash-card flex min-h-11 flex-col gap-2 no-underline"
          style={{
            borderRadius: 16,
            padding: "14px 12px",
            cursor: "pointer",
          }}
        >
          <div style={iconTileStyle}>
            <ChartColumn className="text-ink" size={20} strokeWidth={1.8} aria-hidden />
          </div>
          <p style={{ ...headingStyle, fontSize: 16 }}>Synthèse</p>
          <span style={inkBadgeStyle}>
            {masteredCount} mot{masteredCount !== 1 ? "s" : ""} maîtrisé{masteredCount !== 1 ? "s" : ""}
          </span>
        </Link>
      </div>
    </div>
  );
}
