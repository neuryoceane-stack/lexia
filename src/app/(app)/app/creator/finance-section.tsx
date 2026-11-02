"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  Euro,
  RotateCcw,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";
import {
  ErrorNote,
  KpiCard,
  LoadingNote,
  cardClass,
  formatEuro,
  formatSignedPercent,
  isRecord,
  num,
  outlineButtonClass,
} from "./creator-ui";
import { useCreatorResource } from "./use-creator-resource";

type PaymentStatus = "paid" | "failed" | "refunded";

type FinancePayment = {
  date: string;
  email: string;
  amount: number;
  status: PaymentStatus;
};

type FinanceAlert = {
  type: "churn" | "unpaid";
  message: string;
};

type FinanceData = {
  mrr: number;
  activeSubscribers: number;
  revenueThisMonth: number;
  revenuePrevMonth: number;
  monthVariation: number;
  mrrHistory: { month: string; revenue: number }[];
  recentPayments: FinancePayment[];
  alerts: FinanceAlert[];
};

type FinanceView = { kind: "unconfigured" } | { kind: "ready"; data: FinanceData };

const PAGE_SIZE = 5;

function parseFinance(data: unknown): FinanceView | null {
  if (!isRecord(data)) return null;
  if (data.stripeNotConfigured === true) return { kind: "unconfigured" };

  const mrr = num(data.mrr);
  const activeSubscribers = num(data.activeSubscribers);
  const revenueThisMonth = num(data.revenueThisMonth);
  const revenuePrevMonth = num(data.revenuePrevMonth);
  const monthVariation = num(data.monthVariation);
  if (
    mrr === null ||
    activeSubscribers === null ||
    revenueThisMonth === null ||
    revenuePrevMonth === null ||
    monthVariation === null ||
    !Array.isArray(data.mrrHistory) ||
    !Array.isArray(data.recentPayments) ||
    !Array.isArray(data.alerts)
  ) {
    return null;
  }

  const mrrHistory: { month: string; revenue: number }[] = [];
  for (const row of data.mrrHistory) {
    if (!isRecord(row) || typeof row.month !== "string") return null;
    const revenue = num(row.revenue);
    if (revenue === null) return null;
    mrrHistory.push({ month: row.month, revenue });
  }

  const recentPayments: FinancePayment[] = [];
  for (const row of data.recentPayments) {
    if (!isRecord(row) || typeof row.date !== "string" || typeof row.email !== "string") return null;
    const amount = num(row.amount);
    const status = row.status === "paid" || row.status === "failed" || row.status === "refunded" ? row.status : null;
    if (amount === null || !status) return null;
    recentPayments.push({ date: row.date, email: row.email, amount, status });
  }

  const alerts: FinanceAlert[] = [];
  for (const row of data.alerts) {
    if (!isRecord(row) || typeof row.message !== "string") return null;
    if (row.type !== "churn" && row.type !== "unpaid") return null;
    alerts.push({ type: row.type, message: row.message });
  }

  return {
    kind: "ready",
    data: {
      mrr,
      activeSubscribers,
      revenueThisMonth,
      revenuePrevMonth,
      monthVariation,
      mrrHistory,
      recentPayments,
      alerts,
    },
  };
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-just-bg px-2.5 py-1 text-xs font-medium text-just-text">
        <Check size={12} stroke="var(--just-sign)" aria-hidden />
        Payé
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-false-bg px-2.5 py-1 text-xs font-medium text-false-text">
        <X size={12} stroke="var(--false-sign)" aria-hidden />
        Échoué
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-mark px-2.5 py-1 text-xs font-medium text-ink">
      <RotateCcw size={12} aria-hidden />
      Remboursé
    </span>
  );
}

function formatPaymentDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function RevenueDot({
  cx,
  cy,
  index,
  total,
}: {
  cx?: number;
  cy?: number;
  index?: number;
  total: number;
}) {
  if (typeof cx !== "number" || typeof cy !== "number") return <g />;
  const last = index === total - 1;
  return <circle cx={cx} cy={cy} r={last ? 6 : 3.5} fill={last ? "var(--mark)" : "var(--ink)"} />;
}

