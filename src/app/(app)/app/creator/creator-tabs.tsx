"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CreatorShopTab } from "./creator-shop-tab";

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

type FinancePayment = {
  date: string;
  email: string;
  amount: number;
  status: "paid" | "failed" | "refunded";
};

type FinanceAlert = {
  type: "churn" | "unpaid";
  message: string;
};

type FinanceData = {
  stripeNotConfigured?: boolean;
  mrr: number;
  activeSubscribers: number;
  revenueThisMonth: number;
  revenuePrevMonth: number;
  monthVariation: number;
  mrrHistory: { month: string; revenue: number }[];
  recentPayments: FinancePayment[];
  alerts: FinanceAlert[];
};

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  student: { label: "Étudiant", color: "bg-primary" },
  teacher: { label: "Professeur", color: "bg-blue-500" },
  creator: { label: "Créateur", color: "bg-amber-500" },
};

export function CreatorTabs() {
  const [tab, setTab] = useState<"analytics" | "feedbacks" | "finance" | "shop">("analytics");
  const [feedbacks, setFeedbacks] = useState<FeedbackWithUser[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [finance, setFinance] = useState<FinanceData | null>(null);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [paymentPage, setPaymentPage] = useState(0);

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

  const fetchFinance = useCallback(async () => {
    setFinanceLoading(true);
    try {
      const res = await fetch("/api/creator/finance");
      if (res.ok) {
        const data = await res.json();
        setFinance(data);
        setPaymentPage(0);
      }
    } finally {
      setFinanceLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "analytics") fetchAnalytics();
    if (tab === "feedbacks") fetchFeedbacks();
    if (tab === "finance") fetchFinance();
  }, [tab, fetchAnalytics, fetchFeedbacks, fetchFinance]);

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

  function exportPaymentsCsv() {
    if (!finance?.recentPayments?.length) return;
    const header = "Date,Email,Montant,Statut\n";
    const rows = finance.recentPayments
      .map(
        (p) =>
          `${new Date(p.date).toLocaleDateString("fr-FR")},${p.email},${p.amount}€,${p.status}`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lexiva-paiements-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredFeedbacks =
    statusFilter === "all"
      ? feedbacks
      : feedbacks.filter((f) => f.status === statusFilter);

  return (
    <>
      <div className="mb-6 flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab("analytics")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
            tab === "analytics"
              ? "border-primary text-primary"
              : "border-transparent text-slate-600 hover:text-slate-800"
          }`}
        >
          Analytics
        </button>
        <button
          type="button"
          onClick={() => setTab("feedbacks")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
            tab === "feedbacks"
              ? "border-primary text-primary"
              : "border-transparent text-slate-600 hover:text-slate-800"
          }`}
        >
          Feedbacks
        </button>
        <button
          type="button"
          onClick={() => setTab("finance")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
            tab === "finance"
              ? "border-primary text-primary"
              : "border-transparent text-slate-600 hover:text-slate-800"
          }`}
        >
          Finance 💰
        </button>
        <button
          type="button"
          onClick={() => setTab("shop")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
            tab === "shop"
              ? "border-primary text-primary"
              : "border-transparent text-slate-600 hover:text-slate-800"
          }`}
        >
          Shop 🛍️
        </button>
      </div>

      {tab === "analytics" && (
        <div className="space-y-6">
          {analyticsLoading ? (
            <p className="text-slate-500">Chargement…</p>
          ) : analytics ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">
                    👥 Utilisateurs
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-800">
                    {analytics.totalUsers}
                  </p>
                  {analytics.newUsersThisWeek > 0 && (
                    <p className="mt-1 text-sm text-green-600">
                      +{analytics.newUsersThisWeek} cette semaine
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">
                    📚 Mots ajoutés
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-800">
                    {analytics.totalWords}
                  </p>
                  {analytics.wordsThisWeek > 0 && (
                    <p className="mt-1 text-sm text-green-600">
                      +{analytics.wordsThisWeek} cette semaine
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">
                    🔄 Sessions
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-800">
                    {analytics.totalSessions}
                  </p>
                  {analytics.sessionsThisWeek > 0 && (
                    <p className="mt-1 text-sm text-green-600">
                      +{analytics.sessionsThisWeek} cette semaine
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">
                    💬 Feedbacks en attente
                  </p>
                  <p
                    className={`mt-1 text-2xl font-bold ${
                      analytics.pendingFeedbacks > 0
                        ? "text-amber-600"
                        : "text-slate-800"
                    }`}
                  >
                    {analytics.pendingFeedbacks}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-700">
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
                        className="flex flex-1 min-w-[120px] flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-slate-700">
                            {label}
                          </span>
                          <span className="text-slate-500">
                            {count}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
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
            <p className="text-slate-500">
              Impossible de charger les analytics.
            </p>
          )}
        </div>
      )}

      {tab === "finance" && (
        <div className="space-y-6">
          {financeLoading ? (
            <p className="text-slate-500">Chargement…</p>
          ) : finance?.stripeNotConfigured ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-12 text-center">
              <span className="text-5xl">💳</span>
              <h3 className="mt-4 text-lg font-semibold text-slate-800">
                Stripe non configuré
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Revenez après l'intégration Stripe (Semaine 4)
              </p>
            </div>
          ) : finance ? (
            <>
              {/* Metric cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">
                    💰 MRR
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-800">
                    {finance.mrr.toFixed(2)} €
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">
                    👥 Abonnés actifs
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-800">
                    {finance.activeSubscribers}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">
                    📈 Variation mois
                  </p>
                  <p
                    className={`mt-1 text-2xl font-bold ${
                      finance.monthVariation >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {finance.monthVariation >= 0 ? "+" : ""}
                    {finance.monthVariation}%
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {finance.revenueThisMonth.toFixed(2)} € vs{" "}
                    {finance.revenuePrevMonth.toFixed(2)} €
                  </p>
                </div>
              </div>

              {/* Graphique MRR 12 mois */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-slate-700">
                  Revenus — 12 derniers mois
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={finance.mrrHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      tickFormatter={(v: number) => `${v}€`}
                    />
                    <Tooltip
                      formatter={(value) => [`${value} €`, "Revenus"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#6C3FC8"
                      strokeWidth={2}
                      dot={{ fill: "#6C3FC8", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Alertes */}
              {finance.alerts.length > 0 && (
                <div className="space-y-2">
                  {finance.alerts.map((alert, i) => (
                    <div
                      key={i}
                      className={`rounded-lg border p-3 text-sm font-medium ${
                        alert.type === "churn"
                          ? "border-red-200 bg-red-50 text-red-800"
                          : "border-amber-200 bg-amber-50 text-amber-800"
                      }`}
                    >
                      {alert.type === "churn" ? "🔴" : "🟡"} {alert.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Tableau paiements */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <h3 className="text-sm font-semibold text-slate-700">
                    Derniers paiements
                  </h3>
                  <button
                    type="button"
                    onClick={exportPaymentsCsv}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Exporter CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left">
                        <th className="px-4 py-2 font-medium text-slate-500">
                          Date
                        </th>
                        <th className="px-4 py-2 font-medium text-slate-500">
                          Email
                        </th>
                        <th className="px-4 py-2 font-medium text-slate-500">
                          Montant
                        </th>
                        <th className="px-4 py-2 font-medium text-slate-500">
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {finance.recentPayments
                        .slice(paymentPage * 5, paymentPage * 5 + 5)
                        .map((p, i) => (
                          <tr
                            key={i}
                            className="border-b border-slate-50 last:border-b-0"
                          >
                            <td className="px-4 py-2 text-slate-700">
                              {new Date(p.date).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                              })}
                            </td>
                            <td className="px-4 py-2 text-slate-600">
                              {p.email}
                            </td>
                            <td className="px-4 py-2 font-medium text-slate-800">
                              {p.amount.toFixed(2)} €
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  p.status === "paid"
                                    ? "bg-green-100 text-green-800"
                                    : p.status === "failed"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-orange-100 text-orange-800"
                                }`}
                              >
                                {p.status === "paid"
                                  ? "Payé"
                                  : p.status === "failed"
                                    ? "Échoué"
                                    : "Remboursé"}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {finance.recentPayments.length > 5 && (
                  <div className="flex justify-center gap-2 border-t border-slate-100 px-4 py-2">
                    <button
                      type="button"
                      disabled={paymentPage === 0}
                      onClick={() => setPaymentPage((p) => p - 1)}
                      className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                    >
                      ← Précédent
                    </button>
                    <button
                      type="button"
                      disabled={
                        (paymentPage + 1) * 5 >= finance.recentPayments.length
                      }
                      onClick={() => setPaymentPage((p) => p + 1)}
                      className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                    >
                      Suivant →
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-slate-500">
              Impossible de charger les données financières.
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
                    ? "bg-primary/15 text-primary"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f === "all" ? "Tous" : STATUS_LABELS[f]}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-slate-500">Chargement…</p>
          ) : filteredFeedbacks.length === 0 ? (
            <p className="text-slate-500">
              Aucun feedback pour ce filtre.
            </p>
          ) : (
            <div className="space-y-1 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {filteredFeedbacks.map((fb) => {
                const isExpanded = expandedId === fb.id;
                const descShort =
                  fb.description.length > 60
                    ? `${fb.description.slice(0, 60)}…`
                    : fb.description;
                return (
                  <div
                    key={fb.id}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpanded(fb.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-slate-50"
                    >
                      <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700">
                        {TYPE_LABELS[fb.type] ?? fb.type}
                      </span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                          fb.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : fb.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {STATUS_LABELS[fb.status]}
                      </span>
                      {fb.satisfaction && (
                        <span
                          className={`shrink-0 text-sm ${
                            fb.satisfaction === "up"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {fb.satisfaction === "up" ? "👍" : "👎"}
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-600">
                        {descShort}
                      </span>
                      {fb.page && (
                        <code className="hidden shrink-0 rounded bg-slate-100 px-1 text-xs sm:inline">
                          {fb.page}
                        </code>
                      )}
                      <span className="shrink-0 text-xs text-slate-400">
                        {new Date(fb.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span
                        className={`shrink-0 text-xs text-slate-400 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      >
                        ▼
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/50 px-3 py-3">
                        <p className="mb-2 text-sm text-slate-800">
                          {fb.description}
                        </p>
                        {fb.page && (
                          <p className="mb-2 text-xs text-slate-500">
                            Page :{" "}
                            <code className="rounded bg-slate-200 px-1">
                              {fb.page}
                            </code>
                          </p>
                        )}
                        <p className="mb-2 text-xs text-slate-500">
                          {[fb.firstName, fb.email].filter(Boolean).join(" — ")}
                        </p>
                        {fb.satisfaction && (
                          <p
                            className={`mb-3 text-xs font-medium ${
                              fb.satisfaction === "up"
                                ? "text-green-600"
                                : "text-red-600"
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
                                  ? "bg-primary/20 text-primary"
                                  : "bg-white text-slate-600 hover:bg-slate-100"
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

      {tab === "shop" && <CreatorShopTab />}
    </>
  );
}
