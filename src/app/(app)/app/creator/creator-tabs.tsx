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
  satisfaction: "up" | "down" | null;
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

type AnalyticsData = {
  totalUsers: number;
  newUsersThisWeek: number;
  usersByRole: Record<string, number>;
  totalWords: number;
  wordsThisWeek: number;
  totalSessions: number;
  sessionsThisWeek: number;
  pendingFeedbacks: number;
};

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  student: { label: "Étudiant", color: "bg-primary" },
  teacher: { label: "Professeur", color: "bg-blue-500" },
  creator: { label: "Créateur", color: "bg-amber-500" },
};

export function CreatorTabs() {
  const [tab, setTab] = useState<"analytics" | "feedbacks">("analytics");
  const [feedbacks, setFeedbacks] = useState<FeedbackWithUser[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch("/api/creator/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

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
    if (tab === "analytics") fetchAnalytics();
    if (tab === "feedbacks") fetchFeedbacks();
  }, [tab, fetchAnalytics, fetchFeedbacks]);

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

  function toggleExpanded(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
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
        <div className="space-y-6">
          {analyticsLoading ? (
            <p className="text-slate-500 dark:text-slate-400">Chargement…</p>
          ) : analytics ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    👥 Utilisateurs
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {analytics.totalUsers}
                  </p>
                  {analytics.newUsersThisWeek > 0 && (
                    <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                      +{analytics.newUsersThisWeek} cette semaine
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    📚 Mots ajoutés
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {analytics.totalWords}
                  </p>
                  {analytics.wordsThisWeek > 0 && (
                    <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                      +{analytics.wordsThisWeek} cette semaine
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    🔄 Sessions
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {analytics.totalSessions}
                  </p>
                  {analytics.sessionsThisWeek > 0 && (
                    <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                      +{analytics.sessionsThisWeek} cette semaine
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    💬 Feedbacks en attente
                  </p>
                  <p
                    className={`mt-1 text-2xl font-bold ${
                      analytics.pendingFeedbacks > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-slate-800 dark:text-slate-100"
                    }`}
                  >
                    {analytics.pendingFeedbacks}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Répartition par rôle
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(["student", "teacher", "creator"] as const).map((role) => {
                    const count = analytics.usersByRole[role] ?? 0;
                    const total = analytics.totalUsers || 1;
                    const pct = Math.round((count / total) * 100);
                    const { label, color } = ROLE_LABELS[role] ?? {
                      label: role,
                      color: "bg-slate-400",
                    };
                    return (
                      <div
                        key={role}
                        className="flex flex-1 min-w-[120px] flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50"
                      >
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {label}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">
                            {count}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className={`h-full ${color} transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">
              Impossible de charger les analytics.
            </p>
          )}
        </div>
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
            <div className="space-y-1 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
              {filteredFeedbacks.map((fb) => {
                const isExpanded = expandedId === fb.id;
                const descShort =
                  fb.description.length > 60
                    ? `${fb.description.slice(0, 60)}…`
                    : fb.description;
                return (
                  <div
                    key={fb.id}
                    className="border-b border-slate-100 last:border-b-0 dark:border-slate-700/50"
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpanded(fb.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        {TYPE_LABELS[fb.type] ?? fb.type}
                      </span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                          fb.status === "pending"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                            : fb.status === "in_progress"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                              : "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                        }`}
                      >
                        {STATUS_LABELS[fb.status]}
                      </span>
                      {fb.satisfaction && (
                        <span
                          className={`shrink-0 text-sm ${
                            fb.satisfaction === "up"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {fb.satisfaction === "up" ? "👍" : "👎"}
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-600 dark:text-slate-400">
                        {descShort}
                      </span>
                      {fb.page && (
                        <code className="hidden shrink-0 rounded bg-slate-100 px-1 text-xs dark:bg-slate-700 sm:inline">
                          {fb.page}
                        </code>
                      )}
                      <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                        {new Date(fb.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span
                        className={`shrink-0 text-xs text-slate-400 transition-transform dark:text-slate-500 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      >
                        ▼
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/50 px-3 py-3 dark:border-slate-700/50 dark:bg-slate-800/50">
                        <p className="mb-2 text-sm text-slate-800 dark:text-slate-100">
                          {fb.description}
                        </p>
                        {fb.page && (
                          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                            Page :{" "}
                            <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">
                              {fb.page}
                            </code>
                          </p>
                        )}
                        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                          {[fb.firstName, fb.email].filter(Boolean).join(" — ")}
                        </p>
                        {fb.satisfaction && (
                          <p
                            className={`mb-3 text-xs font-medium ${
                              fb.satisfaction === "up"
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {fb.satisfaction === "up"
                              ? "👍 Utilisateur satisfait"
                              : "👎 Utilisateur non satisfait"}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {STATUS_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(fb.id, opt.value);
                              }}
                              disabled={
                                updatingId === fb.id || fb.status === opt.value
                              }
                              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                                fb.status === opt.value
                                  ? "bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary-light"
                                  : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
