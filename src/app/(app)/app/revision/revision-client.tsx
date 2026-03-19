"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { FlagDisplay } from "@/components/flag-display";
import {
  PREFERRED_LANGUAGE_OPTIONS,
  detectListLanguages,
  KNOWN_LANGUAGE_CODES,
} from "@/lib/language";

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

/** ISO 639-3 (fra, eng) → BCP 47 pour Web Speech API (fr, en) */
function toSpeechLang(code: string): string {
  const c = code?.trim().toLowerCase() || "en";
  if (c.length >= 2) return c.slice(0, 2);
  return "en";
}

function speakWord(text: string, lang: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  if (!text?.trim()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.trim());
  u.lang = toSpeechLang(lang);
  window.speechSynthesis.speak(u);
}

export function RevisionClient({
  initialMode = null,
  initialStep = "mode",
  backHref = "/app",
}: {
  initialMode?: Mode | null;
  initialStep?: Step;
  backHref?: string;
} = {}) {
  const [step, setStep] = useState<Step>(initialStep);
  const [mode, setMode] = useState<Mode | null>(initialMode);
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
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([]);
  /** Langues détectées sur la liste (term / definition) pour l’écran « Sens de la dictée ». */
  const [directionLanguages, setDirectionLanguages] = useState<{
    termLang: string;
    defLang: string;
  } | null>(null);
  /** Mots préchargés sur l'écran direction pour afficher la session sans attente au clic. */
  const [prefetchedSessionWords, setPrefetchedSessionWords] = useState<DueWord[] | null>(null);

  const touchStartX = useRef(0);
  const hasSavedEndOfSession = useRef(false);
  /** Évite de déclencher « révéler » au clic quand on vient de faire un swipe (flashcard). */
  const didSwipeRef = useRef(false);
  /** Champ de saisie dictée : focus automatique après validation ou « Réessayer ». */
  const dicteeInputRef = useRef<HTMLInputElement>(null);
  const [showEndRecap, setShowEndRecap] = useState(false);
  const [endSessionDurationSeconds, setEndSessionDurationSeconds] = useState(0);
  const current = words[index];

  const [memoTip, setMemoTip] = useState<string>("");
  const [memoInput, setMemoInput] = useState<string>("");
  const [showMemoInput, setShowMemoInput] = useState<boolean>(false);
  const [memoWordId, setMemoWordId] = useState<string | null>(null);
  const [memoLoading, setMemoLoading] = useState<boolean>(false);

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

  /** Précharger les préférences dès l'écran mode pour que listes et direction soient prêts. */
  useEffect(() => {
    if (step !== "mode" && step !== "lists" && step !== "direction") return;
    fetch("/api/user/preferences")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.preferredLanguages)) setPreferredLanguages(data.preferredLanguages);
        else if (data.preferredLanguage ?? data.preferredLanguage2)
          setPreferredLanguages([data.preferredLanguage, data.preferredLanguage2].filter(Boolean) as string[]);
      })
      .catch(() => {});
  }, [step]);

  useEffect(() => {
    if (step !== "direction") return;
    setDirectionLanguages(null);
    setPrefetchedSessionWords(null);
  }, [step]);

  /** Précharger les mots de la session dès l'écran « Sens de la dictée » pour transition instantanée au clic. */
  useEffect(() => {
    if (step !== "direction" || selectedListIds.size === 0) return;
    const listIds = Array.from(selectedListIds);
    const q = listIds.map(encodeURIComponent).join(",");
    fetch(`/api/revision?listIds=${q}&all=1`)
      .then((r) => r.json())
      .then((data) => {
        const w = data.words ?? [];
        if (Array.isArray(w)) setPrefetchedSessionWords(w as DueWord[]);
      })
      .catch(() => {});
  }, [step, selectedListIds]);

  useEffect(() => {
    if (!current?.id || step !== "session") {
      setMemoTip("");
      setShowMemoInput(false);
      return;
    }
    fetch(`/api/memo-tip?wordId=${encodeURIComponent(current.id)}`)
      .then((r) => r.json())
      .then((data) => setMemoTip(data.tip ?? ""))
      .catch(() => setMemoTip(""));
  }, [current?.id, step]);

  /** En dictée : remettre le focus sur le champ de saisie après validation (mot suivant) ou après « Réessayer ». */
  useEffect(() => {
    if (step !== "session" || mode !== "dictee" || !current || writeResult !== null) return;
    const t = requestAnimationFrame(() => {
      dicteeInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(t);
  }, [step, mode, current?.id, writeResult]);

  /** Détecte les langues réelles (term / definition) de la première liste sélectionnée pour afficher les bons drapeaux. */
  useEffect(() => {
    if (step !== "direction" || selectedListIds.size === 0) return;
    const firstListId = [...selectedListIds][0];
    const firstList = lists.find((l) => l.id === firstListId);
    fetch(`/api/listes/${firstListId}/mots`)
      .then((r) => r.json())
      .then((words: { term: string; definition: string }[]) => {
        if (!Array.isArray(words) || words.length === 0) {
          const listLang = firstList?.language ?? "fra";
          const other =
            preferredLanguages.find((l) => l !== listLang) ??
            preferredLanguages[0] ??
            (listLang === "fra" ? "ita" : "fra");
          setDirectionLanguages({ termLang: listLang, defLang: other });
          return;
        }
        const detected = detectListLanguages(
          words.map((w) => w.term),
          words.map((w) => w.definition)
        );
        const listLang = firstList?.language ?? "fra";
        const termLang =
          detected.termLang &&
          detected.termLang !== "und" &&
          KNOWN_LANGUAGE_CODES.has(detected.termLang)
            ? detected.termLang
            : listLang;
        let defLang =
          detected.defLang &&
          detected.defLang !== "und" &&
          KNOWN_LANGUAGE_CODES.has(detected.defLang)
            ? detected.defLang
            : preferredLanguages.find((l) => l !== termLang) ??
              preferredLanguages[0] ??
              (termLang === "fra" ? "ita" : "fra");
        let termLangFinal = termLang;
        const prefsNoEng = preferredLanguages.filter((l) => l !== "eng");
        const hasFraAndIta = prefsNoEng.includes("fra") && prefsNoEng.includes("ita");
        if (hasFraAndIta) {
          if (termLangFinal === "eng") termLangFinal = defLang === "ita" ? "fra" : "ita";
          if (defLang === "eng") defLang = termLangFinal === "ita" ? "fra" : "ita";
        }
        setDirectionLanguages({ termLang: termLangFinal, defLang });
      })
      .catch(() => {
        const listLang = firstList?.language ?? "fra";
        const other =
          preferredLanguages.find((l) => l !== listLang) ??
          preferredLanguages[0] ??
          (listLang === "fra" ? "ita" : "fra");
        setDirectionLanguages({ termLang: listLang, defLang: other });
      });
  }, [step, selectedListIds, lists, preferredLanguages]);

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

  const applySessionWords = useCallback((w: DueWord[]) => {
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
  }, []);

  const loadSessionWords = useCallback(async () => {
    if (selectedListIds.size === 0) return;
    setLoading(true);
    setError("");
    try {
      const listIds = Array.from(selectedListIds);
      const res = await fetch(
        `/api/revision?listIds=${listIds.map(encodeURIComponent).join(",")}&all=1`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erreur chargement des mots");
        setWords([]);
        return;
      }
      const w = data.words ?? [];
      applySessionWords(w);
    } finally {
      setLoading(false);
    }
  }, [selectedListIds, applySessionWords]);

  /** En dictée : envoie { wordId, success }. Utilisé uniquement en mode dictée. */
  async function recordReview(success: boolean) {
    if (!current || sending) return;
    const isFlashcard = mode === "flashcard";
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
      if (isFlashcard && !success) {
        setWords((prev) => {
          const rest = prev.filter((w) => w.id !== current.id);
          return [...rest, current];
        });
      } else {
        setWords((prev) => prev.filter((w) => w.id !== current.id));
      }
      setRevealed(false);
      setIndex(0);
    } finally {
      setSending(false);
    }
  }

  /** En flashcard : envoie { wordId, rating } (SM-2). 0=oublié, 1=difficile, 2=bien, 3=parfait. */
  async function recordReviewRating(rating: 0 | 1 | 2 | 3) {
    if (!current || sending) return;
    const success = rating >= 2;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: current.id, rating }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erreur enregistrement");
        setSending(false);
        return;
      }
      setWordsSeen((n) => n + 1);
      if (success) setWordsRetained((n) => n + 1);

      if (rating === 0 || rating === 1) {
        setMemoWordId(current.id);
        setMemoInput(memoTip);
        setShowMemoInput(true);
      } else {
        setShowMemoInput(false);
      }

      if (!success) {
        setWords((prev) => {
          const rest = prev.filter((w) => w.id !== current.id);
          return [...rest, current];
        });
      } else {
        setWords((prev) => prev.filter((w) => w.id !== current.id));
      }
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

  /** Sauvegarde la session en cours puis revient à l’écran « Sens de la traduction » (page précédente). */
  async function saveSessionAndGoBack() {
    if (sessionStart) {
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
    }
    setWords([]);
    setSessionStart(null);
    setStep("direction");
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
        <BackLink href="/app" />
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
            className="btn-relief rounded-xl border-2 border-slate-200 bg-white p-6 text-left transition hover:border-primary hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:hover:border-primary-light"
          >
            <span className="text-2xl" aria-hidden>🃏</span>
            <h3 className="mt-2 font-semibold text-slate-800 dark:text-slate-100">
              Flashcards
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Carte avec le mot · Révéler la traduction · Swipe droite = appris, gauche = raté (reviendra en fin de liste).
            </p>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("dictee");
              setStep("lists");
            }}
            className="btn-relief rounded-xl border-2 border-slate-200 bg-white p-6 text-left transition hover:border-primary hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:hover:border-primary-light"
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
        <BackLink href={backHref} onClick={initialMode ? undefined : () => setStep("mode")} />
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
                    className={`btn-relief flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
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
            className="btn-relief rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Continuer
          </button>
        )}
      </div>
    );
  }

  if (step === "direction") {
    const langTerm =
      directionLanguages?.termLang ?? selectedLang ?? "fra";
    const langDef =
      directionLanguages?.defLang ??
      preferredLanguages.find((l) => l !== selectedLang) ??
      preferredLanguages[0] ??
      (selectedLang === "fra" ? "ita" : "fra");
    const labelTerm = PREFERRED_LANGUAGE_OPTIONS.find((o) => o.value === langTerm)?.label ?? langTerm;
    const labelDef = PREFERRED_LANGUAGE_OPTIONS.find((o) => o.value === langDef)?.label ?? langDef;

    return (
      <div className="space-y-6">
        <BackLink href="/app" onClick={() => setStep("lists")} />
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Sens de la dictée
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Choisis dans quel sens tu veux écrire : on t’affiche un côté, tu écris l’autre.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setDirection("term_to_def");
              setStep("session");
              if (prefetchedSessionWords && prefetchedSessionWords.length > 0) {
                applySessionWords(prefetchedSessionWords);
              } else {
                loadSessionWords();
              }
            }}
            className="btn-relief flex flex-col items-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-6 transition hover:border-primary dark:border-slate-600 dark:bg-slate-800 dark:hover:border-primary-light"
          >
            <div className="flex items-center gap-2">
              <FlagDisplay langCode={langTerm} size={32} />
              <span className="text-lg font-medium text-slate-400">→</span>
              <FlagDisplay langCode={langDef} size={32} />
            </div>
            <p className="text-center text-sm font-medium text-slate-600 dark:text-slate-400">
              {labelTerm} → {labelDef}
            </p>
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              On affiche le mot, tu écris la traduction.
            </p>
          </button>
          <button
            type="button"
            onClick={() => {
              setDirection("def_to_term");
              setStep("session");
              if (prefetchedSessionWords && prefetchedSessionWords.length > 0) {
                applySessionWords(prefetchedSessionWords);
              } else {
                loadSessionWords();
              }
            }}
            className="btn-relief flex flex-col items-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-6 transition hover:border-primary dark:border-slate-600 dark:bg-slate-800 dark:hover:border-primary-light"
          >
            <div className="flex items-center gap-2">
              <FlagDisplay langCode={langDef} size={32} />
              <span className="text-lg font-medium text-slate-400">→</span>
              <FlagDisplay langCode={langTerm} size={32} />
            </div>
            <p className="text-center text-sm font-medium text-slate-600 dark:text-slate-400">
              {labelDef} → {labelTerm}
            </p>
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              On affiche la traduction, tu écris le mot.
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
          <BackLink href="/app" />
          <p className="text-slate-500 dark:text-slate-400">Chargement des mots…</p>
        </div>
      );
    }
    if (error && words.length === 0) {
      return (
        <div className="space-y-4">
          <BackLink href="/app" />
          <p className="rounded-lg bg-red-50 p-3 text-red-700 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </p>
          <button
            type="button"
            onClick={() => setStep("direction")}
            className="btn-relief rounded-lg border border-slate-300 px-4 py-2 text-slate-700"
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
            <BackLink href="/app" onClick={() => saveSessionAndGoBack()} />
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
                className="btn-relief mt-6 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-dark"
              >
                Nouvelle session
              </button>
            </div>
          </div>
        );
      }
      return (
        <div className="space-y-4">
          <BackLink href="/app" onClick={() => saveSessionAndGoBack()} />
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
            className="btn-relief rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-dark"
          >
            Nouvelle session
          </button>
        </div>
      );
    }

    const doneCount = sessionTotalWords - words.length;
    const progressLabel = `${Math.min(doneCount + 1, sessionTotalWords)} / ${sessionTotalWords}`;

    const sessionLangTerm =
      directionLanguages?.termLang ?? selectedLang ?? preferredLanguages[0] ?? "en";
    const sessionLangDef =
      directionLanguages?.defLang ??
      preferredLanguages.find((l) => l !== sessionLangTerm) ??
      preferredLanguages[0] ??
      "en";
    const displayLang =
      direction === "term_to_def" ? sessionLangTerm : sessionLangDef;
    const answerLang =
      direction === "term_to_def" ? sessionLangDef : sessionLangTerm;

    const SpeakButton = ({
      text,
      lang,
      className = "",
      stopPropagation = false,
    }: {
      text: string;
      lang: string;
      className?: string;
      stopPropagation?: boolean;
    }) => (
      <button
        type="button"
        onClick={(e) => {
          if (stopPropagation) e.stopPropagation();
          speakWord(text, lang);
        }}
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600 ${className}`}
        aria-label="Écouter la prononciation"
      >
        <span aria-hidden>🔊</span>
      </button>
    );

    if (mode === "flashcard") {
      const handleSwipe = (success: boolean) => {
        if (!current || sending) return;
        didSwipeRef.current = true;
        recordReviewRating(success ? 2 : 0);
      };

      const handlePointerDown = (e: React.PointerEvent) => {
        touchStartX.current = e.clientX;
        didSwipeRef.current = false;
      };

      const handlePointerUp = (e: React.PointerEvent) => {
        const diff = e.clientX - touchStartX.current;
        if (Math.abs(diff) < 10) return;
        if (diff < -60) {
          handleSwipe(false);
        } else if (diff > 60) {
          handleSwipe(true);
        }
      };

      const onCardClick = () => {
        if (didSwipeRef.current) return;
        setRevealed((r) => !r);
      };

      return (
        <div className="flex min-h-[50vh] flex-col">
          <div className="mb-4 flex items-center justify-between">
            <BackLink href="/app" onClick={() => saveSessionAndGoBack()} />
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {progressLabel}
            </span>
          </div>

          {/* Carte : mot puis traduction au tap / bouton Révéler */}
          <div className="flex flex-1 flex-col">
            {current && (
              <div
                className="touch-pan-y select-none rounded-2xl border-2 border-slate-200 bg-white p-8 shadow-lg dark:border-slate-600 dark:bg-slate-800"
                style={{ touchAction: "pan-y" }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    onCardClick();
                  }
                }}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onKeyDown={(e) => {
                  if (e.key === " ") {
                    e.preventDefault();
                    setRevealed((r) => !r);
                  }
                  if (e.key === "ArrowRight") handleSwipe(true);
                  if (e.key === "ArrowLeft") handleSwipe(false);
                }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCardClick();
                  }}
                  className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
                >
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-center text-2xl font-semibold text-slate-800 dark:text-slate-100">
                      {displayText}
                    </p>
                    <SpeakButton
                      text={displayText}
                      lang={displayLang}
                      className="self-center"
                      stopPropagation
                    />
                  </div>
                </button>
                {memoTip && (
                  <div className="mt-3 rounded-lg border border-[#F5A623]/30 bg-[#F5A623]/10 px-3 py-2 dark:border-[#F5A623]/40 dark:bg-[#F5A623]/15">
                    <p className="text-xs text-[#b8750f] dark:text-[#f0c060]">
                      💡 <span className="font-medium">Astuce :</span> {memoTip}
                    </p>
                  </div>
                )}
                {revealed ? (
                  <div className="mt-6 flex items-center justify-center gap-2 border-t border-slate-200 pt-6 dark:border-slate-600">
                    <p className="text-center text-lg text-slate-600 dark:text-slate-400">
                      {answerText || "—"}
                    </p>
                    <SpeakButton text={answerText || ""} lang={answerLang} />
                  </div>
                ) : (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRevealed(true);
                      }}
                      style={{ touchAction: "manipulation", cursor: "pointer" }}
                      className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:border-primary-light dark:hover:bg-primary/10"
                    >
                      Révéler la traduction
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* En bas : 4 boutons SM-2 quand révélé, sinon swipe hint ; swipe droite=2, gauche=0 */}
            {current && (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="text-xs text-slate-400 dark:text-slate-500 sm:mr-auto">
                  {revealed
                    ? "Comment s'est passée la révision ?"
                    : "Swipe droite = bien · gauche = oublié"}
                </span>
                {revealed ? (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        recordReviewRating(0);
                      }}
                      disabled={sending}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                        recordReviewRating(0);
                      }}
                      style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent", cursor: "pointer" }}
                      className="flex items-center gap-2 rounded-lg border-2 border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                      aria-label="Oublié"
                    >
                      <span aria-hidden>😰</span> Oublié
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        recordReviewRating(1);
                      }}
                      disabled={sending}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                        recordReviewRating(1);
                      }}
                      style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent", cursor: "pointer" }}
                      className="flex items-center gap-2 rounded-lg border-2 border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200 dark:hover:bg-amber-900/30"
                      aria-label="Difficile"
                    >
                      <span aria-hidden>😓</span> Difficile
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        recordReviewRating(2);
                      }}
                      disabled={sending}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                        recordReviewRating(2);
                      }}
                      style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent", cursor: "pointer" }}
                      className="flex items-center gap-2 rounded-lg border-2 border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
                      aria-label="Bien"
                    >
                      <span aria-hidden>🙂</span> Bien
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        recordReviewRating(3);
                      }}
                      disabled={sending}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                        recordReviewRating(3);
                      }}
                      style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent", cursor: "pointer" }}
                      className="flex items-center gap-2 rounded-lg border-2 border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30"
                      aria-label="Parfait"
                    >
                      <span aria-hidden>😎</span> Parfait
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwipe(false);
                      }}
                      disabled={sending}
                      style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent", cursor: "pointer" }}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                        handleSwipe(false);
                      }}
                      className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-200 bg-white text-red-500 shadow hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:bg-slate-800 dark:hover:bg-red-900/20"
                      aria-label="Oublié"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwipe(true);
                      }}
                      disabled={sending}
                      style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent", cursor: "pointer" }}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                        handleSwipe(true);
                      }}
                      className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-green-200 bg-white text-green-600 shadow hover:bg-green-50 disabled:opacity-50 dark:border-green-800 dark:bg-slate-800 dark:hover:bg-green-900/20"
                      aria-label="Bien"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            )}

            {showMemoInput && (
              <div className="mt-4 rounded-xl border border-[#6C3FC8]/20 bg-[#6C3FC8]/5 p-4 dark:border-[#6C3FC8]/30 dark:bg-[#6C3FC8]/10">
                <p className="mb-2 text-sm font-medium text-[#6C3FC8] dark:text-[#a78bfa]">
                  💡 Ajoute une astuce mémo{" "}
                  <span className="font-normal text-slate-500 dark:text-slate-400">(optionnel)</span>
                </p>
                <textarea
                  value={memoInput}
                  onChange={(e) => setMemoInput(e.target.value)}
                  placeholder="Une image mentale, une association, un moyen mnémotechnique…"
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#6C3FC8] focus:outline-none focus:ring-1 focus:ring-[#6C3FC8] dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setMemoLoading(true);
                      await fetch("/api/memo-tip", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ wordId: memoWordId, tip: memoInput.trim() }),
                      }).catch(() => {});
                      setMemoTip(memoInput.trim());
                      setMemoLoading(false);
                      setShowMemoInput(false);
                    }}
                    disabled={memoLoading}
                    className="rounded-lg bg-[#6C3FC8] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#5b34b0] disabled:opacity-50"
                  >
                    {memoLoading ? "Sauvegarde…" : "Sauvegarder"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMemoInput(false)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
                  >
                    Passer
                  </button>
                </div>
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
          <BackLink href="/app" onClick={() => saveSessionAndGoBack()} />
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {progressLabel}
          </span>
        </div>
        {current && (
          <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 dark:border-slate-600 dark:bg-slate-800">
            <div className="flex items-center gap-2">
              <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                {displayText}
              </p>
              <SpeakButton text={displayText} lang={displayLang} />
            </div>
            <div className="mt-4">
              <input
                ref={dicteeInputRef}
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
                    className="btn-relief rounded-lg bg-primary/20 px-3 py-2 text-sm font-medium text-primary-dark dark:bg-primary/30 dark:text-primary-light"
                  >
                    Réessayer
                  </button>
                  {!writeRevealed && (
                    <button
                      type="button"
                      onClick={onWrongReveal}
                      className="btn-relief rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:text-slate-300"
                    >
                      Révéler
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onWrongLater}
                    className="btn-relief rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                  >
                    Plus tard
                  </button>
                  {writeRevealed && (
                    <button
                      type="button"
                      onClick={onWrongNext}
                      className="btn-relief rounded-lg bg-slate-700 px-3 py-2 text-sm text-white dark:bg-slate-600"
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
                className="btn-relief mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
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