export function FinanceSection() {
  const { data, loading, error } = useCreatorResource(
    "/api/creator/finance",
    parseFinance,
    "Impossible de charger les données financières.",
  );
  const [paymentPage, setPaymentPage] = useState(0);

  function exportPaymentsCsv(payments: FinancePayment[]) {
    if (payments.length === 0) return;
    const header = "Date,Email,Montant,Statut\n";
    const rows = payments
      .map(
        (payment) =>
          `${new Date(payment.date).toLocaleDateString("fr-FR")},${payment.email},${payment.amount}€,${payment.status}`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${BRAND_NAME.toLowerCase().replace(/\s+/g, "-")}-paiements-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading && !data) return <LoadingNote>Chargement…</LoadingNote>;
  if (!data) {
    return <ErrorNote>{error ?? "Impossible de charger les données financières."}</ErrorNote>;
  }

  if (data.kind === "unconfigured") {
    return (
      <section className={`${cardClass} px-6 py-16 text-center`}>
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-line text-ink">
          <CreditCard size={22} strokeWidth={1.75} aria-hidden />
        </span>
        <h2 className="mt-5 text-[28px] leading-tight text-ink">Stripe n&apos;est pas configuré</h2>
        <p className="mt-2 text-sm text-muted">Revenez après l&apos;intégration Stripe (Semaine 4).</p>
      </section>
    );
  }

  const finance = data.data;
  const pageCount = Math.max(1, Math.ceil(finance.recentPayments.length / PAGE_SIZE));
  const safePage = Math.min(paymentPage, pageCount - 1);
  const pagePayments = finance.recentPayments.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const variationHint =
    finance.monthVariation < 0
      ? `En baisse · ${formatEuro(finance.revenueThisMonth)} contre ${formatEuro(finance.revenuePrevMonth)}`
      : `${formatEuro(finance.revenueThisMonth)} contre ${formatEuro(finance.revenuePrevMonth)}`;

  return (
    <div className="space-y-6">
      {error ? <ErrorNote>{error}</ErrorNote> : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard icon={Euro} label="MRR (revenu mensuel)" value={formatEuro(finance.mrr)} />
        <KpiCard icon={Users} label="Abonnés actifs" value={String(finance.activeSubscribers)} />
        <KpiCard
          icon={TrendingUp}
          label="Variation du mois"
          value={formatSignedPercent(finance.monthVariation)}
          hint={variationHint}
        />
      </div>

      <section className={`${cardClass} px-5 py-5`}>
        <h2 className="text-[22px] text-ink">Revenus</h2>
        <p className="mt-1 text-sm text-muted">12 derniers mois</p>
        <p className="sr-only">
          {finance.mrrHistory.map((point) => `${point.month} : ${formatEuro(point.revenue)}`).join(", ")}
        </p>
        <div className="mt-4 h-[260px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={finance.mrrHistory} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "var(--muted)" }}
                tickLine={false}
                axisLine={false}
                interval={0}
                minTickGap={0}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "var(--muted)" }}
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(value: number) =>
                  `${new Intl.NumberFormat("fr-FR", {
                    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
                  }).format(value)} €`
                }
              />
              <Tooltip
                formatter={(value) => [formatEuro(Number(value)), "Revenus"]}
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: 14,
                  color: "var(--ink)",
                  fontSize: 13,
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="var(--ink)"
                strokeWidth={2}
                dot={(props) => (
                  <RevenueDot
                    cx={props.cx}
                    cy={props.cy}
                    index={props.index}
                    total={finance.mrrHistory.length}
                  />
                )}
                activeDot={{ r: 6, fill: "var(--mark)", stroke: "var(--ink)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {finance.alerts.length > 0 ? (
        <div className="space-y-2">
          {finance.alerts.map((alert) => (
            <p
              key={`${alert.type}-${alert.message}`}
              className={`m-0 flex items-start gap-2 rounded-[14px] border px-4 py-3 text-sm font-medium ${
                alert.type === "churn"
                  ? "border-false-sign bg-false-bg text-false-text"
                  : "border-line bg-mark text-ink"
              }`}
            >
              <AlertTriangle
                size={16}
                className="mt-0.5 shrink-0"
                stroke={alert.type === "churn" ? "var(--false-sign)" : "var(--ink)"}
                aria-hidden
              />
              <span>{alert.message}</span>
            </p>
          ))}
        </div>
      ) : null}

      <section className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <h2 className="text-[22px] text-ink">Derniers paiements</h2>
          <button
            type="button"
            onClick={() => exportPaymentsCsv(finance.recentPayments)}
            disabled={finance.recentPayments.length === 0}
            className={outlineButtonClass}
          >
            <Download size={16} aria-hidden />
            Exporter en CSV
          </button>
        </div>
        {finance.recentPayments.length === 0 ? (
          <p className="border-t border-line px-5 py-10 text-center text-sm text-muted">
            Aucun paiement pour l&apos;instant.
          </p>
        ) : (
          <>
            <ul className="m-0 list-none border-t border-line p-0 md:hidden">
              {pagePayments.map((payment, index) => (
                <li key={`${payment.date}-${payment.email}-${index}`} className="border-b border-line px-5 py-4 last:border-b-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="m-0 text-sm text-muted">{formatPaymentDate(payment.date)}</p>
                    <PaymentStatusBadge status={payment.status} />
                  </div>
                  <p className="m-0 mt-2 break-all text-sm text-ink">{payment.email}</p>
                  <p className="m-0 mt-1 font-heading text-xl text-ink tabular-nums">{formatEuro(payment.amount)}</p>
                </li>
              ))}
            </ul>
            <div className="hidden border-t border-line md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th scope="col" className="px-5 py-3 font-medium">Date</th>
                    <th scope="col" className="px-5 py-3 font-medium">E-mail</th>
                    <th scope="col" className="px-5 py-3 font-medium">Montant</th>
                    <th scope="col" className="px-5 py-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {pagePayments.map((payment, index) => (
                    <tr key={`${payment.date}-${payment.email}-${index}`} className="border-t border-line">
                      <td className="px-5 py-3 text-ink">{formatPaymentDate(payment.date)}</td>
                      <td className="max-w-[280px] truncate px-5 py-3 text-muted" title={payment.email}>
                        {payment.email}
                      </td>
                      <td className="px-5 py-3 font-medium text-ink tabular-nums">{formatEuro(payment.amount)}</td>
                      <td className="px-5 py-3">
                        <PaymentStatusBadge status={payment.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {finance.recentPayments.length > PAGE_SIZE ? (
              <div className="flex items-center justify-center gap-3 border-t border-line px-5 py-3">
                <button
                  type="button"
                  disabled={safePage === 0}
                  onClick={() => setPaymentPage(safePage - 1)}
                  className={outlineButtonClass}
                >
                  <ChevronLeft size={16} aria-hidden />
                  Précédent
                </button>
                <p className="m-0 text-sm text-muted tabular-nums">
                  {safePage + 1} / {pageCount}
                </p>
                <button
                  type="button"
                  disabled={safePage + 1 >= pageCount}
                  onClick={() => setPaymentPage(safePage + 1)}
                  className={outlineButtonClass}
                >
                  Suivant
                  <ChevronRight size={16} aria-hidden />
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
