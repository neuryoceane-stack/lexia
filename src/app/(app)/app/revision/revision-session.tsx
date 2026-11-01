"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Volume2, X } from "lucide-react";
import {
  KeyCap,
  LanguagePill,
  SessionTopBar,
  languageName,
  languageShort,
} from "./revision-ui";

type Direction = "term_to_def" | "def_to_term";
type DicteePhase = "typing" | "wrong_unrevealed" | "revealed_fail" | "correct_feedback";

function isCoarsePointer(): boolean {
  return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}

function isDesktopViewport(): boolean {
  return window.matchMedia("(min-width: 1024px)").matches;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

export function FlashcardSession({
  onQuit,
  progressPct,
  slotLabel,
  goodCount,
  termLang,
  defLang,
  direction,
  onDirection,
  displayText,
  answerText,
  displayLang,
  answerLang,
  revealed,
  onReveal,
  sending,
  onRate,
  onSpeak,
  memo,
  error,
}: {
  onQuit: () => void;
  progressPct: number;
  slotLabel: string;
  goodCount: number;
  termLang: string;
  defLang: string;
  direction: Direction;
  onDirection: (next: Direction) => void;
  displayText: string;
  answerText: string;
  displayLang: string;
  answerLang: string;
  revealed: boolean;
  onReveal: () => void;
  sending: boolean;
  onRate: (rating: 1 | 5) => void | Promise<void>;
  onSpeak: (text: string, lang: string) => void;
  memo: React.ReactNode;
  error: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const originRef = useRef<{ x: number; t: number } | null>(null);
  const suppressClick = useRef(false);
  const swipeLock = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const wordKey = `${direction}\n${displayText}\n${answerText}`;
  const seenWord = useRef(wordKey);
  if (seenWord.current !== wordKey) {
    seenWord.current = wordKey;
    originRef.current = null;
    swipeLock.current = false;
    if (dragX !== 0) setDragX(0);
    if (dragging) setDragging(false);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.repeat) return;
      if (!isDesktopViewport() || isCoarsePointer()) return;
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target instanceof HTMLElement ? e.target : null;
      if (e.key === " " || e.code === "Space") {
        if (el?.closest("button, a, textarea, input")) return;
        if (!revealed && !sending) {
          e.preventDefault();
          onReveal();
        }
        return;
      }
      if (!revealed || sending) return;
      if (el?.closest("textarea, input")) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onRate(1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onRate(5);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, sending, onReveal, onRate]);

  async function commitSwipe(dir: "left" | "right") {
    if (swipeLock.current || sending) return;
    swipeLock.current = true;
    setDragging(false);
    setDragX(dir === "right" ? 720 : -720);
    try {
      await onRate(dir === "right" ? 5 : 1);
    } finally {
      swipeLock.current = false;
      setDragX(0);
    }
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (isDesktopViewport() || !revealed || sending || swipeLock.current) return;
    const target = e.target;
    if (target instanceof HTMLElement && target.closest("[data-card-action]")) return;
    e.preventDefault();
    originRef.current = { x: e.clientX, t: performance.now() };
    suppressClick.current = false;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const origin = originRef.current;
    if (!origin) return;
    const dx = e.clientX - origin.x;
    if (Math.abs(dx) > 8) suppressClick.current = true;
    setDragX(dx);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const origin = originRef.current;
    originRef.current = null;
    setDragging(false);
    if (!origin || !revealed) {
      setDragX(0);
      return;
    }
    const dx = e.clientX - origin.x;
    const dt = Math.max(16, performance.now() - origin.t);
    const velocity = dx / dt;
    const fast = Math.abs(velocity) >= 0.65 && Math.abs(dx) >= 36;
    const far = Math.abs(dx) > 100;
    if ((far || fast) && dx !== 0) {
      void commitSwipe(dx > 0 ? "right" : "left");
      return;
    }
    setDragX(0);
  }

  const rotate = reducedMotion ? 0 : Math.max(-10, Math.min(10, dragX / 18));
  const stamp = Math.min(1, Math.abs(dragX) / 90);
  const promptName = languageName(displayLang);
  const answerName = languageName(answerLang);
  const answersDisabled = !revealed || sending;
  const releaseHint = dragging && Math.abs(dragX) > 100;

  const termToDef = `${languageName(termLang)} → ${languageName(defLang)}`;
  const defToTerm = `${languageName(defLang)} → ${languageName(termLang)}`;
  const termToDefShort = `${languageShort(termLang)} → ${languageShort(defLang)}`;
  const defToTermShort = `${languageShort(defLang)} → ${languageShort(termLang)}`;

  return (
    <div className="mx-auto w-full max-w-[800px]">
      {error ? (
        <p className="mb-3 rounded-xl bg-false-bg px-3 py-2 text-sm text-false-text" role="alert">
          {error}
        </p>
      ) : null}
      <SessionTopBar
        onQuit={onQuit}
        progressPct={progressPct}
        slotLabel={slotLabel}
        goodCount={goodCount}
      />

      {/* Mixte n'existe pas (seulement term_to_def et def_to_term) : l'option n'est pas affichée. */}
      <div className="mb-4 flex flex-col gap-2 lg:mb-5 lg:flex-row lg:items-center lg:justify-between">
        <p className="hidden text-sm text-muted lg:block">Sens de révision</p>
        <div className="flex gap-2">
          <DirectionButton
            active={direction === "term_to_def"}
            onClick={() => onDirection("term_to_def")}
            short={termToDefShort}
            long={termToDef}
          />
          <DirectionButton
            active={direction === "def_to_term"}
            onClick={() => onDirection("def_to_term")}
            short={defToTermShort}
            long={defToTerm}
          />
        </div>
      </div>

      <div className="relative pb-3 lg:pb-0">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-5 top-4 h-[calc(100%-10px)] rounded-[28px] border-[1.5px] border-line bg-surface lg:hidden"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-2.5 top-2 h-[calc(100%-6px)] rounded-[28px] border-[1.5px] border-line bg-surface lg:hidden"
        />

        <div
          ref={cardRef}
          className={`relative min-h-[300px] select-none rounded-[28px] border-[1.5px] border-ink bg-surface lg:min-h-[420px] ${
            revealed ? "revision-card-swipe" : ""
          }`}
          style={{
            transform: `translateX(${dragX}px) rotate(${rotate}deg)`,
            transition: dragging || reducedMotion ? "none" : "transform 200ms ease",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <button
            type="button"
            aria-keyshortcuts="Space"
            aria-label="Touche la carte ou appuie sur Espace pour la retourner"
            tabIndex={revealed ? -1 : 0}
            onClick={(e) => {
              e.stopPropagation();
              if (suppressClick.current) {
                suppressClick.current = false;
                return;
              }
              if (!revealed && !sending) onReveal();
            }}
            className="absolute inset-0 z-0 rounded-[28px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            style={{ pointerEvents: revealed ? "none" : "auto" }}
          />

          <div className="pointer-events-none absolute left-4 top-4 z-20 lg:left-6 lg:top-6">
            <LanguagePill code={languageShort(displayLang)} />
          </div>
          <div className="absolute right-4 top-4 z-20 flex items-center gap-2 lg:right-6 lg:top-6">
            <button
              type="button"
              data-card-action
              aria-label={revealed ? "Écouter la traduction" : "Écouter le mot affiché"}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                if (revealed) onSpeak(answerText, answerLang);
                else onSpeak(displayText, displayLang);
              }}
              className="flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-ink bg-surface text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              <Volume2 size={20} aria-hidden />
            </button>
            <div data-card-action onPointerDown={(e) => e.stopPropagation()}>
              {memo}
            </div>
          </div>

          <div className="pointer-events-none relative z-10 flex min-h-[300px] flex-col items-center justify-center px-5 pb-6 pt-14 text-center lg:min-h-[420px] lg:px-6 lg:pb-10 lg:pt-20">
            <p className="text-sm text-muted">{promptName}</p>
            <p className="mt-3 max-w-full text-balance break-words font-heading text-[clamp(32px,8vw,72px)] leading-[1.05] text-ink lg:text-[72px]">
              {displayText}
            </p>
            {revealed ? (
              <>
                <div className="my-5 h-px w-14 bg-line" />
                <p className="text-sm text-muted">{answerName}</p>
                <p className="marker mt-3 max-w-full break-words font-heading text-[clamp(28px,6vw,44px)] leading-tight lg:text-[44px]">
                  {answerText || "—"}
                </p>
              </>
            ) : (
              <p className="mt-8 px-6 text-[15px] leading-relaxed text-muted">
                <span className="lg:hidden">Touche la carte pour la retourner</span>
                <span className="hidden lg:inline">
                  Touche la carte ou appuie sur <KeyCap>Espace</KeyCap> pour la retourner
                </span>
              </p>
            )}
          </div>

        </div>

          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-16 z-20 rounded-lg border-[3px] border-ink bg-surface px-3 py-1.5 font-heading text-2xl tracking-wide text-ink lg:hidden"
            style={{
              opacity: dragX < 0 ? stamp : 0,
              transform: "rotate(-8deg)",
            }}
          >
            À REVOIR
          </span>
          <span
            aria-hidden
            className="pointer-events-none absolute right-3 top-16 z-20 rounded-lg border-[3px] border-ink bg-mark px-3 py-1.5 font-heading text-2xl tracking-wide text-ink lg:hidden"
            style={{
              opacity: dragX > 0 ? stamp : 0,
              transform: "rotate(8deg)",
            }}
          >
            JE SAVAIS
          </span>
      </div>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-y-0 right-0 z-10 w-28 lg:hidden"
        style={{
          background: "linear-gradient(to left, var(--mark), transparent)",
          opacity: dragX > 0 ? Math.min(0.95, dragX / 80) : 0,
        }}
      />

      <div className="mt-8 hidden gap-4 lg:flex">
        <AnswerButton
          kind="miss"
          disabled={answersDisabled}
          onClick={() => onRate(1)}
          shortcut="ArrowLeft"
          keyLabel={<ArrowLeft size={14} strokeWidth={2.5} aria-hidden />}
        >
          Je ne savais pas
        </AnswerButton>
        <AnswerButton
          kind="know"
          disabled={answersDisabled}
          onClick={() => onRate(5)}
          shortcut="ArrowRight"
          keyLabel={<ArrowRight size={14} strokeWidth={2.5} aria-hidden />}
          wide
        >
          Je savais
        </AnswerButton>
      </div>

      <div className="mb-2 mt-6 pr-14 lg:hidden">
        <div className="flex items-start justify-center gap-14">
          <RoundRate
            label="Je ne savais pas"
            shortcut="ArrowLeft"
            disabled={answersDisabled}
            onClick={() => onRate(1)}
            tone="miss"
          />
          <RoundRate
            label="Je savais"
            shortcut="ArrowRight"
            disabled={answersDisabled}
            onClick={() => onRate(5)}
            tone="know"
          />
        </div>
        <p className="mt-4 text-center text-sm text-muted">
          {!revealed
            ? "Retourne la carte, puis glisse-la"
            : releaseHint
              ? "Relâche pour valider"
              : "glisse à gauche si tu ne savais pas · à droite si tu savais"}
        </p>
      </div>
    </div>
  );
}

function DirectionButton({
  active,
  onClick,
  short,
  long,
}: {
  active: boolean;
  onClick: () => void;
  short: string;
  long: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="h-11 min-w-0 flex-1 rounded-full px-3 text-sm font-medium text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink lg:flex-none lg:px-4"
      style={{
        background: active ? "var(--mark)" : "var(--surface)",
        border: active ? "1.5px solid transparent" : "1.5px solid var(--line)",
      }}
    >
      <span className="lg:hidden">{short}</span>
      <span className="hidden whitespace-nowrap lg:inline">{long}</span>
    </button>
  );
}

function AnswerButton({
  kind,
  disabled,
  onClick,
  shortcut,
  keyLabel,
  wide,
  children,
}: {
  kind: "miss" | "know";
  disabled: boolean;
  onClick: () => void;
  shortcut: string;
  keyLabel: React.ReactNode;
  wide?: boolean;
  children: string;
}) {
  const enabledMiss = kind === "miss" && !disabled;
  const enabledKnow = kind === "know" && !disabled;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-keyshortcuts={shortcut}
      className={`inline-flex h-16 items-center justify-center gap-3 rounded-full px-6 text-base font-medium outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-not-allowed ${
        wide ? "flex-[1.35]" : "flex-1"
      }`}
      style={{
        background: enabledKnow
          ? "var(--ink)"
          : disabled
            ? "color-mix(in srgb, var(--muted) 22%, var(--page))"
            : "var(--surface)",
        color: enabledKnow ? "var(--surface)" : disabled ? "var(--muted)" : "var(--ink)",
        border: enabledMiss ? "1.5px solid var(--ink)" : "1.5px solid transparent",
      }}
    >
      {children}
      <KeyCap>{keyLabel}</KeyCap>
    </button>
  );
}

