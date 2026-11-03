"use client";

import { useCallback, useState } from "react";
import {
  AlertTriangle,
  Check,
  Circle,
  Database,
  Mail,
  Sparkles,
  CreditCard,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  ErrorNote,
  LoadingNote,
  KpiCard,
  formatRelativeFr,
  isRecord,
  cardClass,
} from "./creator-ui";
import { useCreatorResource } from "./use-creator-resource";
import { EMAIL_TYPE_LABELS, type EmailEventTypeLabel } from "@/lib/email-event-labels";

type ReviewStatus = "new" | "to_check" | "fixed";

type TechHealthData = {
  tablesReady: boolean;
  database: { operational: boolean; label: string };
  payments: { label: string };
  emailsService: { label: string };
  ai: { label: string };
  kpis: {
    errors24h: number;
    newSinceYesterday: number;
    emailsSent7d: number;
    emailFailures7d: number;
  };
  errors: {
    items: {
      id: string;
      lastSeenAt: string;
      route: string;
      method: string | null;
      message: string;
      occurrences: number;
      reviewStatus: ReviewStatus;
    }[];
    total: number;
  };
  emailFailures: {
    items: {
      id: string;
      createdAt: string;
      toEmail: string;
      type: string;
      error: string | null;
    }[];
    total: number;
  };
};

const PAGE_SIZE = 20;

function parseTechHealth(data: unknown): TechHealthData | null {
  if (!isRecord(data)) return null;
  if (!isRecord(data.database) || !isRecord(data.kpis)) return null;
  if (!isRecord(data.errors) || !Array.isArray(data.errors.items)) return null;
  if (!isRecord(data.emailFailures) || !Array.isArray(data.emailFailures.items)) return null;

  const errorsItems: TechHealthData["errors"]["items"] = [];
  for (const row of data.errors.items) {
    if (!isRecord(row)) return null;
    const reviewStatus =
      row.reviewStatus === "new" || row.reviewStatus === "to_check" || row.reviewStatus === "fixed"
        ? row.reviewStatus
        : null;
    if (
      !reviewStatus ||
      typeof row.id !== "string" ||
      typeof row.lastSeenAt !== "string" ||
      typeof row.route !== "string" ||
      typeof row.message !== "string" ||
      typeof row.occurrences !== "number"
    ) {
      return null;
    }
    errorsItems.push({
      id: row.id,
      lastSeenAt: row.lastSeenAt,
      route: row.route,
      method: typeof row.method === "string" ? row.method : null,
      message: row.message,
      occurrences: row.occurrences,
      reviewStatus,
    });
  }

  const emailItems = [];
  for (const row of data.emailFailures.items) {
    if (!isRecord(row)) return null;
    if (
      typeof row.id !== "string" ||
      typeof row.createdAt !== "string" ||
      typeof row.toEmail !== "string" ||
      typeof row.type !== "string"
    ) {
      return null;
    }
    emailItems.push({
      id: row.id,
      createdAt: row.createdAt,
      toEmail: row.toEmail,
      type: row.type,
      error: typeof row.error === "string" ? row.error : null,
    });
  }

  return {
    tablesReady: data.tablesReady === true,
    database: {
      operational: data.database.operational === true,
      label: typeof data.database.label === "string" ? data.database.label : "—",
    },
    payments: {
      label: isRecord(data.payments) && typeof data.payments.label === "string" ? data.payments.label : "—",
    },
    emailsService: {
      label:
        isRecord(data.emailsService) && typeof data.emailsService.label === "string"
          ? data.emailsService.label
          : "—",
    },
    ai: {
      label: isRecord(data.ai) && typeof data.ai.label === "string" ? data.ai.label : "—",
    },
    kpis: {
      errors24h: typeof data.kpis.errors24h === "number" ? data.kpis.errors24h : 0,
      newSinceYesterday:
        typeof data.kpis.newSinceYesterday === "number" ? data.kpis.newSinceYesterday : 0,
      emailsSent7d: typeof data.kpis.emailsSent7d === "number" ? data.kpis.emailsSent7d : 0,
      emailFailures7d:
        typeof data.kpis.emailFailures7d === "number" ? data.kpis.emailFailures7d : 0,
    },
    errors: {
      items: errorsItems,
      total: typeof data.errors.total === "number" ? data.errors.total : errorsItems.length,
    },
    emailFailures: {
      items: emailItems,
      total:
        typeof data.emailFailures.total === "number" ? data.emailFailures.total : emailItems.length,
    },
  };
}

