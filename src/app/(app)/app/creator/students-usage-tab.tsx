"use client";

import { CircleCheck, Layers, UserRound, WholeWord } from "lucide-react";
import { formatCount } from "@/lib/cancellation";
import { formatPercent, parseUsageReport, type ShareRow, type UsageReport } from "@/lib/creator-students";
import { ErrorNote, KpiCard, LoadingNote, cardClass } from "./creator-ui";
import { useCreatorResource } from "./use-creator-resource";

export function StudentsUsageTab() {
  const { data, loading, error } = useCreatorResource(
    "/api/creator/students/usage",
    parseUsageReport,
    "Impossible de charger l'usage de l'app.",
  );

  if (loading && !data) return <LoadingNote>Chargement…</LoadingNote>;
  if (!data) return <ErrorNote>{error ?? "Impossible de charger l'usage de l'app."}</ErrorNote>;
  if (data.studentCount === 0) {
    return (
      <div>
        <UsageHeading />
        <div className="mt-5 rounded-[14px] border border-line bg-surface px-6 py-14 text-center">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-line text-ink">
            <UserRound size={22} strokeWidth={1.75} aria-hidden />
          </span>
          <p className="mt-4 text-sm text-muted">Aucun élève pour le moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <ErrorNote>{error}</ErrorNote> : null}
      <UsageHeading period={data.periodLabel} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <KpiCard icon={Layers} label="Sessions" value={formatCount(data.sessions.value)} hint={data.sessions.hint} />
        <KpiCard icon={WholeWord} label="Mots révisés" value={formatCount(data.words.value)} hint={data.words.hint} />
        <KpiCard
          icon={CircleCheck}
          label="Réussite en dictée"
          value={data.dictation.percent == null ? "Non disponible" : formatPercent(data.dictation.percent)}
          hint={data.dictation.hint}
          valueClassName={data.dictation.percent == null ? "text-[28px]" : "text-[40px]"}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ShareCard
          title="Modes de révision"
          caption="Part des sessions"
          rows={data.modes}
          empty="Aucune session sur les 7 derniers jours."
        />
        <ShareCard
          title="Langues les plus travaillées"
          caption="Part des mots révisés"
          rows={data.languages}
          empty="Aucun mot révisé sur les 7 derniers jours."
        />
      </div>
      <GoalsCard report={data} />
    </div>
  );
}

function UsageHeading({ period }: { period?: string }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-[28px] leading-tight text-ink">Usage de l&apos;app</h2>
        <p className="mt-1 text-sm text-muted">Comment les élèves utilisent l&apos;app.</p>
      </div>
      {period ? (
        <span className="inline-flex min-h-11 items-center self-start rounded-full border border-line bg-surface px-4 text-sm text-ink">
          {period}
        </span>
      ) : null}
    </div>
  );
}

function ShareCard({
  title,
  caption,
  rows,
  empty,
}: {
  title: string;
  caption: string;
  rows: ShareRow[];
  empty: string;
}) {
  return (
    <section className={`${cardClass} px-5 py-5`}>
      <h3 className="text-[22px] text-ink">{title}</h3>
      <p className="mt-1 text-sm text-muted">{caption}</p>
      {rows.length === 0 ? (
        <p className="mb-0 mt-5 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-5 grid gap-4">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 sm:hidden">
                <p className="m-0 text-sm text-ink">{row.label}</p>
                <p className="m-0 text-sm tabular-nums text-ink">{formatPercent(row.percent)}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="m-0 hidden w-28 shrink-0 text-sm text-ink sm:block">{row.label}</p>
                <div
                  className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--background-subtle)]"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={row.percent}
                  aria-label={row.label}
                >
                  <div className="h-full rounded-full bg-ink" style={{ width: `${row.percent}%` }} />
                </div>
                <p className="m-0 hidden w-14 shrink-0 text-right text-sm tabular-nums text-ink sm:block">
                  {formatPercent(row.percent)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function GoalsCard({ report }: { report: UsageReport }) {
  const { goals } = report;
  return (
    <section className={`${cardClass} px-5 py-5`}>
      <h3 className="text-[22px] text-ink">Objectifs hebdomadaires atteints</h3>
      <p className="mt-1 text-sm text-muted">
        Part des élèves actifs qui tiennent leur objectif, semaine après semaine
      </p>
      {goals.percent == null ? (
        <p className="mb-0 mt-5 text-sm text-muted">Aucun élève actif cette semaine.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="m-0 font-heading text-[64px] leading-none tracking-tight text-ink">
              <span className="marker">{formatPercent(goals.percent)}</span>
            </p>
            <p className="m-0 mt-3 max-w-xs text-sm text-ink">
              des élèves actifs ont atteint leur objectif cette semaine
            </p>
          </div>
          <div
            className="flex h-36 items-end"
            role="img"
            aria-label={`Cette semaine : ${formatPercent(goals.percent)} des élèves actifs`}
          >
            <div className="flex w-16 flex-col items-center gap-2">
              <div className="flex h-24 w-8 items-end">
                <div
                  className="w-full rounded-t-md bg-ink"
                  style={{ height: `${Math.max(goals.percent, goals.percent === 0 ? 4 : 8)}%` }}
                />
              </div>
              <p className="m-0 text-center text-xs text-muted">Cette semaine</p>
            </div>
          </div>
        </div>
      )}
      {goals.mostChosenLabel ? <p className="mb-0 mt-5 text-sm text-ink">{goals.mostChosenLabel}</p> : null}
      <p className="mb-0 mt-3 text-sm text-muted">{goals.historyNote}</p>
    </section>
  );
}
