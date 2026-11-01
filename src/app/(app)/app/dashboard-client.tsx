"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Zap,
  ArrowRight,
  Flame,
  Brain,
  Folder,
  ChartColumn,
  ChevronRight,
} from "lucide-react";
import { ProfesseurSM2Modal } from "@/components/professeur-sm2-modal";
import WeeklyGoal from "@/components/WeeklyGoal";

type StreakData = { currentStreak: number; longestStreak: number };
type Stats = {
  listsCount: number;
  wordsCount: number;
  dueWordsCount: number;
  masteredWordsCount: number;
};
type HomeList = {
  id: string;
  familyId: string;
  name: string;
  language: string | null;
  wordCount: number;
  progressPercent: number;
  dueTodayCount: number;
};

const headingStyle = {
  fontFamily: "var(--font-heading)",
  fontWeight: 700,
  color: "var(--ink)",
} as const;

const inkChipStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--ink)",
  background: "var(--surface)",
  border: "1.5px solid var(--ink)",
  borderRadius: 999,
  padding: "6px 12px",
  display: "inline-flex",
  alignItems: "center",
  width: "fit-content",
} as const;

const markChipStyle = {
  ...inkChipStyle,
  background: "var(--mark)",
  border: "none",
} as const;

const iconWellStyle = {
  width: 44,
  height: 44,
  borderRadius: 999,
  background: "var(--surface)",
  border: "1.5px solid var(--line)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
} as const;

const markWellStyle = {
  ...iconWellStyle,
  background: "var(--mark)",
  border: "none",
} as const;