function ServiceTile({
  icon: Icon,
  title,
  status,
  warn,
}: {
  icon: LucideIcon;
  title: string;
  status: string;
  warn?: boolean;
}) {
  return (
    <article className={`${cardClass} flex flex-col gap-3 px-5 py-5`}>
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-ink">
          <Icon size={18} strokeWidth={1.75} aria-hidden />
        </span>
        <h3 className="m-0 text-sm font-medium text-ink">{title}</h3>
      </div>
      <p className="m-0 flex items-center gap-2 text-sm text-muted">
        {!warn ? (
          <Check size={16} stroke="var(--just-sign)" aria-hidden />
        ) : (
          <AlertTriangle size={16} stroke="var(--false-sign)" aria-hidden />
        )}
        <span className={warn ? "font-medium text-ink" : undefined}>{status}</span>
      </p>
    </article>
  );
}

function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  if (status === "fixed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-line bg-page px-3 py-1 text-xs font-medium text-muted">
        <Check size={12} aria-hidden />
        Corrigée
      </span>
    );
  }
  if (status === "to_check") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-mark px-3 py-1 text-xs font-medium text-ink">
        <Circle size={10} fill="currentColor" aria-hidden />
        À examiner
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-ink bg-surface px-3 py-1 text-xs font-medium text-ink">
      Nouvelle
    </span>
  );
}

function emailTypeLabel(type: string): string {
  if (type in EMAIL_TYPE_LABELS) {
    return EMAIL_TYPE_LABELS[type as EmailEventTypeLabel];
  }
  return EMAIL_TYPE_LABELS.other;
}

