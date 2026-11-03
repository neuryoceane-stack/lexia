"use client";

import { useState } from "react";
import {
  Activity,
  Bug,
  Check,
  Circle,
  CircleHelp,
  Clock,
  Lightbulb,
  ThumbsDown,
  ThumbsUp,
  type LucideIcon,
} from "lucide-react";
import {
  ErrorNote,
  LoadingNote,
  formatRelativeFr,
  isRecord,
} from "./creator-ui";
import { useCreatorResource } from "./use-creator-resource";
import { deviceLabel, type FeedbackDevice } from "@/lib/feedback-meta";

type FeedbackStatus = "pending" | "in_progress" | "done";
type FeedbackType = "bug" | "idee" | "question";
type FeedbackWithUser = {
  id: string;
  userId: string;
  type: FeedbackType;
  description: string;
  page: string | null;
  device: FeedbackDevice | null;
  browser: string | null;
  hasMeta: boolean;
  status: FeedbackStatus;
  satisfaction: "up" | "down" | null;
  createdAt: string;
  firstName: string | null;
  email: string;
};

type StatusFilter = "all" | FeedbackStatus;
type HealthTab = "feedbacks" | "tech";

const TYPE_META: Record<FeedbackType, { label: string; icon: LucideIcon }> = {
  bug: { label: "Bug", icon: Bug },
  idee: { label: "Idée", icon: Lightbulb },
  question: { label: "Question", icon: CircleHelp },
};

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "pending", label: "En attente" },
  { value: "in_progress", label: "En cours" },
  { value: "done", label: "Fait" },
];

const HEALTH_TABS: { id: HealthTab; label: string }[] = [
  { id: "feedbacks", label: "Retours des élèves" },
  { id: "tech", label: "Santé technique" },
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
    const device =
      row.device === "mobile" || row.device === "tablette" || row.device === "ordinateur"
        ? row.device
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
      device,
      browser: typeof row.browser === "string" ? row.browser : null,
      hasMeta: row.hasMeta === true,
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
      <span className="inline-flex items-center gap-1 rounded-full border border-line bg-page px-3 py-1 text-xs font-medium text-muted">
        <Check size={12} aria-hidden />
        Fait
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-ink bg-surface px-3 py-1 text-xs font-medium text-ink">
        <Clock size={12} aria-hidden />
        En cours
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-mark px-3 py-1 text-xs font-medium text-ink">
      <Circle size={10} fill="currentColor" aria-hidden />
      En attente
    </span>
  );
}

function TypeBadge({ type }: { type: FeedbackType }) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-ink px-2.5 py-1 text-xs font-medium text-ink">
      <Icon size={13} aria-hidden />
      {meta.label}
    </span>
  );
}

function contextLine(fb: FeedbackWithUser): string | null {
  const parts: string[] = [];
  if (fb.page) parts.push(`Page : ${fb.page}`);
  if (fb.device) parts.push(`Appareil : ${deviceLabel(fb.device).toLowerCase()}`);
  if (fb.browser) parts.push(`Navigateur : ${fb.browser}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function TechHealthPlaceholder() {
  return (
    <section className="rounded-[20px] border border-line bg-surface px-6 py-16 text-center">
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-line text-ink">
        <Activity size={22} strokeWidth={1.75} aria-hidden />
      </span>
      <h2 className="mt-5 font-heading text-[28px] font-bold leading-tight text-ink">
        Santé technique
      </h2>
      <p className="mt-2 text-sm text-muted">Bientôt disponible</p>
    </section>
  );
}

export function FeedbacksSection() {
  const { data, setData, loading, error } = useCreatorResource(
    "/api/creator/feedbacks",
    parseFeedbacks,
    "Impossible de charger les retours.",
  );
  const [healthTab, setHealthTab] = useState<HealthTab>("feedbacks");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
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
      <div className="flex gap-6 overflow-x-auto border-b border-line" role="tablist" aria-label="Retours et santé">
        {HEALTH_TABS.map((tab) => {
          const active = healthTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setHealthTab(tab.id)}
              className="inline-flex h-11 shrink-0 items-center outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
            >
              <span className={active ? "marker font-medium" : "whitespace-nowrap px-[7px] text-muted"}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {healthTab === "tech" ? <TechHealthPlaceholder /> : null}

      {healthTab === "feedbacks" ? (
        <div className="space-y-6">
          {error ? <ErrorNote>{error}</ErrorNote> : null}
          {statusError ? <ErrorNote>{statusError}</ErrorNote> : null}

          <header>
            <h2 className="font-heading text-[28px] font-bold leading-tight text-ink">Feedbacks</h2>
            <p className="mt-1 text-sm text-muted">
              Ce que les élèves vous envoient depuis le bouton de retour d&apos;information.
            </p>
          </header>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
              const active = statusFilter === filter.value;
              const count = counts[filter.value];
              return (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                    active
                      ? "border-ink bg-mark text-ink"
                      : "border-ink bg-surface text-ink hover:bg-page"
                  }`}
                >
                  {filter.label} · {count}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-[20px] border border-line bg-surface px-6 py-14 text-center">
              <p className="m-0 text-sm text-muted">Aucun retour pour ce filtre.</p>
            </div>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              {filtered.map((fb) => {
                const ctx = contextLine(fb);
                const inProgressDisabled = fb.status === "in_progress" || fb.status === "done";
                const doneDisabled = fb.status === "done";
                return (
                  <li
                    key={fb.id}
                    className="rounded-[20px] border border-line bg-surface px-5 py-4"
                    aria-busy={updatingId === fb.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted">
                        {fb.hasMeta ? <TypeBadge type={fb.type} /> : null}
                        <span className="min-w-0 truncate">
                          {fb.email}
                          <span aria-hidden> · </span>
                          <time dateTime={fb.createdAt}>{formatRelativeFr(fb.createdAt)}</time>
                        </span>
                        {fb.satisfaction === "up" ? (
                          <ThumbsUp size={14} stroke="var(--just-sign)" aria-label="Satisfait" />
                        ) : null}
                        {fb.satisfaction === "down" ? (
                          <ThumbsDown size={14} stroke="var(--false-sign)" aria-label="Non satisfait" />
                        ) : null}
                      </div>
                      <StatusBadge status={fb.status} />
                    </div>

                    <p className="mb-0 mt-3 whitespace-pre-wrap text-sm text-ink">{fb.description}</p>

                    {ctx ? <p className="mb-0 mt-2 text-xs text-muted">{ctx}</p> : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(fb.id, "in_progress")}
                        disabled={updatingId === fb.id || inProgressDisabled}
                        className="inline-flex min-h-11 items-center rounded-full border border-ink bg-surface px-4 text-sm font-medium text-ink outline-none hover:bg-page focus-visible:ring-2 focus-visible:ring-ink disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Marquer en cours
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(fb.id, "done")}
                        disabled={updatingId === fb.id || doneDisabled}
                        className="inline-flex min-h-11 items-center rounded-full border border-ink bg-surface px-4 text-sm font-medium text-ink outline-none hover:bg-page focus-visible:ring-2 focus-visible:ring-ink disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Marquer comme fait
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
