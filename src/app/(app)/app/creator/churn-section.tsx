"use client";

import { useState } from "react";
import { Clock, Download, TrendingUp, UserMinus, UserRound } from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";
import {
  formatChurnPercent,
  formatCount,
  formatDepartureDate,
  formatTenureDays,
  parseChurnResponse,
  reasonBarLabel,
  reasonPillLabel,
  subscribersAtStartHint,
  CANCELLATION_PLAN_LABELS,
  type ChurnDashboard,
} from "@/lib/cancellation";
import {
  ErrorNote,
  KpiCard,
  LoadingNote,
  cardClass,
  outlineButtonClass,
} from "./creator-ui";
import { useCreatorResource } from "./use-creator-resource";

export function ChurnSection() {
  const { data, loading, error } = useCreatorResource(
    "/api/creator/churn",
    parseChurnResponse,
    "Impossible de charger les désabonnements.",
  );
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function exportCsv() {
    setExporting(true);
    setExportError(null);
    try {
      const response = await fetch("/api/creator/churn/export");
      if (!response.ok) {
        setExportError("Impossible d'exporter les désabonnements.");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `${BRAND_NAME.toLowerCase().replace(/\s+/g, "-")}-desabonnements-${stamp}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Impossible d'exporter les désabonnements.");
    } finally {
      setExporting(false);
    }
  }

  if (loading && !data) return <LoadingNote>Chargement…</LoadingNote>;
  if (!data) return <ErrorNote>{error ?? "Impossible de charger les désabonnements."}</ErrorNote>;
  if (!data.available) return <ChurnEmpty title="Désabonnements" body="Les désabonnements ne sont pas encore disponibles." />;
  if (data.total === 0) return <ChurnEmpty title="Désabonnements" body="Aucun désabonnement enregistré." />;

  return (
    <div className="space-y-6">
      {error ? <ErrorNote>{error}</ErrorNote> : null}
      {exportError ? <ErrorNote>{exportError}</ErrorNote> : null}
      <ChurnDashboardView data={data} exporting={exporting} onExport={() => void exportCsv()} />
    </div>
  );
}

function ChurnDashboardView({
  data,
  exporting,
  onExport,
}: {
  data: ChurnDashboard;
  exporting: boolean;
  onExport: () => void;
}) {
  const reasonRows = data.reasons30d.filter((row) => row.count > 0);
  const maxReason = reasonRows.reduce((max, row) => Math.max(max, row.count), 0);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[28px] leading-tight text-ink">Désabonnements</h2>
          <p className="mt-1 text-sm text-muted">Qui part, quand, et pourquoi.</p>
        </div>
        <button
          type="button"
          onClick={onExport}
          disabled={exporting}
          className={`${outlineButtonClass} self-start`}
        >
          <Download size={16} aria-hidden />
          {exporting ? "Export…" : "Exporter en CSV"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <KpiCard
          icon={UserRound}
          label="Désabonnements ce mois"
          value={formatCount(data.cancellationsThisMonth)}
          hint={subscribersAtStartHint(data.subscribersAtMonthStart)}
        />
        <KpiCard
          icon={TrendingUp}
          label="Taux de désabonnement"
          value={formatChurnPercent(data.churnPercent)}
          hint="mensuel"
        />
        <KpiCard
          icon={Clock}
          label="Durée moyenne avant le départ"
          value={data.averageTenureDays == null ? "—" : formatTenureDays(data.averageTenureDays)}
        />
      </div>

      <section className={`${cardClass} px-5 py-5`}>
        <h3 className="text-[22px] text-ink">Pourquoi ils partent</h3>
        <p className="mt-1 text-sm text-muted">
          Le motif choisi au moment de la résiliation, sur 30 jours
        </p>
        {reasonRows.length === 0 ? (
          <p className="mb-0 mt-5 text-sm text-muted">Aucun motif sur les 30 derniers jours.</p>
        ) : (
          <ul className="mt-5 grid gap-4">
            {reasonRows.map((row) => {
              const width = maxReason > 0 ? Math.round((row.count / maxReason) * 100) : 0;
              const label = reasonBarLabel(row.reason);
              return (
                <li key={row.reason}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 sm:hidden">
                    <p className="m-0 text-sm leading-snug text-ink">{label}</p>
                    <p className="m-0 text-sm tabular-nums text-ink">{formatCount(row.count)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="m-0 hidden w-[34%] shrink-0 text-sm leading-snug text-ink sm:block">{label}</p>
                    <div
                      className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--background-subtle)]"
                      role="meter"
                      aria-valuemin={0}
                      aria-valuemax={maxReason}
                      aria-valuenow={row.count}
                      aria-label={label}
                    >
                      <div className="h-full rounded-full bg-ink" style={{ width: `${width}%` }} />
                    </div>
                    <p className="m-0 hidden min-w-6 shrink-0 text-right text-sm tabular-nums text-ink sm:block">
                      {formatCount(row.count)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={`${cardClass} px-5 py-5`}>
        <h3 className="text-[22px] text-ink">Derniers départs</h3>
        <ul className="mt-4 grid gap-3 md:hidden">
          {data.recent.map((row, index) => (
            <li key={`${row.cancelledAt}-${index}`} className="rounded-xl border border-line px-3 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="m-0 font-medium text-ink">{row.student}</p>
                <p className="m-0 shrink-0 text-sm text-muted">
                  {formatDepartureDate(new Date(row.cancelledAt))}
                </p>
              </div>
              <p className="m-0 mt-1 text-sm text-muted">
                {CANCELLATION_PLAN_LABELS[row.plan]}
                {" · "}
                {formatTenureDays(row.tenureDays)}
                {" · "}
                {reasonPillLabel(row.reason)}
              </p>
              {row.comment ? (
                <p className="m-0 mt-2 text-sm leading-relaxed text-ink">« {row.comment} »</p>
              ) : null}
            </li>
          ))}
        </ul>
        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <caption className="sr-only">Les 20 résiliations les plus récentes</caption>
            <thead>
              <tr className="border-b border-line text-muted">
                <th scope="col" className="pb-3 pr-3 font-medium">Date</th>
                <th scope="col" className="pb-3 pr-3 font-medium">Élève</th>
                <th scope="col" className="pb-3 pr-3 font-medium">Plan</th>
                <th scope="col" className="pb-3 pr-3 font-medium">Durée</th>
                <th scope="col" className="pb-3 pr-3 font-medium">Motif</th>
                <th scope="col" className="pb-3 font-medium">Un mot laissé</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((row, index) => (
                <tr key={`${row.cancelledAt}-${index}`} className="border-b border-line last:border-b-0">
                  <td className="whitespace-nowrap py-3.5 pr-3 text-ink">
                    {formatDepartureDate(new Date(row.cancelledAt))}
                  </td>
                  <td className="max-w-[12rem] truncate py-3.5 pr-3 text-ink" title={row.student}>
                    {row.student}
                  </td>
                  <td className="whitespace-nowrap py-3.5 pr-3 text-ink">
                    {CANCELLATION_PLAN_LABELS[row.plan]}
                  </td>
                  <td className="whitespace-nowrap py-3.5 pr-3 text-ink">
                    {formatTenureDays(row.tenureDays)}
                  </td>
                  <td className="py-3.5 pr-3">
                    <span className="inline-flex items-center rounded-full border border-line px-2.5 py-1 text-xs text-ink">
                      {reasonPillLabel(row.reason)}
                    </span>
                  </td>
                  <td className="max-w-[16rem] py-3.5 text-ink">
                    {row.comment ? (
                      <span className="line-clamp-2" title={row.comment}>
                        « {row.comment} »
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function ChurnEmpty({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-[14px] border border-line bg-surface px-6 py-16 text-center">
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-line text-ink">
        <UserMinus size={22} strokeWidth={1.75} aria-hidden />
      </span>
      <h2 className="mt-5 text-[28px] leading-tight text-ink">{title}</h2>
      <p className="mt-2 text-sm text-muted">{body}</p>
    </section>
  );
}
