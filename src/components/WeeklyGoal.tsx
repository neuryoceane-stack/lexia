"use client";

import { useState, useEffect } from "react";
import { Clock, Check } from "lucide-react";

interface LangProgress {
  language: string | null;
  count: number;
}

interface WeeklyData {
  weeklyGoal: number;
  totalCount: number;
  byLanguage: LangProgress[];
}

const BORDER_TERTIARY = "rgba(108, 63, 200, 0.14)";

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
        background: "#FFFFFF",
        borderRadius: 14,
        border: `0.5px solid ${BORDER_TERTIARY}`,
        padding: 16,
        position: "relative",
        overflow: "hidden",
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
          background: "#6C3FC8",
          opacity: 0.06,
        }}
      />

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
              fontSize: 26,
              fontWeight: 500,
              color: "#6C3FC8",
              lineHeight: 1,
            }}
          >
            {currentCount}
            <span
              style={{
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
            width: 32,
            height: 32,
            background: "#F0EDF8",
            borderRadius: 8,
          }}
        >
          <Clock className="h-4 w-4 shrink-0 text-[#6C3FC8]" strokeWidth={2} />
        </div>
      </div>

      {hasMultipleLangs && (
        <div
          className="relative z-[1] flex flex-wrap gap-1.5"
          style={{ marginTop: -4 }}
        >
          <button
            type="button"
            onClick={() => setSelectedLang(null)}
            style={{
              padding: "2px 8px",
              borderRadius: 16,
              border: "1px solid",
              borderColor: selectedLang === null ? "#6C3FC8" : "#E5E5E5",
              background: selectedLang === null ? "#EDE8FB" : "white",
              color: selectedLang === null ? "#6C3FC8" : "#999",
              fontSize: 10,
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
                padding: "2px 8px",
                borderRadius: 16,
                border: "1px solid",
                borderColor: selectedLang === l.language ? "#6C3FC8" : "#E5E5E5",
                background: selectedLang === l.language ? "#EDE8FB" : "white",
                color: selectedLang === l.language ? "#6C3FC8" : "#999",
                fontSize: 10,
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
          height: 7,
          background: "#F0EDF8",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress * 100}%`,
            background: "#6C3FC8",
            borderRadius: 4,
            transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
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
          fontSize: 11,
          color: "#1D9E75",
          fontWeight: 500,
        }}
      >
        {isComplete ? (
          <span>Objectif atteint 🎉</span>
        ) : (
          <>
            <Check className="h-[11px] w-[11px] shrink-0 text-[#1D9E75]" strokeWidth={2.5} />
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
