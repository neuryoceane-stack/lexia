"use client";

import { useState } from "react";
import {
  Bug,
  Check,
  ChevronDown,
  Circle,
  CircleHelp,
  Clock,
  Lightbulb,
  MessageSquare,
  ThumbsDown,
  ThumbsUp,
  type LucideIcon,
} from "lucide-react";
import {
  ErrorNote,
  KpiCard,
  LoadingNote,
  cardClass,
  formatPreciseFr,
  formatRelativeFr,
  isRecord,
} from "./creator-ui";
import { useCreatorResource } from "./use-creator-resource";

type FeedbackStatus = "pending" | "in_progress" | "done";
type FeedbackType = "bug" | "idee" | "question";
type FeedbackWithUser = {
  id: string;
  userId: string;
  type: FeedbackType;
  description: string;
  page: string | null;
  status: FeedbackStatus;
  satisfaction: "up" | "down" | null;
  createdAt: string;
  firstName: string | null;
  email: string;
};

type StatusFilter = "all" | FeedbackStatus;

const TYPE_META: Record<FeedbackType, { label: string; icon: LucideIcon }> = {
  bug: { label: "Bug", icon: Bug },
  idee: { label: "Idée", icon: Lightbulb },
  question: { label: "Question", icon: CircleHelp },
};

const STATUS_OPTIONS: { value: FeedbackStatus; label: string }[] = [
  { value: "pending", label: "En attente" },
  { value: "in_progress", label: "En cours" },
  { value: "done", label: "Résolu" },
];

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "pending", label: "En attente" },
  { value: "in_progress", label: "En cours" },
  { value: "done", label: "Résolu" },
];

function parseFeedbacks(data: unknown): FeedbackWithUser[] | null {
  if (!Array.isArray(data)) return null;
  const list: FeedbackWithUser[] = [];
  for (const row of data) {
    if (!isRecord(row)) return null;
    const type = row.type === "bug" || row.type === "idee" || row.type === "question" ? row.type : null;
    const status =
      row.status === "pending" || row.status === "in_progress" || row.status === "done"
        ? row.status
        : null;
    if (
      !type ||
      !status ||
      typeof row.id !== "string" ||
      typeof row.description !== "string" ||
      typeof row.email !== "string" ||
      typeof row.createdAt !== "string"
    ) {
      return null;
    }
    list.push({
      id: row.id,
      userId: typeof row.userId === "string" ? row.userId : "",
      type,
      description: row.description,
      page: typeof row.page === "string" ? row.page : null,
      status,
      satisfaction: row.satisfaction === "up" || row.satisfaction === "down" ? row.satisfaction : null,
      createdAt: row.createdAt,
      firstName: typeof row.firstName === "string" ? row.firstName : null,
      email: row.email,
    });
  }
  return list;
}

function StatusBadge({ status }: { status: FeedbackStatus }) {
  if (status === "done") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-just-bg px-2.5 py-1 text-xs font-medium text-just-text">
        <Check size={12} stroke="var(--just-sign)" aria-hidden />
        Résolu
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-ink bg-surface px-2.5 py-1 text-xs font-medium text-ink">
        <Clock size={12} aria-hidden />
        En cours
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-mark px-2.5 py-1 text-xs font-medium text-ink">
      <Circle size={12} aria-hidden />
      En attente
    </span>
  );
}

function TypeBadge({ type }: { type: FeedbackType }) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-xs font-medium text-ink">
      <Icon size={12} aria-hidden />
      {meta.label}
    </span>
  );
}

