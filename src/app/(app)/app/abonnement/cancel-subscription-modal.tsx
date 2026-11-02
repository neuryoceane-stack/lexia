"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import {
  CANCELLATION_MODAL_LABELS,
  CANCELLATION_REASONS,
  type CancellationReason,
} from "@/lib/cancellation";
import { cancelSubscription } from "@/lib/subscription-client";
import { formatPeriodEnd, type SubscriptionView } from "@/lib/subscription";

type Props = {
  open: boolean;
  trial: boolean;
  pastDue: boolean;
  periodEnd: number | null;
  onClose: () => void;
  onConfirmed: (view: SubscriptionView) => void;
};

export function CancelSubscriptionModal({
  open,
  trial,
  pastDue,
  periodEnd,
  onClose,
  onConfirmed,
}: Props) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [reason, setReason] = useState<CancellationReason | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      setReason(null);
      setComment("");
      setError(null);
      setPending(false);
      return;
    }
    dialogRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose, pending]);

  if (!open) return null;

  const date = periodEnd != null ? formatPeriodEnd(periodEnd) : null;
  const intro = trial
    ? date
      ? `Votre essai se termine le ${date}.`
      : "Votre essai se termine à la fin de la période en cours."
    : pastDue
      ? date
        ? `Votre abonnement sera résilié à la fin de la période en cours, le ${date}.`
        : "Votre abonnement sera résilié à la fin de la période en cours."
      : date
        ? `Votre abonnement reste actif jusqu'au ${date}.`
        : "Votre abonnement reste actif jusqu'à la fin de la période en cours.";

  async function confirm(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const next = await cancelSubscription({
        reason,
        comment: comment.trim() ? comment.trim() : null,
      });
      if (!next.cancelAtPeriodEnd && next.status !== "canceled") {
        throw new Error("La résiliation n'a pas été confirmée. Vous pouvez réessayer.");
      }
      onConfirmed(next);
    } catch (cause) {
      setPending(false);
      setError(cause instanceof Error ? cause.message : "Impossible de résilier l'abonnement.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[color-mix(in_srgb,var(--ink)_40%,transparent)]"
      onClick={pending ? undefined : onClose}
    >
      <div className="flex min-h-[100dvh] items-end justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
          className="my-auto w-full max-w-[440px] rounded-[20px] border border-line bg-surface p-5 shadow-[var(--shadow-elevated)] outline-none sm:p-6"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <h2 id={titleId} className="m-0 max-w-[18rem] text-[26px] leading-[1.15] text-ink">
              Avant de partir, dites-nous pourquoi
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              aria-label="Fermer"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-ink outline-none hover:bg-page focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-40"
            >
              <X size={18} aria-hidden />
            </button>
          </div>

          <p id={descriptionId} className="m-0 mt-3 text-sm leading-relaxed text-muted">
            {intro} Votre réponse nous aide à améliorer l&apos;application.
          </p>

          <form className="mt-4" onSubmit={(event) => void confirm(event)}>
            <fieldset className="m-0 grid gap-2 border-0 p-0">
              <legend className="sr-only">Motif de résiliation, facultatif</legend>
              {CANCELLATION_REASONS.map((value) => {
                const selected = reason === value;
                return (
                  <label
                    key={value}
                    className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm text-ink outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink ${
                      selected ? "border-ink bg-mark" : "border-line bg-surface"
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancellation-reason"
                      value={value}
                      checked={selected}
                      onChange={() => setReason(value)}
                      className="sr-only"
                    />
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        selected ? "border-ink" : "border-muted"
                      }`}
                      aria-hidden
                    >
                      {selected ? <span className="h-2.5 w-2.5 rounded-full bg-ink" /> : null}
                    </span>
                    <span>{CANCELLATION_MODAL_LABELS[value]}</span>
                  </label>
                );
              })}
            </fieldset>

            <label className="mt-4 block text-sm text-ink" htmlFor="cancellation-comment">
              Un mot pour nous ? (facultatif)
            </label>
            <textarea
              id="cancellation-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={1000}
              rows={3}
              className="mt-2 min-h-[88px] w-full resize-y rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink"
            />

            {error ? (
              <p role="alert" className="m-0 mt-3 flex items-start gap-2 text-sm font-medium text-false-text">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" stroke="var(--false-sign)" aria-hidden />
                <span>{error}</span>
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="mt-4 flex min-h-11 w-full items-center justify-center rounded-full bg-ink px-4 text-sm font-medium text-surface outline-none hover:bg-ink-hover focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
            >
              {pending ? "Résiliation…" : "Confirmer la résiliation"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="mt-2 flex min-h-11 w-full items-center justify-center rounded-full border-[1.5px] border-ink bg-surface px-4 text-sm font-medium text-ink outline-none hover:bg-page focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:opacity-40"
            >
              Garder mon abonnement
            </button>
            <p className="m-0 mt-3 text-center text-xs leading-relaxed text-muted">
              Vous pourrez vous réabonner quand vous le souhaitez.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
