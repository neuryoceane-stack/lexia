"use client";

import { useState, useEffect } from "react";
import { PREFERRED_LANGUAGE_OPTIONS } from "@/lib/language";

interface LangProgress {
  language: string | null;
  count: number;
}

function languageDisplayName(code: string | null): string {
  const n = (code ?? "").trim().toLowerCase();
  if (!n) return "—";
  return PREFERRED_LANGUAGE_OPTIONS.find((o) => o.value === n)?.label ?? n.toUpperCase();
}

interface WeeklyData {
  weeklyGoal: number;
  totalCount: number;
  byLanguage: LangProgress[];
}

const cardStyle = {
  background: "var(--surface)",
  borderRadius: 20,
  border: "1.5px solid var(--line)",
  padding: 20,
} as const;

export default function WeeklyGoal() {
  const [data, setData] = useState<WeeklyData | null>(null);
  const [error, setError] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/weekly-progress", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("weekly-progress");
        return r.json() as Promise<WeeklyData>;
      })
      .then((d) => {
        if (!Number.isFinite(Number(d.weeklyGoal)) || Number(d.weeklyGoal) <= 0) {
          throw new Error("weekly-goal");
        }
        setData(d);
      })
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <p role="alert" style={{ ...cardStyle, color: "var(--false-text)", fontSize: 14 }}>
        L&apos;objectif de la semaine n&apos;a pas pu être chargé.
      </p>
    );
  }

  if (!data) {
    return <div className="skeleton h-full min-h-[220px]" style={{ borderRadius: 20 }} />;
  }

  const languages = data.byLanguage.filter((l) => l.language && l.count > 0);

  const currentCount =
    selectedLang !== null
      ? (data.byLanguage.find((l) => l.language === selectedLang)?.count ?? 0)
      : data.totalCount;

  const goal = Number(data.weeklyGoal);
  const progress = Math.min(1, currentCount / goal);
  const isComplete = currentCount >= goal;
  const remaining = Math.max(0, goal - currentCount);

  function pillStyle(active: boolean) {
    return {
      display: "inline-flex",
      alignItems: "center",
      minHeight: 44,
      padding: "0 14px",
      borderRadius: 999,
      border: "1.5px solid var(--ink)",
      background: active ? "var(--mark)" : "var(--surface)",
      color: "var(--ink)",
      fontSize: 14,
      fontWeight: 500,
      fontFamily: "var(--font-sans)",
      cursor: "pointer",
    } as const;
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-3" style={cardStyle}>
      <div>
        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--muted)",
            marginBottom: 6,
          }}
        >
          Objectif semaine
        </p>
        <p
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            color: "var(--ink)",
            lineHeight: 1,
          }}
        >
          <span style={{ fontSize: 32 }}>{currentCount}</span>
          <span style={{ fontSize: 18 }}> / {goal} mots</span>
        </p>
      </div>

      {languages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setSelectedLang(null)} style={pillStyle(selectedLang === null)}>
            Toutes
          </button>
          {languages.map((l) => (
            <button
              key={l.language}
              type="button"
              onClick={() => setSelectedLang(l.language)}
              style={pillStyle(selectedLang === l.language)}
            >
              {languageDisplayName(l.language)} ({l.count})
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          height: 12,
          boxSizing: "border-box",
          background: "var(--surface)",
          border: "1.5px solid var(--ink)",
          borderRadius: 999,
          position: "relative",
          overflow: "hidden",
          marginTop: 4,
        }}
      >
        {progress > 0 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: `${progress * 100}%`,
              height: "100%",
              background: "var(--mark)",
              transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        )}
      </div>

      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          color: "var(--muted)",
          fontWeight: 400,
          marginTop: "auto",
        }}
      >
        {isComplete
          ? "Objectif atteint"
          : `${remaining} mot${remaining !== 1 ? "s" : ""} restant${remaining !== 1 ? "s" : ""} cette semaine`}
      </p>
    </div>
  );
}
