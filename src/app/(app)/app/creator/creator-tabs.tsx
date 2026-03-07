"use client";

import { useState, useEffect, useCallback } from "react";

type FeedbackStatus = "pending" | "in_progress" | "done";
type FeedbackWithUser = {
  id: string;
  userId: string;
  type: "bug" | "idee" | "question";
  description: string;
  page: string | null;
  status: FeedbackStatus;
  createdAt: string;
  firstName: string | null;
  email: string;
};

const TYPE_LABELS: Record<string, string> = {
  bug: "🐛 Bug",
  idee: "✨ Idée",
  question: "❓ Question",
};

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  pending: "🟡 En attente",
  in_progress: "🔵 En cours",
  done: "✅ Fait",
};

const STATUS_OPTIONS: { value: FeedbackStatus; label: string }[] = [
  { value: "pending", label: "En attente" },
  { value: "in_progress", label: "En cours" },
  { value: "done", label: "Fait" },
];

type StatusFilter = "all" | FeedbackStatus;

export function CreatorTabs() {
  const [tab, setTab] = useState<"analytics" | "feedbacks">("analytics");
  const [feedbacks, setFeedbacks] = useState<FeedbackWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/creator/feedbacks");
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "feedbacks") fetchFeedbacks();
  }, [tab, fetchFeedbacks]);

  async function handleStatusChange(id: string, status: FeedbackStatus) {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/creator/feedbacks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setFeedbacks((prev) =>
          prev.map((f) => (f.id === id ? { ...f, status } : f))
        );
      }
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredFeedbacks =
    statusFilter === "all"
      ? feedbacks
      : feedbacks.filter((f) => f.status === statusFilter);

  return (
    <>
      <div className="mb-6 flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setTab("analytics")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
            tab === "analytics"
              ? "border-primary text-primary dark:border-primary-light dark:text-primary-light"
              : "border-transparent text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Analytics
        </button>
        <button
          type="button"
          onClick={() => setTab("feedbacks")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
            tab === "feedbacks"
              ? "border-primary text-primary dark:border-primary-light dark:text-primary-light"
              : "border-transparent text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Feedbacks
        </button>
      </div>

      {tab === "analytics" && (
        <p className="text-slate-500 dark:text-slate-400">Analytics — à venir.</p>
      )}

      {tab === "feedbacks" && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {(["all", "pending", "in_progress", "done"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  statusFilter === f
                    ? "bg-primary/15 text-primary dark:bg-primary/25 dark:text-primary-light"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600"
                }`}
              >
                {f === "all" ? "Tous" : STATUS_LABELS[f]}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-slate-500 dark:text-slate-400">Chargement…</p>
          ) : filteredFeedbacks.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400">
              Aucun feedback pour ce filtre.
            </p>
          ) : (
            <div className="space-y-4">
              {filteredFeedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      {TYPE_LABELS[fb.type] ?? fb.type}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                        fb.status === "pending"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                          : fb.status === "in_progress"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                            : "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                      }`}
                    >
                      {STATUS_LABELS[fb.status]}
                    </span>
                  </div>
                  <p className="mb-2 text-slate-800 dark:text-slate-100">
                    {fb.description}
                  </p>
                  {fb.page && (
                    <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                      Page : <code className="rounded bg-slate-100 px-1 dark:bg-slate-700">{fb.page}</code>
                    </p>
                  )}
                  <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                    {[fb.firstName, fb.email].filter(Boolean).join(" — ")}
                  </p>
                  <p className="mb-4 text-xs text-slate-400 dark:text-slate-500">
                    {new Date(fb.createdAt).toLocaleDateString("fr-FR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleStatusChange(fb.id, opt.value)}
                        disabled={updatingId === fb.id || fb.status === opt.value}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                          fb.status === opt.value
                            ? "bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary-light"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
