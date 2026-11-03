"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bug,
  CircleHelp,
  Info,
  Lightbulb,
  MessageCircle,
  X,
  type LucideIcon,
} from "lucide-react";
import { collectFeedbackClientContext } from "@/lib/feedback-context";
import {
  FEEDBACK_DESCRIPTION_MAX,
  type FeedbackFormType,
  isFeedbackFormValid,
} from "@/lib/feedback-form";

const TYPE_OPTIONS: {
  value: FeedbackFormType;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: "bug", label: "Bug", icon: Bug },
  { value: "idee", label: "Idée", icon: Lightbulb },
  { value: "question", label: "Question", icon: CircleHelp },
];

export function FeedbackWidget() {
  const pathname = usePathname();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackFormType | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const canSubmit =
    isFeedbackFormValid({ type, description }) && !loading && !sent;

  const closePanel = useCallback(() => {
    setOpen(false);
    setDescription("");
    setType(null);
    setSent(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    function getFocusables(): HTMLElement[] {
      if (!panel) return [];
      return Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
    }

    const focusTimer = window.setTimeout(() => {
      getFocusables()[0]?.focus();
    }, 0);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closePanel();
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = getFocusables();
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [open, closePanel]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || type === null) return;

    const desc = description.trim();
    const context = collectFeedbackClientContext(pathname);

    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          description: desc,
          page: context.page,
          device: context.device,
          browser: context.browser,
        }),
      });
      if (res.ok) {
        setSent(true);
        setDescription("");
        window.setTimeout(() => {
          closePanel();
        }, 1800);
      }
    } finally {
      setLoading(false);
    }
  }

  const panelBody = (
    <div
      ref={panelRef}
      className="relative flex max-h-[min(88dvh,100%)] flex-col overflow-hidden rounded-[24px] border border-line bg-surface shadow-2xl md:max-h-none md:w-[min(100vw-3rem,22rem)]"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <h2 id={titleId} className="m-0 font-heading text-lg font-bold text-ink">
          Un problème ou une idée ?
        </h2>
        <button
          type="button"
          onClick={closePanel}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink outline-none hover:border-ink focus-visible:ring-2 focus-visible:ring-ink"
          aria-label="Fermer"
        >
          <X size={18} aria-hidden />
        </button>
      </div>

      <div className="overflow-y-auto overscroll-contain px-5 py-4">
        {sent ? (
          <p className="py-10 text-center text-sm text-ink" role="status">
            Merci, votre message est bien envoyé.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <fieldset className="m-0 border-0 p-0">
              <legend className="mb-2 block text-xs font-medium text-muted">Type</legend>
              <div className="flex flex-wrap gap-2">
                {TYPE_OPTIONS.map((option) => {
                  const selected = type === option.value;
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setType(option.value)}
                      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                        selected
                          ? "border-ink bg-mark text-ink"
                          : "border-ink bg-surface text-ink hover:bg-page"
                      }`}
                    >
                      <Icon size={16} aria-hidden />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label htmlFor="feedback-desc" className="mb-2 block text-xs font-medium text-muted">
                Description <span className="text-ink">*</span>
              </label>
              <textarea
                id="feedback-desc"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value.slice(0, FEEDBACK_DESCRIPTION_MAX))
                }
                required
                rows={5}
                placeholder="Décrivez votre retour…"
                className="w-full resize-none rounded-[14px] border border-line bg-surface px-3 py-3 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/20"
              />
            </div>

            <div className="flex gap-2 rounded-[14px] border border-line bg-page px-3 py-3 text-xs leading-relaxed text-muted">
              <Info size={16} className="mt-0.5 shrink-0 text-ink" aria-hidden />
              <p className="m-0">
                Nous joignons automatiquement la page où vous vous trouvez, votre appareil et
                votre navigateur, pour mieux vous aider. Aucune autre donnée n&apos;est envoyée.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={closePanel}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-ink bg-surface px-4 text-sm font-medium text-ink outline-none hover:bg-page focus-visible:ring-2 focus-visible:ring-ink"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-ink px-4 text-sm font-medium text-surface outline-none focus-visible:ring-2 focus-visible:ring-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Envoi…" : "Envoyer"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[92px] right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition hover:scale-105 md:bottom-6"
        style={{ backgroundColor: "var(--ink)", color: "var(--surface)" }}
        aria-label="Donner un retour"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <MessageCircle size={22} aria-hidden />
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            aria-hidden
            onClick={closePanel}
          />
          <div
            className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-0 pb-[max(5.75rem,env(safe-area-inset-bottom))] pt-2 md:inset-auto md:bottom-20 md:right-6 md:block md:px-0 md:pb-0 md:pt-0"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className="w-full animate-[feedback-slide-up_0.2s_ease-out] md:w-auto">
              {panelBody}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