function HandUnderline() {
  return (
    <svg width="78" height="10" viewBox="0 0 78 10" aria-hidden style={{ display: "block", marginTop: 2 }}>
      <path
        d="M2 6.5 C 10 2.5, 16 8.5, 24 5.2 S 36 1.8, 44 6.2 S 56 9.2, 64 4.4 S 72 2.2, 76 5.4"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export function DashboardClient() {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lists, setLists] = useState<HomeList[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [listsError, setListsError] = useState<string | null>(null);
  const [displayStreak, setDisplayStreak] = useState(0);
  const animatedRef = useRef(false);
  const [sm2Open, setSm2Open] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/streak", { cache: "no-store" }),
      fetch("/api/dashboard/stats", { cache: "no-store" }),
      fetch("/api/user/profile", { cache: "no-store" }),
      fetch("/api/bibliotheque?sort=created", { cache: "no-store" }),
    ])
      .then(async ([streakRes, statsRes, profileRes, listsRes]) => {
        if (!streakRes.ok || !statsRes.ok) {
          setLoadError("L'accueil n'a pas pu être chargé.");
        } else {
          const sd = await streakRes.json();
          const st = await statsRes.json();
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
        }

        if (!profileRes.ok) {
          setProfileError("Le prénom n'a pas pu être chargé.");
        } else {
          const profile = await profileRes.json();
          const name = typeof profile.firstName === "string" ? profile.firstName.trim() : "";
          setFirstName(name);
        }

        if (!listsRes.ok) {
          setListsError("Les listes n'ont pas pu être chargées.");
        } else {
          const body = await listsRes.json();
          if (!Array.isArray(body.lists)) {
            setListsError("Les listes n'ont pas pu être chargées.");
          } else {
            setLists(
              body.lists.slice(0, 3).map((row: HomeList) => ({
                id: row.id,
                familyId: row.familyId,
                name: row.name,
                language: row.language,
                wordCount: row.wordCount ?? 0,
                progressPercent: row.progressPercent ?? 0,
                dueTodayCount: row.dueTodayCount ?? 0,
              }))
            );
          }
        }
      })
      .catch(() => setLoadError("L'accueil n'a pas pu être chargé."))
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
      <div className="space-y-4">
        <div className="skeleton" style={{ height: 56, borderRadius: 12 }} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 220, borderRadius: 20 }} />
          ))}
        </div>
      </div>
    );
  }

  if (loadError || !streak || !stats) {
    return (
      <p role="alert" style={{ color: "var(--false-text)", fontSize: 15 }}>
        {loadError ?? "L'accueil n'a pas pu être chargé."}
      </p>
    );
  }

  const s = streak.currentStreak;
  const dueCount = stats.dueWordsCount;
  const listsCount = stats.listsCount;
  const wordsCount = stats.wordsCount;
  const masteredCount = stats.masteredWordsCount;
  const libraryEmpty = listsCount === 0 || wordsCount === 0;
  const expressHref = libraryEmpty ? "/app/familles/nouvelle-liste" : "/app/revision/express";

  const streakMessage =
    s === 0
      ? "Jour 1 — ta série commence maintenant."
      : s < 7
        ? "Tu progresses — continue comme ça."
        : "Tu es dans le rythme — ne lâche pas.";

  const greetingName = firstName && firstName.length > 0 ? firstName : null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1
          style={{
            ...headingStyle,
            letterSpacing: "-0.02em",
            lineHeight: 1.12,
          }}
          className="text-[38px] md:text-[46px]"
        >
          {greetingName ? `Salut ${greetingName}, ` : "Salut, "}
          <br className="md:hidden" />
          {"tes "}
          <span className="marker">mots du jour</span>
        </h1>
        {profileError && (
          <p role="alert" className="mt-2" style={{ color: "var(--false-text)", fontSize: 14 }}>
            {profileError}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
        <section
          className="flex flex-col"
          style={{
            background: "var(--ink)",
            color: "var(--surface)",
            borderRadius: 20,
            padding: 20,
            gap: 10,
          }}
        >
          <div className="flex items-center gap-2">
            <Flame size={22} strokeWidth={1.8} color="var(--mark)" fill="var(--mark)" aria-hidden />
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: 24,
                lineHeight: 1.15,
                color: "var(--surface)",
              }}
            >
              <span className="marker">{displayStreak}</span>
              {" "}
              jour{displayStreak !== 1 ? "s" : ""} d&apos;affilée
            </p>
          </div>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.45,
              color: "color-mix(in srgb, var(--surface) 82%, var(--ink))",
            }}
          >
            {streakMessage}
          </p>
        </section>

        <WeeklyGoal />

        <section
          className="flex flex-col gap-4"
          style={{
            background: "var(--surface)",
            border: "1.5px solid var(--ink)",
            borderRadius: 20,
            padding: 20,
          }}
        >
          <div className="flex items-center gap-3 md:items-start">
            <span style={markWellStyle}>
              <Zap size={20} strokeWidth={1.8} color="var(--ink)" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className="whitespace-nowrap text-[16px] md:text-[20px]"
                style={{ ...headingStyle, lineHeight: 1.15 }}
              >
                Révision express
              </p>
              <p style={{ marginTop: 4, fontSize: 14, color: "var(--ink)", fontWeight: 500 }}>
                <span className="marker">
                  {dueCount} mot{dueCount !== 1 ? "s" : ""}
                </span>{" "}
                à revoir
                <span className="hidden md:inline"> · 5 min</span>
              </p>
            </div>
            <Link
              href={expressHref}
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(10);
              }}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-ink px-3.5 text-surface no-underline transition-colors hover:bg-ink-hover md:hidden"
              style={{ fontWeight: 500, fontSize: 14 }}
            >
              Commencer
            </Link>
          </div>
          <Link
            href={expressHref}
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
            }}
            className="mt-auto hidden h-14 items-center justify-center gap-2 rounded-full bg-ink px-5 text-surface no-underline transition-colors hover:bg-ink-hover md:inline-flex"
            style={{ fontWeight: 500, fontSize: 16 }}
          >
            Commencer
            <ArrowRight size={18} strokeWidth={1.8} aria-hidden />
          </Link>
        </section>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 style={{ ...headingStyle, fontSize: 24, lineHeight: 1.1 }}>Tes listes</h2>
            <HandUnderline />
          </div>
          <Link
            href="/app/familles"
            className="hidden min-h-11 items-center text-ink underline underline-offset-4 md:inline-flex"
            style={{ fontSize: 14, fontWeight: 500 }}
          >
            Voir la bibliothèque
          </Link>
        </div>

        {listsError ? (
          <p role="alert" style={{ color: "var(--false-text)", fontSize: 14 }}>
            {listsError}
          </p>
        ) : lists && lists.length === 0 ? (
          <div className="flex flex-col items-start gap-2">
            <Link
              href="/app/familles/nouvelle-liste"
              className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-surface no-underline transition-colors hover:bg-ink-hover"
              style={{ fontWeight: 500, fontSize: 15 }}
            >
              Crée ta première liste
            </Link>
            <p style={{ fontSize: 14, color: "var(--muted)" }}>
              Importe un texte ou crée une liste pour commencer.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {lists?.map((list) => {
              const code = list.language?.trim() ? list.language.trim().toUpperCase() : null;
              return (
                <Link
                  key={list.id}
                  href={`/app/familles/${list.familyId}/listes/${list.id}`}
                  className="home-dash-card flex min-h-11 items-center gap-3 no-underline md:flex-col md:items-stretch"
                  style={{ borderRadius: 20, padding: "14px 16px" }}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3 md:w-full">
                    {code && (
                      <span
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: 11,
                          fontWeight: 500,
                          letterSpacing: "0.04em",
                          color: "var(--ink)",
                          border: "1.5px solid var(--ink)",
                          borderRadius: 8,
                          padding: "4px 6px",
                          lineHeight: 1,
                          flexShrink: 0,
                        }}
                      >
                        {code}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p
                          className="truncate"
                          style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)" }}
                        >
                          {list.name}
                        </p>
                        <p
                          className="hidden shrink-0 md:block"
                          style={{ fontSize: 14, color: "var(--muted)" }}
                        >
                          {plural(list.wordCount, "mot", "mots")}
                        </p>
                      </div>
                      <p className="md:hidden" style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
                        {plural(list.wordCount, "mot", "mots")}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className="shrink-0 md:hidden"
                    size={18}
                    strokeWidth={1.8}
                    color="var(--muted)"
                    aria-hidden
                  />
                  <div className="hidden w-full flex-col gap-3 md:flex">
                    {list.wordCount > 0 && (
                      <div
                        style={{
                          height: 4,
                          borderRadius: 999,
                          background: "color-mix(in srgb, var(--line) 70%, var(--surface))",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(100, Math.max(0, list.progressPercent))}%`,
                            height: "100%",
                            background: "var(--ink)",
                          }}
                        />
                      </div>
                    )}
                    {list.dueTodayCount > 0 ? (
                      <span className="marker" style={{ fontSize: 13, fontWeight: 500 }}>
                        {list.dueTodayCount} à revoir
                      </span>
                    ) : (
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>Rien à revoir</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setSm2Open(true)}
          className="inline-flex min-h-11 items-center gap-2 self-start text-ink"
          style={{
            ...headingStyle,
            fontSize: 22,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <Brain className="shrink-0" size={22} strokeWidth={1.8} aria-hidden />
          Pourquoi réviser maintenant ?
        </button>
        <ProfesseurSM2Modal open={sm2Open} onClose={() => setSm2Open(false)} />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Link
            href="/app/familles"
            className="home-dash-card grid min-h-11 grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 no-underline md:flex md:flex-col md:items-start"
            style={{ borderRadius: 20, padding: 16 }}
          >
            <span style={iconWellStyle}>
              <Folder size={20} strokeWidth={1.8} color="var(--ink)" aria-hidden />
            </span>
            <p style={{ ...headingStyle, fontSize: 18 }}>Bibliothèque</p>
            <span style={inkChipStyle}>{plural(listsCount, "liste", "listes")}</span>
          </Link>

          <Link
            href="/app/revision"
            className="home-dash-card grid min-h-11 grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 no-underline md:flex md:flex-col md:items-start"
            style={{ borderRadius: 20, padding: 16 }}
          >
            <span style={markWellStyle}>
              <Zap size={20} strokeWidth={1.8} color="var(--ink)" aria-hidden />
            </span>
            <p style={{ ...headingStyle, fontSize: 18 }}>Révision</p>
            <span style={markChipStyle}>{plural(dueCount, "mot à revoir", "mots à revoir")}</span>
          </Link>

          <Link
            href="/app/jardin"
            className="home-dash-card grid min-h-11 grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 no-underline md:flex md:flex-col md:items-start"
            style={{ borderRadius: 20, padding: 16 }}
          >
            <span style={iconWellStyle}>
              <ChartColumn size={20} strokeWidth={1.8} color="var(--ink)" aria-hidden />
            </span>
            <p style={{ ...headingStyle, fontSize: 18 }}>Synthèse</p>
            <span style={inkChipStyle}>{plural(masteredCount, "mot maîtrisé", "mots maîtrisés")}</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
