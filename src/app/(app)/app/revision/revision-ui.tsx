"use client";

import { Check, X } from "lucide-react";
import { PREFERRED_LANGUAGE_OPTIONS } from "@/lib/language";

/** Nom affiché d’une langue de liste (Français, Italien…). */
export function languageName(code: string): string {
  const n = (code || "").trim().toLowerCase();
  if (!n) return "—";
  return PREFERRED_LANGUAGE_OPTIONS.find((o) => o.value === n)?.label ?? n.toUpperCase();
}

/** Code court pour la pastille et les boutons de téléphone (ITA, FRA). */
export function languageShort(code: string): string {
  const n = (code || "").trim().toLowerCase();
  if (!n) return "—";
  return (n.length >= 3 ? n.slice(0, 3) : n).toUpperCase();
}

/** 0 et 1 : « bon ». À partir de 2 : « bons ». */
export function bonsLabel(count: number): string {
  return `${count} ${count > 1 ? "bons" : "bon"}`;
}

export function KeyCap({ children }: { children: React.ReactNode }) {
  return <kbd className="revision-kbd">{children}</kbd>;
}

export function LanguagePill({ code }: { code: string }) {
  return (
    <span className="inline-flex h-7 items-center rounded-lg border-[1.5px] border-ink bg-surface px-2 text-[11px] font-medium tracking-wide text-ink">
      {code}
    </span>
  );
}

export function SessionTopBar({
  onQuit,
  progressPct,
  slotLabel,
  goodCount,
}: {
  onQuit: () => void;
  progressPct: number;
  slotLabel: string;
  goodCount: number;
}) {
  const pct = Math.max(0, Math.min(100, progressPct));
  return (
    <div className="mb-5 flex items-center gap-3 lg:mb-6 lg:gap-4">
      <button
        type="button"
        onClick={onQuit}
        className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-surface px-3.5 text-sm font-medium text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
      >
        <X size={16} strokeWidth={2.25} aria-hidden />
        Quitter
      </button>
      <div className="min-w-0 flex-1">
        <div
          className="h-2.5 overflow-hidden rounded-full border-[1.5px] border-ink bg-surface"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          aria-label={slotLabel}
        >
          <div className="h-full rounded-full bg-mark" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-right text-xs text-muted">{slotLabel}</p>
      </div>
      <span className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-surface px-3 text-sm font-medium text-ink">
        <Check size={16} strokeWidth={2.5} aria-hidden />
        {bonsLabel(goodCount)}
      </span>
    </div>
  );
}
