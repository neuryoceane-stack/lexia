"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

type BibliothequeList = {
  id: string;
  familyId: string;
  familyName: string;
  name: string;
  language: string | null;
  wordCount: number;
  progressPercent: number;
};

type DueWord = { id: string; listId: string; term: string; definition: string };

type Step = "mode" | "lists" | "direction" | "session";

type Mode = "flashcard" | "dictee";
type Direction = "term_to_def" | "def_to_term";

function normalizeForCompare(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function RevisionClient() {
  const [step, setStep] = useState<Step>("mode");
  const [mode, setMode] = useState<Mode | null>(null);
  const [lists, setLists] = useState<BibliothequeList[]>([]);
  const [selectedListIds, setSelectedListIds] = useState<Set<string>>(new Set());
  const [direction, setDirection] = useState<Direction | null>(null);

  const [words, setWords] = useState<DueWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [sessionTotalWords, setSessionTotalWords] = useState(0);
  const [wordsSeen, setWordsSeen] = useState(0);
  const [wordsRetained, setWordsRetained] = useState(0);
  const [wordsWritten, setWordsWritten] = useState(0);
  const [laterWords, setLaterWords] = useState<DueWord[]>([]);
  const [writeAnswer, setWriteAnswer] = useState("");
  const [writeResult, setWriteResult] = useState<"correct" | "wrong" | null>(null);
  const [writeRevealed, setWriteRevealed] = useState(false);

  const touchStartX = useRef(0);
  const hasSavedEndOfSession = useRef(false);
  const [showEndRecap, setShowEndRecap] = useState(false);
  const [endSessionDurationSeconds, setEndSessionDurationSeconds] = useState(0);
  const current = words[index];

  const displaySide = direction === "term_to_def" ? "term" : "definition";
  const answerSide = direction === "term_to_def" ? "definition" : "term";
  const displayText = current
    ? displaySide === "term"
      ? current.term
      : current.definition
    : "";
  const answerText = current
    ? answerSide === "term"
      ? current.term
      : current.definition
    : "";

  const loadLists = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/bibliotheque");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erreur chargement listes");
        setLists([]);
        return;
      }
      setLists(data.lists ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (step === "lists") loadLists();
  }, [step, loadLists]);

  useEffect(() => {
    if (
      step === "session" &&
      mode === "dictee" &&
      words.length === 0 &&
      laterWords.length > 0
    ) {
      setWords([...laterWords]);
      setLaterWords([]);
      setIndex(0);
    }
  }, [step, mode, words.length, laterWords.length]);

  useEffect(() => {
    if (
      step !== "session" ||
      words.length > 0 ||
      laterWords.length > 0 ||
      sessionTotalWords === 0 ||
      !sessionStart ||
      hasSavedEndOfSession.current
    )
      return;
    hasSavedEndOfSession.current = true;
    const endedAt = Date.now();
    const durationSeconds = Math.round((endedAt - sessionStart) / 1000);
    setEndSessionDurationSeconds(durationSeconds);
    const lang =
      lists.find((l) => selectedListIds.has(l.id))?.language ?? null;
    fetch("/api/revision/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: mode ?? "flashcard",
        direction: direction ?? "term_to_def",
        language: lang ?? undefined,
        startedAt: new Date(sessionStart).toISOString(),
        endedAt: new Date(endedAt).toISOString(),
        durationSeconds,
        wordsSeen,
        wordsRetained,
        wordsWritten,
      }),
    }).finally(() => setShowEndRecap(true));
  }, [
    step,
    words.length,
    laterWords.length,
    sessionTotalWords,
    sessionStart,
    mode,
    direction,
    wordsSeen,
    wordsRetained,
    wordsWritten,
  ]);

  const loadSessionWords = useCallback(async () => {
    if (selectedListIds.size === 0) return;
    setLoading(true);
    setError("");
    try {
      const listIds = Array.from(selectedListIds);
      const res = await fetch(
        `/api/revision?listIds=${listIds.map(encodeURIComponent).join(",")}`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erreur chargement des mots");
        setWords([]);
        return;
      }
      const w = data.words ?? [];
      setWords(w);
      setSessionTotalWords(w.length);
      setLaterWords([]);
      setIndex(0);
      setRevealed(false);
      setSessionStart(Date.now());
      setWordsSeen(0);
      setWordsRetained(0);
      setWordsWritten(0);
      setWriteAnswer("");
      setWriteResult(null);
      setWriteRevealed(false);
      hasSavedEndOfSession.current = false;
      setShowEndRecap(false);
    } finally {
      setLoading(false);
    }
  }, [selectedListIds]);

  async function recordReview(success: boolean) {
    if (!current || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: current.id, success }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erreur enregistrement");
        setSending(false);
        return;
      }
      setWordsSeen((n) => n + 1);
      if (success) setWordsRetained((n) => n + 1);
      setWords((prev) => prev.filter((w) => w.id !== current.id));
      setRevealed(false);
      setIndex(0);
    } finally {
      setSending(false);
    }
  }

  async function saveSessionAndExit() {
    if (!sessionStart) return;
    const endedAt = Date.now();
    const durationSeconds = Math.round((endedAt - sessionStart) / 1000);
    const lang =
      lists.find((l) => selectedListIds.has(l.id))?.language ?? null;
    await fetch("/api/revision/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: mode ?? "flashcard",
        direction: direction ?? "term_to_def",
        language: lang ?? undefined,
        startedAt: new Date(sessionStart).toISOString(),
        endedAt: new Date(endedAt).toISOString(),
        durationSeconds,
        wordsSeen,
        wordsRetained,
        wordsWritten,
      }),
    });
    setStep("mode");
    setMode(null);
    setSelectedListIds(new Set());
    setDirection(null);
    setWords([]);
    setSessionStart(null);
  }

  function toggleList(id: string) {
    const list = lists.find((l) => l.id === id);
    if (!list) return;
    setSelectedListIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        const lang = list.language;
        const others = lists.filter((l) => next.has(l.id));
        if (others.length > 0 && others.some((l) => l.language !== lang)) return prev;
        next.add(id);
      }
      return next;
    });
  }

  const selectedLang = selectedListIds.size > 0
    ? lists.find((l) => selectedListIds.has(l.id))?.language ?? null
    : null;
  const canAddList = (list: BibliothequeList) =>
    selectedListIds.size === 0 || list.language === selectedLang;

  if (step === "mode") {
    return (
      <div className="space-y-6">
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-vocab-gray hover:text-primary dark:text-slate-400 dark:hover:text-primary-light"
        >
          ← Retour
        </Link>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Choisis un mode
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setMode("flashcard");
              setStep("lists");
            }}
            className="rounded-xl border-2 border-slate-200 bg-white p-6 text-left transition hover:border-primary hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:hover:border-primary-light"
          >
            <span className="text-2xl" aria-hidden>🃏</span>
            <h3 className="mt-2 font-semibold text-slate-800 dark:text-slate-100">
              Flashcards
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Tap pour révéler, swipe droite = retenu, gauche = pas retenu.
            </p>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("dictee");
              setStep("lists");
            }}
            className="rounded-xl border-2 border-slate-200 bg-white p-6 text-left transition hover:border-primary hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:hover:border-primary-light"
          >
            <span className="text-2xl" aria-hidden>✏️</span>
            <h3 className="mt-2 font-semibold text-slate-800 dark:text-slate-100">
              Dictée / Écriture active
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Écris la traduction, validation et feedback immédiat.
            </p>
          </button>
        </div>
      </div>
    );
  }

  if (step === "lists") {
    return (
      <div className="space-y-6">
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-vocab-gray hover:text-primary dark:text-slate-400 dark:hover:text-primary-light"
        >
          ← Retour
        </Link>
        <button
          type="button"
          onClick={() => setStep("mode")}
          className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
        >
          ← Changer de mode
        </button>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Sélectionne une ou plusieurs listes (même langue)
        </h2>
        {error && (
          <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </p>
        )}
        {loading ? (
          <p className="text-slate-500 dark:text-slate-400">Chargement…</p>
        ) : lists.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">
            Aucune liste. Crée des listes dans la Bibliothèque.
          </p>
        ) : (
          <ul className="space-y-2">
            {lists.map((list) => {
              const selected = selectedListIds.has(list.id);
              const disabled = !canAddList(list);
              return (
                <li key={list.id}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                      selected
                        ? "border-primary bg-primary/5 dark:bg-primary/10"
                        : disabled
                          ? "border-slate-200 opacity-60 dark:border-slate-700"
                          : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleList(list.id)}
                      disabled={disabled}
                      className="h-4 w-4 rounded border-slate-300 text-primary"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {list.name}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {list.familyName} · {list.wordCount} mots
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        {selectedListIds.size > 0 && (
          <button
            type="button"
            onClick={() => setStep("direction")}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Continuer
          </button>
        )}
      </div>
    );
  }

  if (step === "direction") {
    return (
      <div className="space-y-6">
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-vocab-gray hover:text-primary dark:text-slate-400 dark:hover:text-primary-light"
        >
          ← Retour
        </Link>
        <button
          type="button"
          onClick={() => setStep("lists")}
          className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
        >
          ← Changer de listes
        </button>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Sens de la traduction
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setDirection("term_to_def");
              setStep("session");
              loadSessionWords();
            }}
            className="rounded-xl border-2 border-slate-200 bg-white p-6 text-left transition hover:border-primary dark:border-slate-600 dark:bg-slate-800 dark:hover:border-primary-light"
          >
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Langue étrangère → Langue maternelle
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              On affiche le mot étranger, tu donnes la traduction.
            </p>
          </button>
          <button
            type="button"
            onClick={() => {
              setDirection("def_to_term");
              setStep("session");
              loadSessionWords();
            }}
            className="rounded-xl border-2 border-slate-200 bg-white p-6 text-left transition hover:border-primary dark:border-slate-600 dark:bg-slate-800 dark:hover:border-primary-light"
          >
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Langue maternelle → Langue étrangère
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              On affiche la traduction, tu donnes le mot étranger.
            </p>
          </button>
        </div>
      </div>
    );
  }

  if (step === "session") {
    if (loading && words.length === 0) {
      return (
        <div className="space-y-4">
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-vocab-gray hover:text-primary"
          >
            ← Retour
          </Link>
          <p className="text-slate-500 dark:text-slate-400">Chargement des mots…</p>
        </div>
      );
    }
    if (error && words.length === 0) {
      return (
        <div className="space-y-4">
          <Link href="/app" className="text-sm font-medium text-primary">
            ← Retour
          </Link>
          <p className="rounded-lg bg-red-50 p-3 text-red-700 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </p>
          <button
            type="button"
            onClick={() => setStep("direction")}
            className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700"
          >
            Changer de listes ou sens
          </button>
        </div>
      );
    }
    if (words.length === 0 && laterWords.length === 0) {
      if (showEndRecap) {
        const durationMin = Math.floor(endSessionDurationSeconds / 60);
        const durationSec = endSessionDurationSeconds % 60;
        const durationStr =
          durationMin > 0 ? `${durationMin} min` : `${durationSec} s`;
        return (
          <div className="space-y-6">
            <Link
              href="/app"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-vocab-gray hover:text-primary dark:text-slate-400 dark:hover:text-primary-light"
            >
              ← Retour
            </Link>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-600 dark:bg-slate-800">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                Session terminée
              </h2>
              <ul className="mt-4 space-y-2 text-slate-600 dark:text-slate-400">
                <li>Temps : {durationStr}</li>
                <li>Mots vus : {wordsSeen}</li>
                <li>Retenus : {wordsRetained}</li>
                {mode === "dictee" && <li>Mots écrits : {wordsWritten}</li>}
              </ul>
              <button
                type="button"
                onClick={() => {
                  hasSavedEndOfSession.current = false;
                  setShowEndRecap(false);
                  setStep("mode");
                  setMode(null);
                  setSelectedListIds(new Set());
                  setDirection(null);
                  setWords([]);
                  setSessionStart(null);
                  setSessionTotalWords(0);
                  setWordsSeen(0);
                  setWordsRetained(0);
                  setWordsWritten(0);
                  setEndSessionDurationSeconds(0);
                }}
                className="mt-6 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-dark"
              >
                Nouvelle session
              </button>
            </div>
          </div>
        );
      }
      return (
        <div className="space-y-4">
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-vocab-gray hover:text-primary dark:text-slate-400 dark:hover:text-primary-light"
          >
            ← Retour
          </Link>
          <p className="text-slate-600 dark:text-slate-400">
            Aucun mot à réviser pour les listes choisies. Reviens plus tard.
          </p>
          <button
            type="button"
            onClick={() => {
              setStep("mode");
              setMode(null);
              setSelectedListIds(new Set());
              setDirection(null);
            }}
            className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-dark"
          >
            Nouvelle session
          </button>
        </div>
      );
    }

    const doneCount = sessionTotalWords - words.length;
    const progressLabel = `${Math.min(doneCount + 1, sessionTotalWords)} / ${sessionTotalWords}`;

    if (mode === "flashcard") {
      const handleSwipe = (success: boolean) => {
        if (!current || sending) return;
        recordReview(success);
      };

      const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
      };
      const onTouchEnd = (e: React.TouchEvent) => {
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(delta) < 50) return;
        handleSwipe(delta > 0);
      };

      const onMouseDown = (e: React.MouseEvent) => {
        touchStartX.current = e.clientX;
      };
      const onMouseUp = (e: React.MouseEvent) => {
        const delta = e.clientX - touchStartX.current;
        if (Math.abs(delta) < 50) return;
        handleSwipe(delta > 0);
      };

      return (
        <div className="flex min-h-[50vh] flex-col">
          <div className="mb-4 flex items-center justify-between">
            <Link
              href="/app"
              className="text-sm font-medium text-vocab-gray hover:text-primary dark:text-slate-400 dark:hover:text-primary-light"
              onClick={(e) => {
                e.preventDefault();
                saveSessionAndExit();
              }}
            >
              ← Quitter
            </Link>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {progressLabel}
            </span>
          </div>
          <div className="flex-1">
            {current && (
              <div
                className="touch-pan-y select-none rounded-2xl border-2 border-slate-200 bg-white p-8 shadow-lg dark:border-slate-600 dark:bg-slate-800"
                onClick={() => setRevealed((r) => !r)}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === " ") {
                    e.preventDefault();
                    setRevealed((r) => !r);
                  }
                  if (e.key === "ArrowRight") handleSwipe(true);
                  if (e.key === "ArrowLeft") handleSwipe(false);
                }}
              >
                <p className="text-center text-2xl font-semibold text-slate-800 dark:text-slate-100">
                  {displayText}
                </p>
                {revealed && (
                  <p className="mt-6 border-t border-slate-200 pt-6 text-center text-lg text-slate-600 dark:border-slate-600 dark:text-slate-400">
                    {answerText || "—"}
                  </p>
                )}
                {!revealed && (
                  <p className="mt-4 text-center text-sm text-slate-400 dark:text-slate-500">
                    Tap pour révéler · Swipe droite = retenu, gauche = pas retenu
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    const submitDictee = () => {
      if (!current) return;
      const ok = normalizeForCompare(writeAnswer) === normalizeForCompare(answerText);
      setWriteResult(ok ? "correct" : "wrong");
      setWordsWritten((n) => n + 1);
      if (ok) {
        setWordsSeen((n) => n + 1);
        setWordsRetained((n) => n + 1);
        recordReview(true);
        setWriteAnswer("");
        setWriteResult(null);
      } else {
        setWriteRevealed(false);
      }
    };

    const onWrongReveal = () => setWriteRevealed(true);
    const onWrongNext = () => {
      if (!current) return;
      recordReview(false);
      setWriteAnswer("");
      setWriteResult(null);
      setWriteRevealed(false);
      setIndex(0);
    };
    const onWrongLater = () => {
      if (!current) return;
      setLaterWords((prev) => [...prev, current]);
      setWords((prev) => prev.filter((w) => w.id !== current.id));
      setWriteAnswer("");
      setWriteResult(null);
      setWriteRevealed(false);
      setIndex(0);
    };
    const onWrongRetry = () => {
      setWriteResult(null);
      setWriteRevealed(false);
      setWriteAnswer("");
    };

    return (
      <div className="flex min-h-[50vh] flex-col">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/app"
            className="text-sm font-medium text-vocab-gray hover:text-primary dark:text-slate-400 dark:hover:text-primary-light"
            onClick={(e) => {
              e.preventDefault();
              saveSessionAndExit();
            }}
          >
            ← Quitter
          </Link>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {progressLabel}
          </span>
        </div>
        {current && (
          <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 dark:border-slate-600 dark:bg-slate-800">
            <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">
              {displayText}
            </p>
            <div className="mt-4">
              <input
                type="text"
                value={writeAnswer}
                onChange={(e) => setWriteAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitDictee()}
                placeholder="Écris la traduction…"
                disabled={sending}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                autoFocus
              />
            </div>
            {writeResult === "correct" && (
              <p className="mt-3 text-sm font-medium text-primary dark:text-primary-light">
                Correct.
              </p>
            )}
            {writeResult === "wrong" && (
              <div className="mt-3">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  Faux.
                </p>
                {writeRevealed && (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Réponse : <strong>{answerText || "—"}</strong>
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onWrongRetry}
                    className="rounded-lg bg-primary/20 px-3 py-2 text-sm font-medium text-primary-dark dark:bg-primary/30 dark:text-primary-light"
                  >
                    Réessayer
                  </button>
                  <button
                    type="button"
                    onClick={onWrongReveal}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:text-slate-300"
                  >
                    Révéler
                  </button>
                  <button
                    type="button"
                    onClick={onWrongLater}
                    className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                  >
                    Plus tard
                  </button>
                  {writeRevealed && (
                    <button
                      type="button"
                      onClick={onWrongNext}
                      className="rounded-lg bg-slate-700 px-3 py-2 text-sm text-white dark:bg-slate-600"
                    >
                      Suivant
                    </button>
                  )}
                </div>
              </div>
            )}
            {writeResult === null && (
              <button
                type="button"
                onClick={submitDictee}
                disabled={sending || !writeAnswer.trim()}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
              >
                Valider
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}