function RoundRate({
  label,
  shortcut,
  disabled,
  onClick,
  tone,
}: {
  label: string;
  shortcut: string;
  disabled: boolean;
  onClick: () => void;
  tone: "miss" | "know";
}) {
  const know = tone === "know";
  return (
    <div className="flex w-28 flex-col items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        aria-keyshortcuts={shortcut}
        aria-label={label}
        className="flex h-16 w-16 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-not-allowed"
        style={{
          background: disabled
            ? know
              ? "color-mix(in srgb, var(--muted) 42%, var(--page))"
              : "color-mix(in srgb, var(--line) 75%, var(--page))"
            : know
              ? "var(--ink)"
              : "var(--surface)",
          color: disabled ? "var(--muted)" : know ? "var(--surface)" : "var(--ink)",
          border: !disabled && !know ? "1.5px solid var(--ink)" : "1.5px solid transparent",
        }}
      >
        {know ? <Check size={28} aria-hidden /> : <X size={28} aria-hidden />}
      </button>
      <span className="text-center text-sm text-ink">{label}</span>
    </div>
  );
}

export function DicteeSession({
  onQuit,
  progressPct,
  slotLabel,
  goodCount,
  displayText,
  answerText,
  displayLang,
  phase,
  writeAnswer,
  onWriteAnswer,
  onValidate,
  onNext,
  sending,
  onSpeak,
  memo,
  error,
  inputRef,
}: {
  onQuit: () => void;
  progressPct: number;
  slotLabel: string;
  goodCount: number;
  displayText: string;
  answerText: string;
  displayLang: string;
  phase: DicteePhase;
  writeAnswer: string;
  onWriteAnswer: (value: string) => void;
  onValidate: () => void;
  onNext: () => void;
  sending: boolean;
  onSpeak: () => void;
  memo: React.ReactNode;
  error: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const feedback =
    phase === "correct_feedback" ||
    phase === "revealed_fail" ||
    phase === "wrong_unrevealed";
  const correct = phase === "correct_feedback";
  const wrong = phase === "revealed_fail" || phase === "wrong_unrevealed";

  useEffect(() => {
    if (feedback) inputRef.current?.blur();
  }, [feedback, inputRef]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.repeat) return;
      if (!isDesktopViewport() || isCoarsePointer()) return;
      if (e.key !== "Enter") return;
      if (isTypingTarget(e.target)) return;
      const el = e.target instanceof HTMLElement ? e.target : null;
      if (el?.closest("button, a")) return;
      if (!feedback || sending) return;
      e.preventDefault();
      onNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [feedback, sending, onNext]);

  return (
    <div className="mx-auto w-full max-w-[800px]">
      {error ? (
        <p className="mb-3 rounded-xl bg-false-bg px-3 py-2 text-sm text-false-text" role="alert">
          {error}
        </p>
      ) : null}
      <SessionTopBar
        onQuit={onQuit}
        progressPct={progressPct}
        slotLabel={slotLabel}
        goodCount={goodCount}
      />

      <div className="rounded-[28px] border-[1.5px] border-ink bg-surface px-5 pb-10 pt-5 lg:px-8 lg:pb-12 lg:pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <LanguagePill code={languageShort(displayLang)} />
            <span className="text-sm text-muted">Dictée · écris la traduction</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              data-card-action
              aria-label="Écouter la prononciation"
              onClick={onSpeak}
              className="flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-ink bg-surface text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              <Volume2 size={20} aria-hidden />
            </button>
            {memo}
          </div>
        </div>
        <p className="mt-8 break-words text-center font-heading text-[clamp(36px,8vw,64px)] leading-[1.05] text-ink">
          {displayText}
        </p>
      </div>

      <label htmlFor="dictee-reponse" className="mt-5 block text-sm text-muted">
        Ta réponse
      </label>
      <input
        id="dictee-reponse"
        ref={inputRef}
        type="text"
        value={writeAnswer}
        readOnly={phase !== "typing"}
        disabled={sending && phase === "typing"}
        aria-invalid={wrong}
        onChange={(e) => onWriteAnswer(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          e.stopPropagation();
          if (phase === "typing") onValidate();
          else if (feedback) onNext();
        }}
        enterKeyHint={feedback ? "next" : "done"}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className={`mt-2 h-[72px] w-full rounded-2xl border-[1.5px] px-5 text-left text-lg text-ink outline-none ${
          correct ? "revision-answer-just" : wrong ? "revision-answer-false" : "border-line bg-surface"
        } ${feedback ? "" : "focus-visible:ring-2 focus-visible:ring-ink"}`}
      />

      {correct ? (
        <p className="mt-3 flex items-center gap-2 text-base font-medium text-just-text">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-just-sign text-surface">
            <Check size={14} aria-hidden />
          </span>
          Bonne réponse
        </p>
      ) : null}

      {wrong ? (
        <>
          <p className="mt-3 flex items-center gap-2 text-base font-medium text-false-text">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-false-sign text-surface">
              <X size={14} aria-hidden />
            </span>
            Pas tout à fait
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border-[1.5px] border-line bg-surface px-4 py-3">
            <span className="text-sm text-muted">La bonne réponse</span>
            <span className="marker font-heading text-[28px] leading-tight text-ink">
              {answerText || "—"}
            </span>
          </div>
        </>
      ) : null}

      {feedback ? (
        <button
          type="button"
          disabled={sending}
          onClick={onNext}
          aria-keyshortcuts="Enter"
          className="mt-4 inline-flex h-14 w-full items-center justify-center gap-3 rounded-full bg-ink text-base font-medium text-surface outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ink disabled:opacity-50 lg:h-16"
        >
          Mot suivant
          <ArrowRight size={18} aria-hidden />
          <KeyCap>Entrée</KeyCap>
        </button>
      ) : (
        <button
          type="button"
          disabled={sending || !writeAnswer.trim()}
          onClick={onValidate}
          className="mt-4 inline-flex h-14 w-full items-center justify-center rounded-full bg-ink text-base font-medium text-surface outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ink disabled:opacity-50 lg:h-16"
        >
          Valider
        </button>
      )}
    </div>
  );
}
