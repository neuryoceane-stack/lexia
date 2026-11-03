"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CircleAlert, X } from "lucide-react";
import {
  parseStudentSheet,
  type StudentSheet,
  type StudentStatusKey,
} from "@/lib/creator-students";

const STATUS_CLASS: Record<StudentStatusKey, string> = {
  trialing: "bg-mark text-ink",
  active: "border-[1.5px] border-ink bg-surface text-ink",
  past_due: "bg-false-bg text-false-text",
  canceled: "border border-line bg-surface text-ink",
  trial_ended: "border border-line bg-surface text-muted",
  inactive: "border border-line bg-surface text-muted",
};

export function StatusPill({ status, label }: { status: StudentStatusKey; label: string }) {
  return (
    <span className={`inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full px-3 text-sm font-medium ${STATUS_CLASS[status]}`}>
      {status === "past_due" ? <CircleAlert size={14} aria-hidden /> : null}
      <span className="truncate">{label}</span>
    </span>
  );
}

export function StudentSheetPanel({
  studentId,
  onClose,
}: {
  studentId: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [sheet, setSheet] = useState<StudentSheet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setSheet(null);
    void (async () => {
      try {
        const response = await fetch(`/api/creator/students/${encodeURIComponent(studentId)}`, {
          signal: controller.signal,
        });
        const body: unknown = await response.json().catch(() => null);
        if (controller.signal.aborted) return;
        if (response.status === 404) {
          setError("Cet élève est introuvable.");
          return;
        }
        if (!response.ok) {
          setError("Impossible de charger la fiche.");
          return;
        }
        const parsed = parseStudentSheet(body);
        if (!parsed) {
          setError("Impossible de charger la fiche.");
          return;
        }
        setSheet(parsed);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Impossible de charger la fiche.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [studentId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const nodes = [...panel.querySelectorAll<HTMLElement>("button, a, input, [href], [tabindex]")].filter(
        (node) => !node.hasAttribute("disabled") && node.tabIndex !== -1,
      );
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const title = sheet?.name ?? sheet?.email ?? "Fiche élève";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        aria-label="Fermer la fiche"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-full w-full max-w-[440px] flex-col overflow-y-auto bg-surface shadow-[var(--shadow-elevated)]"
      >
        <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-5">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink font-heading text-lg text-surface"
              aria-hidden
            >
              {sheet?.initial ?? "·"}
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="truncate text-[22px] leading-tight text-ink">
                {loading && !sheet ? "Chargement…" : title}
              </h2>
              {sheet?.name ? <p className="m-0 truncate text-sm text-muted">{sheet.email}</p> : null}
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink outline-none hover:bg-page focus-visible:ring-2 focus-visible:ring-ink"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="px-5 pb-8">
          {error ? (
            <p className="m-0 mt-4 rounded-[14px] border border-false-sign bg-false-bg px-4 py-3 text-sm font-medium text-false-text" role="alert">
              {error}
            </p>
          ) : null}
          {loading && !sheet ? <p className="m-0 mt-6 text-sm text-muted">Chargement de la fiche…</p> : null}
          {sheet ? (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusPill status={sheet.status} label={sheet.statusDetail ?? sheet.statusLabel} />
                {sheet.promoCodesAvailable && sheet.promoCode ? (
                  <span className="inline-flex min-h-8 items-center rounded-full border border-line bg-surface px-3 text-sm text-ink">
                    Code {sheet.promoCode}
                  </span>
                ) : null}
                {!sheet.promoCodesAvailable ? (
                  <span className="inline-flex min-h-8 items-center rounded-full border border-line px-3 text-sm text-muted">
                    Code non disponible
                  </span>
                ) : null}
              </div>
              {sheet.status === "trialing" && !sheet.statusDetail ? (
                <p className="m-0 mt-3 text-sm text-muted">Durée restante : non disponible.</p>
              ) : null}
              <dl className="mt-4 divide-y divide-line border-t border-line">
                {sheet.fields.map((field) => (
                  <div key={field.label} className="flex items-baseline justify-between gap-4 py-3.5">
                    <dt className="text-sm text-muted">{field.label}</dt>
                    <dd className="m-0 text-right text-sm font-medium text-ink">{field.value}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