export function FeedbacksSection() {
  const { data, setData, loading, error } = useCreatorResource(
    "/api/creator/feedbacks",
    parseFeedbacks,
    "Impossible de charger les retours.",
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  async function handleStatusChange(id: string, status: FeedbackStatus) {
    setUpdatingId(id);
    setStatusError(null);
    try {
      const res = await fetch("/api/creator/feedbacks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        setStatusError("Le statut n'a pas pu être mis à jour.");
        return;
      }
      setData((prev) => (prev ? prev.map((item) => (item.id === id ? { ...item, status } : item)) : prev));
    } catch {
      setStatusError("Le statut n'a pas pu être mis à jour.");
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading && !data) return <LoadingNote>Chargement…</LoadingNote>;
  if (!data) return <ErrorNote>{error ?? "Impossible de charger les retours."}</ErrorNote>;

  const counts = {
    all: data.length,
    pending: data.filter((item) => item.status === "pending").length,
    in_progress: data.filter((item) => item.status === "in_progress").length,
    done: data.filter((item) => item.status === "done").length,
  };
  const filtered = statusFilter === "all" ? data : data.filter((item) => item.status === statusFilter);

  return (
    <div className="space-y-6">
      {error ? <ErrorNote>{error}</ErrorNote> : null}
      <header>
        <h2 className="text-[28px] leading-tight text-ink">Retours</h2>
        <p className="mt-1 text-sm text-muted">Messages envoyés depuis l&apos;application.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <KpiCard icon={MessageSquare} label="Retours" value={String(counts.all)} />
        <KpiCard icon={Circle} label="En attente" value={String(counts.pending)} />
        <KpiCard icon={Clock} label="En cours" value={String(counts.in_progress)} />
        <KpiCard icon={Check} label="Résolus" value={String(counts.done)} />
      </div>

      <div className="flex flex-wrap gap-1">
        {FILTERS.map((filter) => {
          const active = statusFilter === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              aria-pressed={active}
              onClick={() => setStatusFilter(filter.value)}
              className="inline-flex h-11 items-center rounded-lg px-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              <span className={active ? "marker font-medium" : "px-[7px] text-muted"}>
                {filter.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className={cardClass}>
        <div className="hidden grid-cols-[108px_108px_minmax(0,1fr)_128px_28px] gap-3 px-5 py-3 text-xs text-muted md:grid">
          <span>Quand</span>
          <span>Type</span>
          <span>Message</span>
          <span>Statut</span>
          <span className="sr-only">Détail</span>
        </div>
        {filtered.length === 0 ? (
          <p className="border-t border-line px-5 py-10 text-center text-sm text-muted">
            Aucun retour pour ce filtre.
          </p>
        ) : (
          <ul className="m-0 list-none border-t border-line p-0">
            {filtered.map((fb) => {
              const open = expandedId === fb.id;
              return (
                <li key={fb.id} className="border-b border-line last:border-b-0">
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => {
                      setExpandedId(open ? null : fb.id);
                      setStatusError(null);
                    }}
                    className="grid w-full grid-cols-1 gap-2 px-5 py-3 text-left outline-none hover:bg-page focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink md:grid-cols-[108px_108px_minmax(0,1fr)_128px_28px] md:items-center md:gap-3"
                  >
                    <time
                      dateTime={fb.createdAt}
                      className="text-sm text-muted"
                      title={formatPreciseFr(fb.createdAt)}
                    >
                      {formatRelativeFr(fb.createdAt)}
                    </time>
                    <span className="flex items-center gap-2">
                      <TypeBadge type={fb.type} />
                      {fb.satisfaction === "up" ? (
                        <ThumbsUp size={14} stroke="var(--just-sign)" aria-label="Satisfait" />
                      ) : null}
                      {fb.satisfaction === "down" ? (
                        <ThumbsDown size={14} stroke="var(--false-sign)" aria-label="Non satisfait" />
                      ) : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-ink">{fb.description}</span>
                      {fb.page ? (
                        <span className="mt-0.5 block truncate text-xs text-muted">{fb.page}</span>
                      ) : null}
                    </span>
                    <StatusBadge status={fb.status} />
                    <ChevronDown
                      size={16}
                      className={`justify-self-end text-muted transition-transform md:justify-self-center ${open ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </button>
                  {open ? (
                    <div className="border-t border-line bg-page px-5 py-4" aria-busy={updatingId === fb.id}>
                      <p className="m-0 whitespace-pre-wrap text-sm text-ink">{fb.description}</p>
                      {fb.page ? (
                        <p className="mb-0 mt-3 text-xs text-muted">
                          Page : <code className="rounded bg-surface px-1.5 py-0.5 text-ink">{fb.page}</code>
                        </p>
                      ) : null}
                      <p className="mb-0 mt-2 text-xs text-muted">
                        {[fb.firstName, fb.email].filter(Boolean).join(" — ")}
                      </p>
                      <p className="mb-0 mt-1 text-xs text-muted">
                        <time dateTime={fb.createdAt}>{formatPreciseFr(fb.createdAt)}</time>
                      </p>
                      {fb.satisfaction ? (
                        <p
                          className={`mb-0 mt-3 inline-flex items-center gap-1.5 text-xs font-medium ${
                            fb.satisfaction === "up" ? "text-just-text" : "text-false-text"
                          }`}
                        >
                          {fb.satisfaction === "up" ? (
                            <ThumbsUp size={14} stroke="var(--just-sign)" aria-hidden />
                          ) : (
                            <ThumbsDown size={14} stroke="var(--false-sign)" aria-hidden />
                          )}
                          {fb.satisfaction === "up" ? "Satisfait" : "Non satisfait"}
                        </p>
                      ) : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((opt) => {
                          const selected = fb.status === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleStatusChange(fb.id, opt.value)}
                              disabled={updatingId === fb.id || selected}
                              className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-not-allowed ${
                                selected
                                  ? "bg-ink text-surface disabled:opacity-100"
                                  : "border border-line bg-surface text-ink hover:border-ink disabled:opacity-50"
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                      {statusError && expandedId === fb.id ? (
                        <div className="mt-3">
                          <ErrorNote>{statusError}</ErrorNote>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
