"use client";

import { useState, useEffect } from "react";
import { Clock, Check, PartyPopper } from "lucide-react";

interface LangProgress {
  language: string | null;
  count: number;
}

interface WeeklyData {
  weeklyGoal: number;
  totalCount: number;
  byLanguage: LangProgress[];
}

export default function WeeklyGoal() {
  const [data, setData] = useState<WeeklyData | null>(null);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/weekly-progress")
      .then((r) => r.json())
      .then((d: WeeklyData) => setData(d))
      .catch(() => {});
  }, []);

  if (!data) return null;

  const languages = data.byLanguage.filter((l) => l.language && l.count > 0);
  const hasMultipleLangs = languages.length > 1;

  const currentCount =
    selectedLang !== null
      ? (data.byLanguage.find((l) => l.language === selectedLang)?.count ?? 0)
      : data.totalCount;

  const goal = Math.max(1, Number(data.weeklyGoal) || 20);
  const progress = Math.min(1, currentCount / goal);
  const isComplete = currentCount >= goal;
  const remaining = Math.max(0, goal - currentCount);

  const midMarker = Math.round(goal / 2);

  return (
    <div
      className="flex min-h-0 min-w-0 flex-col gap-[10px]"
      style={{
        background: "var(--surface)",
        borderRadius: 16,
        border: "1px solid var(--line)",
        padding: 16,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        className="relative z-[1] flex justify-between gap-2"
        style={{ alignItems: "flex-start" }}
      >
        <div>
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--foreground-muted)",
              marginBottom: 4,
            }}
          >
            Objectif semaine
          </p>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 26,
              fontWeight: 700,
              color: "var(--ink)",
              lineHeight: 1,
            }}
          >
            {currentCount}
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                color: "var(--foreground-muted)",
                fontWeight: 400,
              }}
            >
              {" "}
              / {goal} mots
            </span>
          </p>
        </div>
        <div
          className="flex shrink-0 items-center justify-center"
          style={{
            width: 44,
            height: 44,
            background: "var(--surface)",
            border: "1.5px solid var(--line)",
            borderRadius: 12,
          }}
        >
          <Clock className="h-5 w-5 shrink-0 text-ink" strokeWidth={1.8} />
        </div>
      </div>

      {hasMultipleLangs && (
        <div
          className="relative z-[1] flex flex-wrap gap-2"
          style={{ marginTop: -4 }}
        >
          <button
            type="button"
            onClick={() => setSelectedLang(null)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: 44,
              padding: "0 12px",
              borderRadius: 8,
              border: "1.5px solid var(--ink)",
              background: selectedLang === null ? "var(--mark)" : "var(--surface)",
              color: selectedLang === null ? "var(--ink)" : "var(--muted)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Toutes
          </button>
          {languages.map((l) => (
            <button
              key={l.language}
              type="button"
              onClick={() => setSelectedLang(l.language)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 44,
                padding: "0 12px",
                borderRadius: 8,
                border: "1.5px solid var(--ink)",
                background: selectedLang === l.language ? "var(--mark)" : "var(--surface)",
                color: selectedLang === l.language ? "var(--ink)" : "var(--muted)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {l.language} ({l.count})
            </button>
          ))}
        </div>
      )}

      <div
        className="relative z-[1]"
        style={{
          height: 18,
          boxSizing: "border-box",
          background: "var(--surface)",
          border: "1.5px solid var(--ink)",
          borderRadius: 999,
          position: "relative",
          overflow: "hidden",
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

      <div
        className="relative z-[1] flex justify-between"
        style={{
          fontSize: 10,
          color: "var(--foreground-muted)",
        }}
      >
        <span>0</span>
        <span>{midMarker}</span>
        <span>{goal}</span>
      </div>

      <div
        className="relative z-[1] flex items-center gap-1.5"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 13,
          color: "var(--muted)",
          fontWeight: 500,
          minHeight: 44,
        }}
      >
        {isComplete ? (
          <>
            <PartyPopper className="h-[18px] w-[18px] shrink-0 text-ink" strokeWidth={1.8} aria-hidden />
            <span>Objectif atteint</span>
          </>
        ) : (
          <>
            <Check className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} aria-hidden />
            <span>
              {remaining} mot{remaining !== 1 ? "s" : ""} restant
              {remaining !== 1 ? "s" : ""} cette semaine
            </span>
          </>
        )}
      </div>
    </div>
  );
}
