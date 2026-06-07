"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

type Word = { id: string; term: string; definition: string };
type Step = "loading" | "empty" | "session" | "result";

const TOTAL_TIME = 300;

export default function RevisionExpressPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("loading");
  const [words, setWords] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const sessionStart = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/revision?express=1")
      .then((res) => res.json())
      .then((data) => {
        if (data.upToDate || !data.words?.length) {
          setStep("empty");
        } else {
          setWords(data.words);
          setStep("session");
          sessionStart.current = Date.now();
        }
      })
      .catch(() => setStep("empty"));
  }, []);

  useEffect(() => {
    if (step !== "session") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setStep("result");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  const advance = useCallback(() => {
    setRevealed(false);
    if (index + 1 >= words.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      setStep("result");
    } else {
      setIndex((i) => i + 1);
    }
  }, [index, words.length]);

  const handleKnew = useCallback(() => {
    const word = words[index];
    setScore((s) => ({ correct: s.correct + 1, total: s.total + 1 }));
    fetch("/api/revision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: word.id, rating: 2 }),
    }).catch(() => {});
    advance();
  }, [words, index, advance]);

  const handleDidNotKnow = useCallback(() => {
    const word = words[index];
    setScore((s) => ({ ...s, total: s.total + 1 }));
    fetch("/api/revision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: word.id, rating: 0 }),
    }).catch(() => {});
    advance();
  }, [words, index, advance]);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const elapsed = Math.round((Date.now() - sessionStart.current) / 1000);

  if (step === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[var(--background)]">
        <p className="text-[var(--foreground-muted)]">Chargement…</p>
      </div>
    );
  }

  if (step === "empty") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[var(--background)] text-center">
        <span className="text-6xl">🎉</span>
        <h1 className="mt-4 text-2xl font-bold text-[var(--foreground)]">
          Tout est à jour !
        </h1>
        <p className="mt-2 max-w-sm text-sm text-[var(--foreground-muted)]">
          Aucun mot urgent. Reviens demain pour continuer ta progression.
        </p>
        <button
          type="button"
          onClick={() => router.push("/app")}
          className="mt-6 rounded-xl px-6 py-3 font-semibold text-white shadow-sm transition"
          style={{ backgroundColor: "#6C3FC8" }}
        >
          Retour à l&apos;accueil
        </button>
      </div>
    );
  }

  if (step === "result") {
    const pct = score.total > 0 ? score.correct / score.total : 0;
    const scoreColor =
      pct >= 0.7
        ? "text-green-600"
        : pct >= 0.5
          ? "text-amber-500"
          : "text-red-600";

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[var(--background)] text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Session terminée ⚡
        </h1>
        <p className={`mt-4 text-5xl font-extrabold ${scoreColor}`}>
          {score.correct} / {score.total}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground-muted)]">
          Temps écoulé : {formatTime(elapsed)}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/app")}
            className="rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background-subtle)]"
          >
            Retour à l&apos;accueil
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition"
            style={{ backgroundColor: "#6C3FC8" }}
          >
            Recommencer
          </button>
        </div>
      </div>
    );
  }

  const word = words[index];
  const progress = words.length > 0 ? ((index) / words.length) * 100 : 0;
  const timerColor =
    timeLeft < 30
      ? "text-red-500"
      : timeLeft < 60
        ? "text-amber-500"
        : "text-[var(--foreground-muted)]";

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 bg-[var(--background)] py-4">
      {/* Timer + progress */}
      <div className="flex w-full items-center justify-between">
        <p className={`text-lg font-bold tabular-nums ${timerColor}`}>
          {formatTime(timeLeft)}
        </p>
        <p className="text-sm text-[var(--foreground-muted)]">
          {index + 1} / {words.length}
        </p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--background-subtle)]">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%`, backgroundColor: "#6C3FC8" }}
        />
      </div>

      {/* Card */}
      <div className="flex min-h-[280px] w-full flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-8 shadow-sm">
        <p className="text-center text-2xl font-bold text-[var(--foreground)]">
          {word.term}
        </p>
        {revealed && (
          <p className="mt-6 text-center text-lg text-[var(--foreground-muted)]">
            {word.definition}
          </p>
        )}
      </div>

      {/* Actions */}
      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="w-full rounded-xl py-3 text-center font-semibold text-white shadow-sm transition"
          style={{ backgroundColor: "#6C3FC8" }}
        >
          Révéler
        </button>
      ) : (
        <div className="flex w-full gap-3">
          <button
            type="button"
            onClick={handleDidNotKnow}
            className="flex-1 rounded-xl border-2 border-red-400 py-3 text-center font-semibold text-red-600 transition hover:bg-red-50"
          >
            ✗ Je ne savais pas
          </button>
          <button
            type="button"
            onClick={handleKnew}
            className="flex-1 rounded-xl border-2 border-green-400 py-3 text-center font-semibold text-green-600 transition hover:bg-green-50"
          >
            ✓ Je savais
          </button>
        </div>
      )}
    </div>
  );
}
