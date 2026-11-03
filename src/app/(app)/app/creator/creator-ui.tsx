import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Nombre JSON, ou chaîne numérique (somme SQL). */
export function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

/** « +0 % », « +12 % », « −3 % ». */
export function formatSignedPercent(value: number): string {
  const abs = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(
    Math.abs(value),
  );
  if (value > 0) return `+${abs} %`;
  if (value < 0) return `−${abs} %`;
  return "+0 %";
}

export function formatRelativeFr(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) {
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  if (days < 30) return `il y a ${days} jours`;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatPreciseFr(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  valueClassName = "text-[40px]",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  valueClassName?: string;
}) {
  return (
    <article className="flex h-full flex-col rounded-[14px] border border-line bg-surface px-5 py-5">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-ink">
          <Icon size={16} strokeWidth={1.75} aria-hidden />
        </span>
        <p className="m-0 text-[15px] text-ink">{label}</p>
      </div>
      <p className={`m-0 mt-4 font-heading leading-none tracking-tight text-ink tabular-nums ${valueClassName}`}>
        {value}
      </p>
      {hint ? <p className="m-0 mt-2 text-sm text-muted">{hint}</p> : null}
    </article>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="m-0 flex items-start gap-2 rounded-[14px] border border-false-sign bg-false-bg px-4 py-3 text-sm font-medium text-false-text"
      role="alert"
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0" stroke="var(--false-sign)" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export function LoadingNote({ children }: { children: React.ReactNode }) {
  return <p className="m-0 text-sm text-muted">{children}</p>;
}

export const cardClass = "rounded-[14px] border border-line bg-surface";

export const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-surface outline-none hover:bg-ink-hover focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export const outlineButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-[1.5px] border-ink bg-surface px-4 text-sm font-medium text-ink outline-none hover:bg-page focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

export const fieldClass =
  "min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink";
