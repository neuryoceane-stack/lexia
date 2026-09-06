"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Check,
  RotateCcw,
  ArrowRight,
  ChevronDown,
  Volume2,
  RefreshCw,
  Clock,
  Lightbulb,
} from "lucide-react";
import SessionEndScreen from "@/components/student/SessionEndScreen";
import { computeSessionXP } from "@/lib/xp";
import { useVisualViewportLayout } from "@/hooks/use-keyboard-bottom-inset";
import { BackLink } from "@/components/back-link";
import { FlagDisplay } from "@/components/flag-display";
import {
  PREFERRED_LANGUAGE_OPTIONS,
  detectListLanguages,
  KNOWN_LANGUAGE_CODES,
} from "@/lib/language";
import { playCorrectSound, playWrongSound } from "@/lib/sound-feedback";

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
  const visualViewportLayout = useVisualViewportLayout();
  const [isDicteeMobile, setIsDicteeMobile] = useState(false);
  const [mode] = useState<Mode>(initialMode);
  const [lists, setLists] = useState<BibliothequeList[]>([]);
  const [selectedListIds, setSelectedListIds] = useState<Set<string>>(
    () => new Set(initialListIds)
  );
  const [direction] = useState<Direction>(initialDirection);

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
  /** Champ de saisie dictée : focus entre les mots (si le clavier était déjà actif). */
  const dicteeInputRef = useRef<HTMLInputElement>(null);
  /** L'utilisateur a interagi avec le champ au moins une fois. */
  const dicteeUserEngagedRef = useRef(false);
  /** Le champ avait le focus au moment de quitter la phase saisie. */
  const dicteeInputHadFocusRef = useRef(false);
  /** Reprendre le focus au mot suivant (false si l'utilisateur a fermé le clavier). */
  const dicteePreserveFocusRef = useRef(false);
  const prevDicteePhaseRef = useRef<DicteePhase>("typing");
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

  /** Dictée mobile : layout fixe calé sur le visualViewport + pas de scroll document. */
  useEffect(() => {
    if (mode !== "dictee") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const syncMobile = () => setIsDicteeMobile(mq.matches);
    syncMobile();
    mq.addEventListener("change", syncMobile);

    if (!mq.matches) {
      return () => mq.removeEventListener("change", syncMobile);
    }

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    const lockScroll = () => {
      window.scrollTo(0, 0);
    };
    lockScroll();
    window.visualViewport?.addEventListener("scroll", lockScroll);
    window.addEventListener("scroll", lockScroll, { passive: true });

    return () => {
      mq.removeEventListener("change", syncMobile);
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      window.visualViewport?.removeEventListener("scroll", lockScroll);
      window.removeEventListener("scroll", lockScroll);
      setIsDicteeMobile(false);
    };
  }, [mode]);

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
    dicteeUserEngagedRef.current = false;
    dicteeInputHadFocusRef.current = false;
    dicteePreserveFocusRef.current = false;
    prevDicteePhaseRef.current = "typing";
    hasSavedEndOfSession.current = false;
    setShowEndRecap(false);
  }, []);

  const markDicteeInputEngaged = useCallback(() => {
    dicteeUserEngagedRef.current = true;
  }, []);

  const handleDicteeInputFocus = useCallback(() => {
    dicteeUserEngagedRef.current = true;
    dicteeInputHadFocusRef.current = true;
  }, []);

  const handleDicteeInputBlur = useCallback(() => {
    requestAnimationFrame(() => {
      if (dicteeInputRef.current === document.activeElement) return;
      dicteeInputHadFocusRef.current = false;
    });
  }, []);

  const focusDicteeInput = useCallback(() => {
    const attempt = () => {
      const el = dicteeInputRef.current;
      if (!el || el.disabled) return;
      try {
        el.focus({ preventScroll: true });
      } catch {
        // Certains navigateurs mobiles ignorent focus() sans geste utilisateur préalable.
      }
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(attempt);
    });
  }, []);

  /** Mémorise si le champ avait le focus en quittant la phase saisie. */
  useEffect(() => {
    if (mode !== "dictee") return;
    if (prevDicteePhaseRef.current === "typing" && dicteePhase !== "typing") {
      dicteePreserveFocusRef.current = dicteeInputHadFocusRef.current;
    }
    prevDicteePhaseRef.current = dicteePhase;
  }, [mode, dicteePhase]);

  /** Nouveau mot : réinitialiser l'état focus local (la préservation est déjà mémorisée). */
  useEffect(() => {
    if (mode !== "dictee" || !current?.id) return;
    dicteeInputHadFocusRef.current = false;
  }, [mode, current?.id]);

  /**
   * Dictée : reprend le focus entre les mots si le clavier était actif.
   * Mobile — pas au 1er mot ; desktop — focus auto à chaque mot.
   */
  useEffect(() => {
    if (mode !== "dictee" || !current || dicteePhase !== "typing" || sending) return;

    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches;

    if (isMobile) {
      if (!dicteeUserEngagedRef.current || !dicteePreserveFocusRef.current) return;
    }

    focusDicteeInput();

    if (!isMobile) return;

    const retry = window.setTimeout(focusDicteeInput, 120);
    return () => window.clearTimeout(retry);
  }, [mode, current?.id, dicteePhase, sending, focusDicteeInput]);

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
        <p className="rounded-lg bg-red-50 p-3 text-red-700">
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
            className="btn-relief rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-dark"
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

    const SpeakButton = ({
      text,
      lang,
      className = "",
      stopPropagation = false,
      variant = "default",
    }: {
      text: string;
      lang: string;
      className?: string;
      stopPropagation?: boolean;
      variant?: "default" | "tile";
    }) => (
      <button
        type="button"
        onClick={(e) => {
          if (stopPropagation) e.stopPropagation();
          speakWord(text, lang);
        }}
        className={
          variant === "tile"
            ? `inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition hover:brightness-95 ${className}`
            : `inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--background-subtle)] text-[var(--foreground-muted)] transition hover:bg-[var(--background-card)] ${className}`
        }
        style={
          variant === "tile"
            ? {
                background: "#F0EDF8",
                border: "0.5px solid #DDD6F5",
              }
            : undefined
        }
        aria-label="Écouter la prononciation"
      >
        {variant === "tile" ? (
          <Volume2 className="h-3.5 w-3.5 shrink-0 text-[#6C3FC8]" aria-hidden />
        ) : (
          <span aria-hidden>🔊</span>
        )}
      </button>
    );

    /**
     * Bouton « ampoule » + popover d’astuce mémo.
     * @param right décalage horizontal (px) en mode absolute.
     * @param layout absolute = coin carte flashcards ; inline = colonne d’icônes dictée.
     */
    const renderMemoTipButton = (
      right = 12,
      layout: "absolute" | "inline" = "absolute"
    ) => (
      <div
        className={layout === "inline" ? "relative z-40" : undefined}
        style={
          layout === "absolute"
            ? { position: "absolute", top: 12, right, zIndex: 40 }
            : undefined
        }
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
            width: 32,
            height: 32,
            background: showMemoPopover ? "#6C3FC8" : "#FCEFD6",
            border: `0.5px solid ${showMemoPopover ? "#6C3FC8" : "#F3D8A0"}`,
          }}
        >
          <Lightbulb
            className="h-3.5 w-3.5 shrink-0"
            style={{ color: showMemoPopover ? "#FFFFFF" : "#B9791A" }}
            aria-hidden
          />
        </button>

        {showMemoPopover && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: 40,
              right: layout === "inline" ? -4 : 0,
              width: 230,
              maxWidth: "calc(100vw - 48px)",
              background: "#FFFFFF",
              border: "0.5px solid #E2DAF2",
              borderRadius: 14,
              boxShadow: "0 8px 24px rgba(108,63,200,0.15)",
              padding: 14,
              zIndex: 50,
              textAlign: "left",
            }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#6C3FC8",
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
                border: "1px solid #E2DAF2",
                background: "#F8F7FF",
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
                background: "#6C3FC8",
                color: "#FFFFFF",
                cursor: "pointer",
              }}
            >
              {memoLoading ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        )}
      </div>
    );

    function getHintDisplay(word: string, hintsUsed: number): string {
      if (hintsUsed === 0) return "";
      return word
        .split("")
        .map((char, i) => {
          if (char === " ") return "   ";
          if (i < hintsUsed) return char;
          return "_";
        })
        .join(" ");
    }

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

      const revealHint =
        direction === "term_to_def"
          ? "Appuie pour révéler la traduction"
          : "Appuie pour révéler le mot";

      const borderTertiaryFlash = "rgba(108, 63, 200, 0.14)";

      const flipCard = () => {
        if (!sending) setRevealed(true);
      };

      return (
        <div
          className="flex min-h-[50vh] flex-col"
          style={{ background: "#F8F7FF" }}
        >
          <div
            aria-hidden="true"
            className="fixed inset-0 -z-10"
            style={{ background: "#F8F7FF" }}
          />
          {error ? (
            <p
              className="mb-3 rounded-xl px-3 py-2 text-sm text-red-700"
              style={{ background: "#FCEBEB" }}
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="flex items-center" style={{ marginBottom: 24, gap: 12 }}>
            <button
              type="button"
              onClick={() => {
                void saveSessionAndNavigateToEvaluation();
              }}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0"
              style={{
                fontSize: 12,
                color: "var(--foreground-muted)",
              }}
            >
              <X className="h-3 w-3 shrink-0" aria-hidden />
              Quitter
            </button>

            <div className="min-w-0 flex-1">
              <div
                className="overflow-hidden"
                style={{
                  height: 6,
                  background: "var(--background-subtle)",
                  borderRadius: 3,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${flashProgressPct}%`,
                    background: "#6C3FC8",
                    borderRadius: 3,
                    transition: "width 400ms ease",
                  }}
                />
              </div>
              <p
                className="mt-1 text-right"
                style={{
                  fontSize: 11,
                  color: "var(--foreground-muted)",
                  marginTop: 4,
                }}
              >
                {flashSlotLabel}
              </p>
            </div>

            <div
              className="flex shrink-0 items-center gap-[5px]"
              style={{
                background: "#EAF4EF",
                borderRadius: 10,
                padding: "5px 10px",
              }}
            >
              <Check
                className="h-3 w-3 shrink-0"
                stroke="#1D9E75"
                aria-hidden
              />
              <span style={{ fontSize: 13, fontWeight: 500, color: "#1D9E75" }}>
                {flashOuiCount}
              </span>
              <span style={{ fontSize: 11, color: "#1D9E75" }}>bons</span>
            </div>
          </div>

          {current ? (
            <div className="relative flex flex-1 flex-col">
              {renderMemoTipButton(52)}
              {!revealed ? (
                <>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={flipCard}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        flipCard();
                      }
                    }}
                    className="relative cursor-pointer transition-transform duration-150 ease-out hover:-translate-y-0.5"
                    style={{
                      background: "#FFFFFF",
                      borderRadius: 20,
                      borderWidth: 0.5,
                      borderStyle: "solid",
                      borderColor: borderTertiaryFlash,
                      padding: "48px 24px",
                      marginBottom: 20,
                      textAlign: "center",
                      minHeight: 200,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                    }}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakWord(displayText, displayLang);
                      }}
                      className="absolute flex items-center justify-center rounded-full"
                      style={{
                        top: 12,
                        right: 12,
                        width: 32,
                        height: 32,
                        background: "#F0EDF8",
                        border: "0.5px solid #DDD6F5",
                      }}
                      aria-label="Écouter le mot affiché"
                    >
                      <Volume2 className="h-3.5 w-3.5 shrink-0 text-[#6C3FC8]" />
                    </button>
                    <p
                      style={{
                        fontSize: 40,
                        fontWeight: 500,
                        color: "var(--foreground)",
                        lineHeight: 1.2,
                      }}
                    >
                      {displayText}
                    </p>
                    <div
                      className="flex items-center justify-center gap-[5px]"
                      style={{
                        fontSize: 12,
                        color: "var(--foreground-muted)",
                      }}
                    >
                      <ChevronDown
                        className="h-[11px] w-[11px] shrink-0 opacity-80"
                        aria-hidden
                      />
                      {revealHint}
                    </div>
                  </div>

                  {hintsUsed > 0 && (
                    <p
                      style={{
                        fontFamily: "DM Sans, var(--font-sans), sans-serif",
                        fontSize: 18,
                        fontWeight: 500,
                        color: "#6C3FC8",
                        letterSpacing: "4px",
                        textAlign: "center",
                        marginBottom: 12,
                        minHeight: 28,
                      }}
                    >
                      {getHintDisplay(answerText, hintsUsed)}
                    </p>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "center",
                      marginBottom: 12,
                    }}
                  >
                    {(
                      [
                        { label: "1ère lettre", index: 1 },
                        { label: "2ème lettre", index: 2 },
                        { label: "3ème lettre", index: 3 },
                      ] as const
                    ).map(({ label, index: hintIndex }) => {
                      const isUnlocked = hintsUsed >= hintIndex - 1;
                      const isUsed = hintsUsed >= hintIndex;
                      return (
                        <button
                          key={hintIndex}
                          type="button"
                          disabled={!isUnlocked || isUsed}
                          onClick={() => {
                            setHintsUsed(hintIndex);
                            setHintPenalty(
                              (prev) => Math.round((prev + 0.1) * 10) / 10
                            );
                          }}
                          style={{
                            padding: "4px 10px",
                            fontSize: 11,
                            fontFamily: "DM Sans, var(--font-sans), sans-serif",
                            fontWeight: 500,
                            borderRadius: 20,
                            border: "1px solid",
                            borderColor: isUsed
                              ? "#6C3FC8"
                              : isUnlocked
                                ? "#D1C8F0"
                                : "#E8E8E8",
                            backgroundColor: isUsed ? "#EDE8FB" : "white",
                            color: isUsed
                              ? "#6C3FC8"
                              : isUnlocked
                                ? "#9B8EC4"
                                : "#D0D0D0",
                            cursor:
                              isUnlocked && !isUsed ? "pointer" : "default",
                            transition: "all 0.15s",
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={flipCard}
                    disabled={sending}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 border-0 text-white disabled:opacity-50"
                    style={{
                      background: "#6C3FC8",
                      borderRadius: 12,
                      padding: 13,
                      fontSize: 14,
                      fontWeight: 500,
                      gap: 8,
                    }}
                  >
                    <RefreshCw className="h-3.5 w-3.5 shrink-0 text-white" />
                    Retourner la carte
                  </button>
                </>
              ) : (
                <>
                  <div
                    className="relative"
                    style={{
                      background: "#F0EDF8",
                      borderRadius: 20,
                      borderWidth: 1.5,
                      borderStyle: "solid",
                      borderColor: "#DDD6F5",
                      padding: "32px 24px",
                      marginBottom: 20,
                      textAlign: "center",
                      minHeight: 200,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakWord(answerText || "", answerLang);
                      }}
                      className="absolute flex items-center justify-center rounded-full"
                      style={{
                        top: 12,
                        right: 12,
                        width: 32,
                        height: 32,
                        background: "rgba(108,63,200,0.12)",
                        border: "0.5px solid rgba(108,63,200,0.2)",
                      }}
                      aria-label="Écouter la traduction"
                    >
                      <Volume2 className="h-3.5 w-3.5 shrink-0 text-[#6C3FC8]" />
                    </button>
                    <p
                      style={{
                        fontSize: 20,
                        fontWeight: 500,
                        color: "#6C3FC8",
                      }}
                    >
                      {displayText}
                    </p>
                    <div
                      style={{
                        width: 40,
                        height: 1,
                        background: "#DDD6F5",
                        margin: "4px auto",
                      }}
                    />
                    <p
                      style={{
                        fontSize: 32,
                        fontWeight: 500,
                        color: "var(--foreground)",
                      }}
                    >
                      {answerText || "—"}
                    </p>
                  </div>

                  <div className="flex w-full" style={{ gap: 10 }}>
                    <button
                      type="button"
                      disabled={sending}
                      onClick={() => void recordFlashcardLexivaRating(1)}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-2 bg-transparent disabled:opacity-50"
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        padding: 13,
                        borderRadius: 12,
                        border: "1.5px solid #F09595",
                        color: "#E24B4A",
                      }}
                    >
                      <X className="h-3 w-3 shrink-0 text-[#E24B4A]" />
                      Non
                    </button>
                    <button
                      type="button"
                      disabled={sending}
                      onClick={() => void recordFlashcardLexivaRating(3)}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-2 bg-transparent disabled:opacity-50"
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        padding: 13,
                        borderRadius: 12,
                        border: "1.5px solid #F5D08A",
                        color: "#C47D0A",
                      }}
                    >
                      <Clock className="h-3 w-3 shrink-0 text-[#C47D0A]" />
                      Presque
                    </button>
                    <button
                      type="button"
                      disabled={sending}
                      onClick={() => void recordFlashcardLexivaRating(5)}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-2 border-0 text-white disabled:opacity-50"
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        padding: 13,
                        borderRadius: 12,
                        background: "#1D9E75",
                      }}
                    >
                      <Check className="h-3 w-3 shrink-0 text-white" />
                      Oui !
                    </button>
                  </div>
                </>
              )}

            </div>
          ) : null}
        </div>
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

    const dicteeAnswerLabel =
      direction === "term_to_def"
        ? "Traduction en français"
        : "Mot dans la langue étudiée";

    const borderTertiary = "rgba(108, 63, 200, 0.14)";

    function validateDictee() {
      if (!current || sending || dicteePhase !== "typing") return;
      const ok = isDicteeAnswerCorrect(writeAnswer, answerText);
      playEvalFeedback(ok);
      if (ok) {
        setDicteePhase("correct_feedback");
      } else {
        setLastWrongAnswer(writeAnswer.trim());
        setDicteePhase("wrong_unrevealed");
      }
    }

    const wordCardColors =
      dicteePhase === "correct_feedback"
        ? {
            background: "#EAF4EF",
            borderColor: "#C3E6D6",
            wordColor: "#1D9E75",
          }
        : dicteePhase === "wrong_unrevealed" || dicteePhase === "revealed_fail"
          ? {
              background: "#FCEBEB",
              borderColor: "#F7C1C1",
              wordColor: "#E24B4A",
            }
          : {
              background: "#FFFFFF",
              borderColor: borderTertiary,
              wordColor: "var(--foreground)",
            };

    const dicteeShellStyle: React.CSSProperties = {
      background: "#F8F7FF",
      ...(isDicteeMobile
        ? {
            top: visualViewportLayout.offsetTop,
            height: "100dvh",
          }
        : {}),
    };

    const dicteeBlockAreaStyle: React.CSSProperties | undefined = isDicteeMobile
      ? { paddingBottom: visualViewportLayout.keyboardInset }
      : undefined;

    return (
      <div
        className="flex flex-col md:min-h-[50vh] md:overflow-visible max-md:fixed max-md:left-0 max-md:right-0 max-md:z-20 max-md:overflow-hidden"
        style={dicteeShellStyle}
      >
        <div
          aria-hidden="true"
          className="fixed inset-0 -z-10"
          style={{ background: "#F8F7FF" }}
        />
        <div className="mx-auto flex h-full w-full max-w-lg flex-col overflow-hidden max-md:pt-4 max-md:pl-4 max-md:pr-[max(80px,calc(16px+env(safe-area-inset-right,0px)))] md:h-auto md:overflow-visible md:px-0 md:pt-0 md:pb-0">
          {error ? (
            <p
              className="mb-3 shrink-0 rounded-xl px-3 py-2 text-sm text-red-700"
              style={{ background: "#FCEBEB" }}
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div
            className="flex shrink-0 items-center max-md:mb-4 md:mb-6"
            style={{ gap: 12 }}
          >
            <button
              type="button"
              onClick={() => {
                void saveSessionAndNavigateToEvaluation();
              }}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-transparent px-0 py-1 transition hover:opacity-80"
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--foreground-muted)",
              }}
            >
              <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Quitter
            </button>

            <div className="min-w-0 flex-1">
              <div
                className="overflow-hidden rounded-full"
                style={{
                  height: 4,
                  background: "rgba(108, 63, 200, 0.1)",
                }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${dicteeProgressPct}%`,
                    background: "#6C3FC8",
                    transition: "width 400ms ease",
                  }}
                />
              </div>
              <p
                className="mt-1.5 text-right"
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--foreground-muted)",
                }}
              >
                {dicteeSlotLabel}
              </p>
            </div>

            <div
              className="flex shrink-0 items-center gap-1 rounded-[10px] px-2.5 py-1.5"
              style={{
                background: "#EAF4EF",
                border: "0.5px solid #C3E6D6",
              }}
            >
              <Check
                className="h-3 w-3 shrink-0"
                stroke="#1D9E75"
                aria-hidden
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1D9E75" }}>
                {wordsRetained}
              </span>
              <span style={{ fontSize: 11, color: "#1D9E75" }}>bons</span>
            </div>
          </div>

          {current ? (
            <div
              className="flex min-h-0 flex-1 flex-col overflow-hidden max-md:justify-center md:justify-start"
              style={dicteeBlockAreaStyle}
            >
              <div className="flex shrink-0 flex-col gap-3 max-md:gap-2.5 max-md:pb-[max(56px,calc(48px+env(safe-area-inset-bottom,0px)))] md:gap-5">
                <div
                  className="relative shrink-0 overflow-hidden rounded-2xl md:rounded-[18px]"
                  style={{
                    background: wordCardColors.background,
                    borderWidth: 0.5,
                    borderStyle: "solid",
                    borderColor: wordCardColors.borderColor,
                    boxShadow:
                      dicteePhase === "correct_feedback" ||
                      dicteePhase === "wrong_unrevealed" ||
                      dicteePhase === "revealed_fail"
                        ? "none"
                        : "0 4px 20px rgba(108, 63, 200, 0.08)",
                  }}
                >
                  <div className="flex items-center gap-2.5 px-3.5 py-3 md:gap-3 md:px-5 md:py-6">
                    <p
                      className="min-w-0 flex-1 break-words text-center text-[clamp(18px,4.8vw,24px)] font-medium leading-snug md:text-[32px] md:leading-tight"
                      style={{ color: wordCardColors.wordColor }}
                    >
                      {displayText}
                    </p>
                    <div
                      className="flex w-[72px] shrink-0 items-center justify-end gap-1.5"
                      aria-label="Actions sur le mot"
                    >
                      <SpeakButton
                        text={displayText}
                        lang={displayLang}
                        variant="tile"
                      />
                      {renderMemoTipButton(12, "inline")}
                    </div>
                  </div>
                </div>

              {dicteePhase === "typing" && (
                <div className="shrink-0">
                  <label
                    className="mb-2 block text-center text-[13px] font-medium md:text-sm"
                    style={{ color: "var(--foreground-muted)" }}
                  >
                    {dicteeAnswerLabel}
                  </label>
                  <input
                    ref={dicteeInputRef}
                    type="text"
                    value={writeAnswer}
                    onChange={(e) => {
                      markDicteeInputEngaged();
                      setWriteAnswer(e.target.value);
                    }}
                    onFocus={handleDicteeInputFocus}
                    onBlur={handleDicteeInputBlur}
                    onPointerDown={markDicteeInputEngaged}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") validateDictee();
                    }}
                    disabled={sending}
                    enterKeyHint="done"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className="mb-3 w-full rounded-xl border border-[#DDD6F5] bg-white text-center outline-none transition-[border-color,box-shadow] focus:border-[#6C3FC8] focus:shadow-[0_0_0_3px_rgba(108,63,200,0.12)] max-md:py-3 max-md:text-lg md:mb-3.5 md:py-3.5 md:text-xl"
                    style={{
                      fontWeight: 500,
                      paddingLeft: 16,
                      paddingRight: 16,
                    }}
                  />
                  <div className="flex gap-2.5 md:gap-3">
                    <button
                      type="button"
                      disabled={sending}
                      onClick={() => {
                        playEvalFeedback(false);
                        setLastWrongAnswer(writeAnswer.trim());
                        setDicteePhase("revealed_fail");
                      }}
                      className="flex-1 rounded-xl border border-[#E2DAF2] bg-white text-[13px] font-medium transition hover:bg-[#FAFAFE] disabled:opacity-50 max-md:py-3 md:py-3.5"
                      style={{ color: "var(--foreground-muted)" }}
                    >
                      Je ne sais pas
                    </button>
                    <button
                      type="button"
                      disabled={sending || !writeAnswer.trim()}
                      onClick={validateDictee}
                      className="flex flex-[1.6] items-center justify-center gap-2 rounded-xl border-0 text-[13px] font-medium text-white transition hover:brightness-95 disabled:opacity-50 max-md:py-3 md:py-3.5"
                      style={{
                        background: "#6C3FC8",
                        boxShadow: "0 2px 10px rgba(108, 63, 200, 0.22)",
                      }}
                    >
                      <Check
                        className="h-3.5 w-3.5 shrink-0 text-white"
                        aria-hidden
                      />
                      Valider
                    </button>
                  </div>
                </div>
              )}

              {dicteePhase === "wrong_unrevealed" && (
                <>
                  <div
                    className="flex shrink-0 items-center gap-3"
                    style={{
                      background: "#FCEBEB",
                      borderRadius: 14,
                      padding: "14px 16px",
                      gap: 12,
                    }}
                  >
                    <div
                      className="flex shrink-0 items-center justify-center rounded-full"
                      style={{
                        width: 34,
                        height: 34,
                        background: "#E24B4A",
                      }}
                    >
                      <X className="h-4 w-4 text-white" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#A32D2D",
                        }}
                      >
                        Pas tout à fait…
                      </p>
                      <p
                        className="mt-0.5 line-through"
                        style={{ fontSize: 12, color: "#A32D2D" }}
                      >
                        {lastWrongAnswer || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={sending}
                      onClick={() => {
                        setDicteeHadRetry(true);
                        setWriteAnswer("");
                        setDicteePhase("typing");
                      }}
                      className="flex flex-1 items-center justify-center gap-2 bg-transparent"
                      style={{
                        border: "1.5px solid #E24B4A",
                        color: "#E24B4A",
                        borderRadius: 12,
                        padding: 11,
                        fontSize: 13,
                      }}
                    >
                      <RotateCcw className="h-3 w-3 shrink-0 stroke-[#E24B4A]" />
                      Réessayer
                    </button>
                    <button
                      type="button"
                      disabled={sending}
                      onClick={() => setDicteePhase("revealed_fail")}
                      className="flex-1 border-0 text-white"
                      style={{
                        background: "#E24B4A",
                        borderRadius: 12,
                        padding: 11,
                        fontSize: 13,
                      }}
                    >
                      Voir la réponse
                    </button>
                  </div>
                </>
              )}

              {dicteePhase === "revealed_fail" && (
                <>
                  <div
                    className="flex shrink-0 items-center gap-3"
                    style={{
                      background: "#FCEBEB",
                      borderRadius: 14,
                      padding: "14px 16px",
                      gap: 12,
                    }}
                  >
                    <div
                      className="flex shrink-0 items-center justify-center rounded-full"
                      style={{
                        width: 34,
                        height: 34,
                        background: "#E24B4A",
                      }}
                    >
                      <X className="h-4 w-4 text-white" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#A32D2D",
                        }}
                      >
                        La bonne réponse
                      </p>
                      <p
                        className="mt-0.5"
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: "#791F1F",
                        }}
                      >
                        {answerText || "—"}
                      </p>
                      <p
                        className="mt-1 line-through"
                        style={{ fontSize: 12, color: "#A32D2D" }}
                      >
                        {lastWrongAnswer || "—"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() => void recordDicteeCompletion(0)}
                    className="flex w-full shrink-0 items-center justify-center gap-2 border-0 text-white"
                    style={{
                      background: "#E24B4A",
                      borderRadius: 12,
                      padding: 13,
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    Continuer
                    <ArrowRight
                      className="h-3.5 w-3.5 shrink-0 text-white"
                      aria-hidden
                    />
                  </button>
                </>
              )}

              {dicteePhase === "correct_feedback" && (
                <>
                  <div
                    className="flex shrink-0 items-center gap-3"
                    style={{
                      background: "#EAF4EF",
                      borderRadius: 14,
                      padding: "14px 16px",
                      gap: 12,
                    }}
                  >
                    <div
                      className="flex shrink-0 items-center justify-center rounded-full"
                      style={{
                        width: 34,
                        height: 34,
                        background: "#1D9E75",
                      }}
                    >
                      <Check className="h-4 w-4 text-white" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#1A6645",
                        }}
                      >
                        Bonne réponse !
                      </p>
                      <p
                        className="mt-0.5"
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: "#27500A",
                        }}
                      >
                        {answerText || "—"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() =>
                      void recordDicteeCompletion(dicteeHadRetry ? 2 : 3)
                    }
                    className="flex w-full shrink-0 items-center justify-center gap-2 border-0 text-white"
                    style={{
                      background: "#1D9E75",
                      borderRadius: 12,
                      padding: 13,
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    Mot suivant
                    <ArrowRight
                      className="h-3.5 w-3.5 shrink-0 text-white"
                      aria-hidden
                    />
                  </button>
                </>
              )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
}