export function TechHealthSection() {
  const [errorsLimit, setErrorsLimit] = useState(PAGE_SIZE);
  const [emailLimit, setEmailLimit] = useState(PAGE_SIZE);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const buildUrl = useCallback(
    () =>
      `/api/creator/tech-health?errorsLimit=${errorsLimit}&errorsOffset=0&emailLimit=${emailLimit}&emailOffset=0`,
    [errorsLimit, emailLimit],
  );

  const { data, setData, loading, error } = useCreatorResource(
    buildUrl(),
    parseTechHealth,
    "Impossible de charger la santé technique.",
  );

  async function handleReviewChange(id: string, reviewStatus: ReviewStatus) {
    setUpdatingId(id);
    setStatusError(null);
    try {
      const res = await fetch("/api/creator/tech-health", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, reviewStatus }),
      });
      if (!res.ok) {
        setStatusError("Le statut n'a pas pu être mis à jour.");
        return;
      }
      setData((prev) =>
        prev
          ? {
              ...prev,
              errors: {
                ...prev.errors,
                items: prev.errors.items.map((item) =>
                  item.id === id ? { ...item, reviewStatus } : item,
                ),
              },
            }
          : prev,
      );
    } catch {
      setStatusError("Le statut n'a pas pu être mis à jour.");
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading && !data) return <LoadingNote>Chargement…</LoadingNote>;
  if (!data) return <ErrorNote>{error ?? "Impossible de charger la santé technique."}</ErrorNote>;

  const paymentsWarn =
    data.tablesReady && !data.payments.label.startsWith("Aucune") && data.payments.label !== "—";
  const emailsWarn =
    data.tablesReady &&
    !data.emailsService.label.startsWith("Aucun") &&
    data.emailsService.label !== "—";
  const aiWarn =
    data.tablesReady && !data.ai.label.startsWith("Aucune") && data.ai.label !== "—";

  return (
    <div className="space-y-8">
      {error ? <ErrorNote>{error}</ErrorNote> : null}
      {statusError ? <ErrorNote>{statusError}</ErrorNote> : null}

      <header>
        <h2 className="font-heading text-[28px] font-bold leading-tight text-ink">Santé technique</h2>
        <p className="mt-1 text-sm text-muted">Ce qui fonctionne, ce qui casse.</p>
      </header>

      <section aria-labelledby="services-heading">
        <h3 id="services-heading" className="mb-3 text-sm font-medium text-ink">
          État des services
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ServiceTile
            icon={Database}
            title="Base de données"
            status={data.database.label}
            warn={!data.database.operational}
          />
          <ServiceTile icon={CreditCard} title="Paiements" status={data.payments.label} warn={paymentsWarn} />
          <ServiceTile icon={Mail} title="E-mails" status={data.emailsService.label} warn={emailsWarn} />
          <ServiceTile icon={Sparkles} title="IA (imports)" status={data.ai.label} warn={aiWarn} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <KpiCard
          icon={AlertTriangle}
          label="Erreurs (24 h)"
          value={String(data.kpis.errors24h)}
          hint={
            data.kpis.newSinceYesterday > 0
              ? `${data.kpis.newSinceYesterday} nouvelle${data.kpis.newSinceYesterday > 1 ? "s" : ""} depuis hier`
              : undefined
          }
        />
        <KpiCard icon={Mail} label="E-mails envoyés (7 jours)" value={String(data.kpis.emailsSent7d)} />
        <KpiCard
          icon={XCircle}
          label="Échecs d'envoi"
          value={String(data.kpis.emailFailures7d)}
          hint={data.kpis.emailFailures7d > 0 ? "à renvoyer" : undefined}
        />
      </section>

      <section className={`${cardClass} overflow-hidden`} aria-labelledby="errors-table-heading">
        <div className="border-b border-line px-5 py-4">
          <h3 id="errors-table-heading" className="m-0 font-heading text-lg font-bold text-ink">
            Erreurs récentes
          </h3>
          <p className="mb-0 mt-1 text-sm text-muted">Les plus fréquentes en premier.</p>
        </div>
        {data.errors.items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">Aucune erreur enregistrée.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-medium text-muted">
                  <th className="px-5 py-3 font-medium">Quand</th>
                  <th className="px-5 py-3 font-medium">Où</th>
                  <th className="px-5 py-3 font-medium">Message</th>
                  <th className="px-5 py-3 font-medium">Fois</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {data.errors.items.map((row) => (
                  <tr key={row.id} className="border-b border-line last:border-b-0">
                    <td className="whitespace-nowrap px-5 py-3 text-muted">
                      <time dateTime={row.lastSeenAt}>{formatRelativeFr(row.lastSeenAt)}</time>
                    </td>
                    <td className="max-w-[180px] px-5 py-3 font-mono text-xs text-ink">
                      {row.method ? `${row.method} ` : ""}
                      {row.route}
                    </td>
                    <td className="max-w-xs px-5 py-3 text-ink">{row.message}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-ink">{row.occurrences}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <ReviewStatusBadge status={row.reviewStatus} />
                        <select
                          aria-label="Changer le statut de l'erreur"
                          className="min-h-11 rounded-full border border-line bg-surface px-3 text-xs text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink"
                          value={row.reviewStatus}
                          disabled={updatingId === row.id}
                          onChange={(event) =>
                            handleReviewChange(row.id, event.target.value as ReviewStatus)
                          }
                        >
                          <option value="new">Nouvelle</option>
                          <option value="to_check">À examiner</option>
                          <option value="fixed">Corrigée</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data.errors.total > data.errors.items.length ? (
          <div className="border-t border-line px-5 py-4">
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-full border border-ink bg-surface px-4 text-sm font-medium text-ink outline-none hover:bg-page focus-visible:ring-2 focus-visible:ring-ink"
              onClick={() => setErrorsLimit((value) => value + PAGE_SIZE)}
            >
              Afficher plus
            </button>
          </div>
        ) : null}
      </section>

      <section className={`${cardClass} overflow-hidden`} aria-labelledby="email-failures-heading">
        <div className="border-b border-line px-5 py-4">
          <h3 id="email-failures-heading" className="m-0 font-heading text-lg font-bold text-ink">
            Échecs d&apos;envoi d&apos;e-mails
          </h3>
          <p className="mb-0 mt-1 text-sm text-muted">Rappels, mots de passe oubliés, bilans.</p>
        </div>
        {data.emailFailures.items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">Aucun échec d&apos;envoi enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-medium text-muted">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Destinataire</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Raison</th>
                </tr>
              </thead>
              <tbody>
                {data.emailFailures.items.map((row) => (
                  <tr key={row.id} className="border-b border-line last:border-b-0">
                    <td className="whitespace-nowrap px-5 py-3 text-muted">
                      <time dateTime={row.createdAt}>{formatRelativeFr(row.createdAt)}</time>
                    </td>
                    <td className="px-5 py-3 text-ink">{row.toEmail}</td>
                    <td className="px-5 py-3 text-ink">{emailTypeLabel(row.type)}</td>
                    <td className="max-w-xs px-5 py-3 text-muted">{row.error ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data.emailFailures.total > data.emailFailures.items.length ? (
          <div className="border-t border-line px-5 py-4">
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-full border border-ink bg-surface px-4 text-sm font-medium text-ink outline-none hover:bg-page focus-visible:ring-2 focus-visible:ring-ink"
              onClick={() => setEmailLimit((value) => value + PAGE_SIZE)}
            >
              Afficher plus
            </button>
          </div>
        ) : null}
      </section>

      {!data.tablesReady ? (
        <p className="text-xs text-muted">
          Les tables de journalisation ne sont pas encore disponibles : les listes resteront vides
          jusqu&apos;à l&apos;application du schéma SQL.
        </p>
      ) : null}
    </div>
  );
}
