"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb } from "lucide-react";
import SessionEndScreen from "@/components/student/SessionEndScreen";
import { computeSessionXP } from "@/lib/xp";
import { BackLink } from "@/components/back-link";
import {
  detectListLanguages,
  KNOWN_LANGUAGE_CODES,
} from "@/lib/language";
import { playCorrectSound, playWrongSound } from "@/lib/sound-feedback";
import { DicteeSession, FlashcardSession } from "./revision-session";

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

type Mode = "flashcard" | "dictee";
type Direction = "term_to_def" | "def_to_term";

/** Flux dictée : saisie → erreur (réessai / révéler) → révélé (Continuer) ou correct (Mot suivant). */
type DicteePhase = "typing" | "wrong_unrevealed" | "revealed_fail" | "correct_feedback";

function normalizeForCompare(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isDicteeAnswerCorrect(userAnswer: string, expected: string): boolean {
  const alternatives: string[] = [expected];
  if (expected.includes("/")) {
    for (const part of expected.split(/\s*\/\s*/)) {
      alternatives.push(part);
    }
  }
  const normalizedUser = normalizeForCompare(userAnswer);
  if (!normalizedUser) return false;
  return alternatives.some((alt) => {
    const normalized = normalizeForCompare(alt);
    return normalized.length > 0 && normalizedUser === normalized;
  });
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
  initialMode,
  initialListIds = [],
  initialDirection = "term_to_def",
  /** Page de sélection (sans `?session=1`) pour retour / fin de session */
  pickerPath,
}: {
  initialMode: Mode;
  initialListIds?: string[];
  initialDirection?: Direction;
  pickerPath: string;
}) {
  const router = useRouter();
  const [mode] = useState<Mode>(initialMode);
  const [lists, setLists] = useState<BibliothequeList[]>([]);
  const [selectedListIds, setSelectedListIds] = useState<Set<string>>(
    () => new Set(initialListIds)
  );
  const [direction, setDirection] = useState<Direction>(initialDirection);

  const [words, setWords] = useState<DueWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintPenalty, setHintPenalty] = useState(0);
  const [sending, setSending] = useState(false);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [sessionTotalWords, setSessionTotalWords] = useState(0);
  const [wordsSeen, setWordsSeen] = useState(0);
  const [wordsRetained, setWordsRetained] = useState(0);
  /** Compteur « Oui ! » (lexivaFlash 5) pour la barre de session flashcards. */
  const [flashOuiCount, setFlashOuiCount] = useState(0);
  const [wordsWritten, setWordsWritten] = useState(0);
  const [laterWords, setLaterWords] = useState<DueWord[]>([]);
  const [writeAnswer, setWriteAnswer] = useState("");
  const [dicteePhase, setDicteePhase] = useState<DicteePhase>("typing");
  const [dicteeHadRetry, setDicteeHadRetry] = useState(false);
  const [lastWrongAnswer, setLastWrongAnswer] = useState("");
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([]);
  const [feedbackSoundsEnabled, setFeedbackSoundsEnabled] = useState(true);
  /** Langues détectées sur la liste (term / definition) pour l’écran « Sens de la dictée ». */
  const [directionLanguages, setDirectionLanguages] = useState<{
    termLang: string;
    defLang: string;
  } | null>(null);
  const hasSavedEndOfSession = useRef(false);
  const dicteeInputRef = useRef<HTMLInputElement>(null);
  const [showEndRecap, setShowEndRecap] = useState(false);
  const [endSessionDurationSeconds, setEndSessionDurationSeconds] = useState(0);
  const [failedWords, setFailedWords] = useState<DueWord[]>([]);
  const [isSandboxSession, setIsSandboxSession] = useState(false);
  const [successStreak, setSuccessStreak] = useState<Record<string, number>>({});
  const [sandboxMasteredCount, setSandboxMasteredCount] = useState(0);
  const [sandboxTotalWords, setSandboxTotalWords] = useState(0);
  const current = words[index];

  const addFailedWord = useCallback((word: DueWord) => {
    setFailedWords((prev) =>
      prev.some((w) => w.id === word.id) ? prev : [...prev, word]
    );
  }, []);

  const resetSandboxState = useCallback(() => {
    setIsSandboxSession(false);
    setSuccessStreak({});
    setSandboxMasteredCount(0);
    setSandboxTotalWords(0);
    setFailedWords([]);
  }, []);

  const applySandboxOutcome = useCallback((word: DueWord, success: boolean) => {
    const id = word.id;
    setSuccessStreak((prev) => {
      const nextStreak = success ? (prev[id] ?? 0) + 1 : 0;
      if (success && nextStreak >= 2) {
        setSandboxMasteredCount((c) => c + 1);
        setWords((w) => w.filter((x) => x.id !== id));
      } else {
        setWords((w) => {
          const rest = w.filter((x) => x.id !== id);
          return [...rest, word];
        });
      }
      return { ...prev, [id]: success ? nextStreak : 0 };
    });
  }, []);

  const [memoTip, setMemoTip] = useState<string>("");
  const [memoInput, setMemoInput] = useState<string>("");
  const [showMemoPopover, setShowMemoPopover] = useState<boolean>(false);
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

  const goToPicker = useCallback(
    (preserveListIds = true) => {
      const params = new URLSearchParams();
      if (preserveListIds && selectedListIds.size > 0) {
        params.set("listIds", [...selectedListIds].join(","));
      }
      const qs = params.toString();
      router.push(qs ? `${pickerPath}?${qs}` : pickerPath);
    },
    [pickerPath, router, selectedListIds]
  );

  useEffect(() => {
    if (!initialListIds?.length) return;
    setSelectedListIds(new Set(initialListIds));
  }, [initialListIds.join(",")]);

  useEffect(() => {
    fetch("/api/user/preferences")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.preferredLanguages)) setPreferredLanguages(data.preferredLanguages);
        else if (data.preferredLanguage ?? data.preferredLanguage2)
          setPreferredLanguages([data.preferredLanguage, data.preferredLanguage2].filter(Boolean) as string[]);
        if (typeof data.feedbackSoundsEnabled === "boolean") {
          setFeedbackSoundsEnabled(data.feedbackSoundsEnabled);
        }
      })
      .catch(() => {});
  }, []);

  const playEvalFeedback = useCallback(
    (correct: boolean) => {
      if (!feedbackSoundsEnabled) return;
      if (correct) playCorrectSound();
      else playWrongSound();
    },
    [feedbackSoundsEnabled]
  );

  useEffect(() => {
    if (selectedListIds.size === 0) return;
    fetch("/api/bibliotheque")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.lists)) setLists(data.lists as BibliothequeList[]);
      })
      .catch(() => {});
  }, [selectedListIds]);

  useEffect(() => {
    setShowMemoPopover(false);
    if (!current?.id) {
      setMemoTip("");
      setMemoInput("");
      return;
    }
    fetch(`/api/memo-tip?wordId=${encodeURIComponent(current.id)}`)
      .then((r) => r.json())
      .then((data) => {
        const tip = typeof data.tip === "string" ? data.tip : "";
        setMemoTip(tip);
        setMemoInput(tip);
      })
      .catch(() => {
        setMemoTip("");
        setMemoInput("");
      });
  }, [current?.id]);

  /** Nouveau mot dictée : réinitialiser le flux local. */
  useEffect(() => {
    if (mode !== "dictee" || !current?.id) return;
    setDicteePhase("typing");
    setDicteeHadRetry(false);
    setLastWrongAnswer("");
    setWriteAnswer("");
  }, [mode, current?.id]);

  /** Détecte les langues réelles (term / definition) de la première liste sélectionnée pour afficher les bons drapeaux. */
  useEffect(() => {
    if (selectedListIds.size === 0) return;
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
  }, [selectedListIds, lists, preferredLanguages]);

  useEffect(() => {
    if (mode !== "dictee" || words.length > 0 || laterWords.length === 0) return;
    setWords([...laterWords]);
    setLaterWords([]);
    setIndex(0);
  }, [mode, words.length, laterWords.length]);

  useEffect(() => {
    if (isSandboxSession) return;
    if (
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
        mode,
        direction,
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
    isSandboxSession,
    words.length,
    laterWords.length,
    sessionTotalWords,
    sessionStart,
    mode,
    direction,
    wordsSeen,
    wordsRetained,
    wordsWritten,
    lists,
    selectedListIds,
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
    setFlashOuiCount(0);
    setWordsWritten(0);
    setWriteAnswer("");
    setDicteePhase("typing");
    setDicteeHadRetry(false);
    setLastWrongAnswer("");
    hasSavedEndOfSession.current = false;
    setShowEndRecap(false);
  }, []);

  const startReplayFailed = useCallback(() => {
    if (failedWords.length === 0) return;
    setShowEndRecap(false);
    setIsSandboxSession(true);
    setSuccessStreak({});
    setSandboxMasteredCount(0);
    setSandboxTotalWords(failedWords.length);
    applySessionWords([...failedWords]);
  }, [failedWords, applySessionWords]);

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

  const didStartSessionLoad = useRef(false);
  useEffect(() => {
    if (selectedListIds.size === 0) return;
    if (didStartSessionLoad.current) return;
    didStartSessionLoad.current = true;
    loadSessionWords();
  }, [selectedListIds, loadSessionWords]);

  /**
   * Dictée : SM-2 via rating API (0–3). Premier essai réussi → 3 (parfait) ;
   * après réessai → 2 (bien) ; échec / révélé / « je ne sais pas » → 0.
   */
  async function recordDicteeCompletion(rating: 0 | 2 | 3) {
    if (!current || sending) return;
    const success = rating >= 2;
    if (isSandboxSession) {
      setSending(true);
      setError("");
      try {
        applySandboxOutcome(current, success);
        setWriteAnswer("");
        setDicteePhase("typing");
        setDicteeHadRetry(false);
        setLastWrongAnswer("");
        setIndex(0);
      } finally {
        setSending(false);
      }
      return;
    }
    if (rating === 0) {
      addFailedWord(current);
    }
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
      setWordsWritten((n) => n + 1);
      setWords((prev) => prev.filter((w) => w.id !== current.id));
      setWriteAnswer("");
      setDicteePhase("typing");
      setDicteeHadRetry(false);
      setLastWrongAnswer("");
      setIndex(0);
    } finally {
      setSending(false);
    }
  }

  /**
   * Flashcards Lexiva : échelle affichée 1 / 3 / 5 → API `lexivaFlash` → SM-2 (1, 2, 3).
   */
  async function recordFlashcardLexivaRating(lexivaFlash: 1 | 3 | 5) {
    if (!current || sending) return;
    playEvalFeedback(lexivaFlash === 5);
    const sm2Rating = lexivaFlash === 5 ? 3 : lexivaFlash === 3 ? 2 : 1;
    const success = sm2Rating >= 2;
    if (isSandboxSession) {
      setSending(true);
      setError("");
      try {
        applySandboxOutcome(current, success);
        setRevealed(false);
        setIndex(0);
        setHintsUsed(0);
        setHintPenalty(0);
      } finally {
        setSending(false);
      }
      return;
    }
    if (lexivaFlash === 1) {
      addFailedWord(current);
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordId: current.id,
          lexivaFlash,
          hintPenalty,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erreur enregistrement");
        setSending(false);
        return;
      }
      setWordsSeen((n) => n + 1);
      if (success) setWordsRetained((n) => n + 1);
      if (lexivaFlash === 5) setFlashOuiCount((n) => n + 1);

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
      setHintsUsed(0);
      setHintPenalty(0);
    } finally {
      setSending(false);
    }
  }

  /** Sauvegarde l’astuce mémo du mot courant (POST /api/memo-tip) puis ferme le popover. */
  async function saveMemoTip() {
    if (!current || isSandboxSession) return;
    const tip = memoInput.trim();
    setMemoLoading(true);
    try {
      await fetch("/api/memo-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: current.id, tip }),
      });
      setMemoTip(tip);
    } catch {
      /* échec silencieux : ne pas casser la révision */
    } finally {
      setMemoLoading(false);
      setShowMemoPopover(false);
    }
  }

  /** Sauvegarde la session en cours puis retourne à l’écran de sélection des listes. */
  async function saveSessionAndGoBack() {
    if (isSandboxSession) {
      resetSandboxState();
      setWords([]);
      setSessionStart(null);
      goToPicker(true);
      return;
    }
    if (sessionStart) {
      const endedAt = Date.now();
      const durationSeconds = Math.round((endedAt - sessionStart) / 1000);
      const lang =
        lists.find((l) => selectedListIds.has(l.id))?.language ?? null;
      await fetch("/api/revision/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          direction,
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
    goToPicker(true);
  }

  /** Sauvegarde la session puis navigation vers l’évaluation (sans modifier les autres routes). */
  async function saveSessionAndNavigateToEvaluation() {
    if (isSandboxSession) {
      resetSandboxState();
      setWords([]);
      setSessionStart(null);
      goToPicker(true);
      return;
    }
    if (sessionStart) {
      const endedAt = Date.now();
      const durationSeconds = Math.round((endedAt - sessionStart) / 1000);
      const lang =
        lists.find((l) => selectedListIds.has(l.id))?.language ?? null;
      await fetch("/api/revision/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          direction,
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
    router.push("/app/evaluation");
  }

  const selectedLang = selectedListIds.size > 0
    ? lists.find((l) => selectedListIds.has(l.id))?.language ?? null
    : null;

  if (loading && words.length === 0) {
    return (
      <div className="space-y-4">
        <BackLink href={pickerPath} />
        <p className="text-[var(--foreground-muted)]">Chargement des mots…</p>
      </div>
    );
  }
  if (error && words.length === 0) {
    return (
      <div className="space-y-4">
        <BackLink href={pickerPath} />
        <p className="rounded-lg bg-false-bg p-3 text-false-text">
          {error}
        </p>
        <button
          type="button"
          onClick={() => goToPicker(true)}
          className="btn-relief rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)]"
        >
          Changer de listes ou sens
        </button>
      </div>
    );
  }
    if (words.length === 0 && laterWords.length === 0) {
      if (isSandboxSession && sandboxTotalWords > 0 && sessionStart) {
        return (
          <SessionEndScreen
            wordsSeen={sandboxTotalWords}
            wordsRetained={sandboxMasteredCount}
            mode={mode}
            variant="sandbox"
            sandboxWordCount={sandboxTotalWords}
            onNewSession={() => {}}
            onHome={() => {
              resetSandboxState();
              setWords([]);
              setSessionStart(null);
              router.push("/app");
            }}
          />
        );
      }
      if (showEndRecap) {
        const durationMin = Math.floor(endSessionDurationSeconds / 60);
        const durationSec = endSessionDurationSeconds % 60;
        const durationStr =
          durationMin > 0 && durationSec > 0
            ? `${durationMin} min ${durationSec} s`
            : durationMin > 0
              ? `${durationMin} min`
              : `${durationSec} s`;
        return (
          <SessionEndScreen
            wordsSeen={wordsSeen}
            wordsRetained={wordsRetained}
            wordsWritten={mode === "dictee" ? wordsWritten : undefined}
            xpGained={computeSessionXP({
              wordsRetained,
              wordsWritten: mode === "dictee" ? wordsWritten : 0,
            })}
            durationStr={durationStr}
            mode={mode}
            failedCount={failedWords.length}
            onReplayFailed={startReplayFailed}
            onNewSession={() => goToPicker(false)}
            onHome={() => router.push("/app")}
          />
        );
      }
      return (
        <div className="space-y-4">
          <BackLink
            href={pickerPath}
            onClick={() => {
              void saveSessionAndGoBack();
            }}
          />
          <p className="text-[var(--foreground-muted)]">
            Aucun mot à réviser pour les listes choisies. Reviens plus tard.
          </p>
          <button
            type="button"
            onClick={() => goToPicker(false)}
            className="btn-relief rounded-lg bg-primary px-4 py-2 text-surface hover:bg-primary-dark"
          >
            Nouvelle session
          </button>
        </div>
      );
    }

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

    /**
     * Bouton « ampoule » + popover d’astuce mémo.
     * Inline : coin de la carte (flashcards et dictée).
     */
    const renderMemoTipButton = () => (
      <div
        className="relative z-40"
        data-card-action
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowMemoPopover((o) => !o);
          }}
          aria-label="Astuce mémo"
          className="flex items-center justify-center rounded-full transition"
          style={{
            width: 48,
            height: 48,
            background: showMemoPopover ? "var(--ink)" : "var(--mark)",
            border: "1.5px solid var(--ink)",
          }}
        >
          <Lightbulb
            className="h-5 w-5 shrink-0"
            style={{ color: showMemoPopover ? "var(--surface)" : "var(--ink)" }}
            aria-hidden
          />
        </button>

        {showMemoPopover && (
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: 56,
              right: 0,
              width: 230,
              maxWidth: "calc(100vw - 48px)",
              background: "var(--surface)",
              border: "0.5px solid var(--line)",
              borderRadius: 14,
              boxShadow: "0 8px 24px color-mix(in srgb, var(--ink) 15%, transparent)",
              padding: 14,
              zIndex: 50,
              textAlign: "left",
            }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--ink)",
                marginBottom: 8,
              }}
            >
              💡 Astuce mémo
            </p>
            <textarea
              value={memoInput}
              onChange={(e) => setMemoInput(e.target.value)}
              placeholder="Écris un moyen mnémotechnique pour retenir ce mot…"
              rows={3}
              className="w-full"
              style={{
                fontSize: 12,
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid var(--line)",
                background: "var(--page)",
                color: "var(--foreground)",
                outline: "none",
                resize: "none",
                marginBottom: 8,
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void saveMemoTip();
              }}
              disabled={memoLoading}
              className="w-full disabled:opacity-50"
              style={{
                fontSize: 12,
                fontWeight: 500,
                padding: "8px 0",
                borderRadius: 12,
                border: "none",
                background: "var(--ink)",
                color: "var(--surface)",
                cursor: "pointer",
              }}
            >
              {memoLoading ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        )}
      </div>
    );

    if (mode === "flashcard") {
      const flashWordsDone = isSandboxSession
        ? sandboxMasteredCount
        : sessionTotalWords - words.length;
      const flashProgressTotal = isSandboxSession
        ? sandboxTotalWords
        : sessionTotalWords;
      const flashProgressPct =
        flashProgressTotal > 0
          ? Math.min(100, (flashWordsDone / flashProgressTotal) * 100)
          : 0;
      const flashSlotLabel = isSandboxSession
        ? `${sandboxMasteredCount} / ${sandboxTotalWords} maîtrisés`
        : `${Math.min(flashWordsDone + 1, sessionTotalWords)} / ${sessionTotalWords} mots`;

      return (
        <FlashcardSession
          onQuit={() => {
            void saveSessionAndNavigateToEvaluation();
          }}
          progressPct={flashProgressPct}
          slotLabel={flashSlotLabel}
          goodCount={flashOuiCount}
          termLang={sessionLangTerm}
          defLang={sessionLangDef}
          direction={direction}
          onDirection={(next) => {
            if (next === direction || sending) return;
            setDirection(next);
            setRevealed(false);
          }}
          displayText={displayText}
          answerText={answerText}
          displayLang={displayLang}
          answerLang={answerLang}
          revealed={revealed}
          onReveal={() => {
            if (!sending) setRevealed(true);
          }}
          sending={sending}
          onRate={(rating) => recordFlashcardLexivaRating(rating)}
          onSpeak={speakWord}
          memo={renderMemoTipButton()}
          error={error}
        />
      );
    }

    const dicteeWordsDone = isSandboxSession
      ? sandboxMasteredCount
      : sessionTotalWords - words.length;
    const dicteeProgressTotal = isSandboxSession
      ? sandboxTotalWords
      : sessionTotalWords;
    const dicteeProgressPct =
      dicteeProgressTotal > 0
        ? Math.min(100, (dicteeWordsDone / dicteeProgressTotal) * 100)
        : 0;
    const dicteeSlotLabel = isSandboxSession
      ? `${sandboxMasteredCount} / ${sandboxTotalWords} maîtrisés`
      : `${Math.min(dicteeWordsDone + 1, sessionTotalWords)} / ${sessionTotalWords} mots`;

    function validateDictee() {
      if (!current || sending || dicteePhase !== "typing") return;
      if (!writeAnswer.trim()) return;
      const ok = isDicteeAnswerCorrect(writeAnswer, answerText);
      playEvalFeedback(ok);
      if (ok) {
        setDicteePhase("correct_feedback");
      } else {
        setLastWrongAnswer(writeAnswer.trim());
        setDicteePhase("revealed_fail");
      }
    }

    function advanceDictee() {
      if (sending) return;
      if (dicteePhase === "correct_feedback") {
        void recordDicteeCompletion(dicteeHadRetry ? 2 : 3);
      } else if (dicteePhase === "revealed_fail" || dicteePhase === "wrong_unrevealed") {
        void recordDicteeCompletion(0);
      }
    }

    return (
      <DicteeSession
        onQuit={() => {
          void saveSessionAndNavigateToEvaluation();
        }}
        progressPct={dicteeProgressPct}
        slotLabel={dicteeSlotLabel}
        goodCount={
          wordsRetained +
          (!isSandboxSession && dicteePhase === "correct_feedback" ? 1 : 0)
        }
        displayText={displayText}
        answerText={answerText}
        displayLang={displayLang}
        phase={dicteePhase}
        writeAnswer={writeAnswer}
        onWriteAnswer={setWriteAnswer}
        onValidate={validateDictee}
        onNext={advanceDictee}
        sending={sending}
        onSpeak={() => speakWord(displayText, displayLang)}
        memo={renderMemoTipButton()}
        error={error}
        inputRef={dicteeInputRef}
      />
    );
}
