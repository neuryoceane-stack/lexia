"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { BadgeCheck, Plus, Ticket, Users, X } from "lucide-react";
import {
  formatPromoCount,
  isPromoBenefitType,
  type PromoBenefitType,
} from "@/lib/promo-codes";
import { PromoDialog } from "./promo-dialog";
import {
  ErrorNote,
  KpiCard,
  LoadingNote,
  cardClass,
  primaryButtonClass,
} from "./creator-ui";

type PromoCodeItem = {
  id: string;
  code: string;
  benefitType: PromoBenefitType;
  label: string;
  advantage: string;
  institution: string | null;
  usesLabel: string;
  inscrits: number;
  abonnes: number;
  endsLabel: string;
  expired: boolean;
  active: boolean;
};

type PromoSummary = {
  activeCodes: number;
  signups: number;
  subscribers: number;
  conversionPercent: number | null;
};

type PromoDashboard = {
  summary: PromoSummary;
  codes: PromoCodeItem[];
};

export function PromoSection() {
  const [data, setData] = useState<PromoDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/creator/promo", { signal });
      const body: unknown = await response.json().catch(() => null);
      if (signal?.aborted) return;
      if (!response.ok) {
        setError(readError(body, "Impossible de charger les codes promo."));
        return;
      }
      const parsed = parseDashboard(body);
      if (!parsed) {
        setError("Impossible de charger les codes promo.");
        return;
      }
      setData(parsed);
      setError(null);
    } catch (cause) {
      if (signal?.aborted || (cause instanceof DOMException && cause.name === "AbortError")) return;
      setError("Impossible de charger les codes promo.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function toggle(item: PromoCodeItem) {
    if (!data || pendingId) return;
    const next = !item.active;
    const previous = data;
    setPendingId(item.id);
    setError(null);
    setData({
      ...data,
      summary: {
        ...data.summary,
        activeCodes: data.summary.activeCodes + (next ? 1 : -1),
      },
      codes: data.codes.map((code) => (code.id === item.id ? { ...code, active: next } : code)),
    });
    try {
      const response = await fetch(`/api/creator/promo/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: next }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setData(previous);
        setError(readError(body, "Le code n'a pas pu être mis à jour."));
      }
    } catch {
      setData(previous);
      setError("Le code n'a pas pu être mis à jour.");
    } finally {
      setPendingId(null);
    }
  }

  if (loading && !data) return <LoadingNote>Chargement des codes promo…</LoadingNote>;
  if (!data) {
    return <ErrorNote>{error ?? "Impossible de charger les codes promo."}</ErrorNote>;
  }

  const conversion =
    data.summary.conversionPercent == null
      ? "—"
      : `${formatPromoCount(data.summary.conversionPercent)}\u00a0%`;
  const conversionHint =
    data.summary.signups === 0
      ? "Aucun inscrit avec un code"
      : `${formatPromoCount(data.summary.subscribers)} sur ${formatPromoCount(data.summary.signups)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="m-0 text-[28px] leading-tight text-ink">Codes promo</h2>
          <p className="m-0 mt-1 max-w-xl text-sm text-muted">
            Créez un code, puis suivez les inscriptions et les passages à l&apos;abonnement.
          </p>
        </div>
        <button type="button" onClick={() => setDialogOpen(true)} className={primaryButtonClass}>
          <Plus size={16} aria-hidden />
          Nouveau code
        </button>
      </div>

      {error ? <ErrorNote>{error}</ErrorNote> : null}
      {notice ? (
        <p role="status" className="m-0 rounded-[14px] bg-mark px-4 py-3 text-sm font-medium text-ink">
          {notice}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard icon={Ticket} label="Codes actifs" value={formatPromoCount(data.summary.activeCodes)} />
        <KpiCard
          icon={Users}
          label="Inscriptions avec un code"
          value={formatPromoCount(data.summary.signups)}
        />
        <KpiCard
          icon={BadgeCheck}
          label="Passés à l'abonnement"
          value={conversion}
          hint={conversionHint}
        />
      </div>

      <section className={cardClass}>
        <h3 className="m-0 px-4 py-4 text-[22px] text-ink sm:px-5">Tous les codes</h3>
        {data.codes.length === 0 ? (
          <div className="border-t border-line px-6 py-14 text-center">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-line text-ink">
              <Ticket size={22} strokeWidth={1.75} aria-hidden />
            </span>
            <p className="m-0 mt-4 text-sm text-muted">Aucun code promo pour le moment.</p>
          </div>
        ) : (
          <>
            <ul className="m-0 list-none border-t border-line p-0 md:hidden">
              {data.codes.map((item) => (
                <li key={item.id} className="border-b border-line px-4 py-4 last:border-b-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="m-0 font-medium tracking-wide text-ink">{item.code}</p>
                      <p className="m-0 mt-1 text-sm text-ink" title={item.label}>
                        {item.advantage}
                      </p>
                      <p className="m-0 mt-1 text-sm text-muted">{item.institution ?? "—"}</p>
                    </div>
                    <ActiveSwitch
                      code={item.code}
                      active={item.active}
                      disabled={pendingId !== null}
                      onToggle={() => void toggle(item)}
                    />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                    <Stat label="Utilisations" value={item.usesLabel} />
                    <Stat label="Inscrits" value={formatPromoCount(item.inscrits)} />
                    <Stat label="Abonnés" value={formatPromoCount(item.abonnes)} />
                    <Stat label="Fin" value={<EndLabel item={item} />} />
                  </dl>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto border-t border-line md:block">
              <table className="w-full min-w-[760px] text-sm">
                <caption className="sr-only">Liste des codes promo</caption>
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th scope="col" className="px-4 py-3 font-medium">Code</th>
                    <th scope="col" className="px-3 py-3 font-medium">Avantage</th>
                    <th scope="col" className="px-3 py-3 font-medium">Établissement</th>
                    <th scope="col" className="px-3 py-3 font-medium">Utilisations</th>
                    <th scope="col" className="px-3 py-3 font-medium">Inscrits</th>
                    <th scope="col" className="px-3 py-3 font-medium">Abonnés</th>
                    <th scope="col" className="px-3 py-3 font-medium">Fin</th>
                    <th scope="col" className="px-3 py-3 font-medium">Actif</th>
                  </tr>
                </thead>
                <tbody>
                  {data.codes.map((item) => (
                    <tr key={item.id} className="border-t border-line">
                      <td className="px-4 py-2 font-medium tracking-wide text-ink">{item.code}</td>
                      <td className="px-3 py-2 text-ink" title={item.label}>
                        {item.advantage}
                      </td>
                      <td className="max-w-[180px] truncate px-3 py-2 text-muted" title={item.institution ?? undefined}>
                        {item.institution ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 tabular-nums text-ink">{item.usesLabel}</td>
                      <td className="px-3 py-2 tabular-nums text-ink">{formatPromoCount(item.inscrits)}</td>
                      <td className="px-3 py-2 tabular-nums text-ink">{formatPromoCount(item.abonnes)}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <EndLabel item={item} />
                      </td>
                      <td className="px-3 py-1">
                        <ActiveSwitch
                          code={item.code}
                          active={item.active}
                          disabled={pendingId !== null}
                          onToggle={() => void toggle(item)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <PromoDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={(couponReady) => {
          setDialogOpen(false);
          setNotice(
            couponReady
              ? null
              : "Code créé. Le coupon Stripe sera préparé au premier paiement.",
          );
          void load();
        }}
      />
    </div>
  );
}

function EndLabel({ item }: { item: PromoCodeItem }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="text-muted">{item.endsLabel}</span>
      {item.expired ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-false-text">
          <X size={12} stroke="var(--false-sign)" aria-hidden />
          Expiré
        </span>
      ) : null}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="m-0 text-ink">{value}</dd>
    </div>
  );
}

function ActiveSwitch({
  code,
  active,
  disabled,
  onToggle,
}: {
  code: string;
  active: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={active ? `Désactiver le code ${code}` : `Activer le code ${code}`}
      disabled={disabled}
      onClick={onToggle}
      className="inline-flex h-11 w-[52px] shrink-0 items-center justify-center border-0 bg-transparent p-0 outline-none focus-visible:rounded-full focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-wait"
    >
      <span
        aria-hidden
        className="flex h-[26px] w-[46px] items-center rounded-full border-[1.5px] border-ink px-0.5"
        style={{
          justifyContent: active ? "flex-end" : "flex-start",
          background: active ? "var(--ink)" : "var(--surface)",
        }}
      >
        <span
          className="block h-[18px] w-[18px] rounded-full"
          style={{ background: active ? "var(--surface)" : "var(--ink)" }}
        />
      </span>
    </button>
  );
}

function parseDashboard(data: unknown): PromoDashboard | null {
  if (!isRecord(data) || !isRecord(data.summary) || !Array.isArray(data.codes)) return null;
  const activeCodes = num(data.summary.activeCodes);
  const signups = num(data.summary.signups);
  const subscribers = num(data.summary.subscribers);
  const conversion = data.summary.conversionPercent;
  const conversionPercent =
    conversion == null ? null : num(conversion);
  if (
    activeCodes === null ||
    signups === null ||
    subscribers === null ||
    (conversion != null && conversionPercent === null)
  ) {
    return null;
  }

  const codes: PromoCodeItem[] = [];
  for (const row of data.codes) {
    if (!isRecord(row) || typeof row.id !== "string" || typeof row.code !== "string") return null;
    if (!isPromoBenefitType(row.benefitType)) return null;
    if (typeof row.label !== "string" || typeof row.advantage !== "string") return null;
    if (typeof row.usesLabel !== "string" || typeof row.endsLabel !== "string") return null;
    if (typeof row.expired !== "boolean" || typeof row.active !== "boolean") return null;
    const institution = row.institution == null ? null : typeof row.institution === "string" ? row.institution : null;
    if (row.institution != null && institution == null) return null;
    const inscrits = num(row.inscrits);
    const abonnes = num(row.abonnes);
    if (inscrits === null || abonnes === null) return null;
    codes.push({
      id: row.id,
      code: row.code,
      benefitType: row.benefitType,
      label: row.label,
      advantage: row.advantage,
      institution,
      usesLabel: row.usesLabel,
      inscrits,
      abonnes,
      endsLabel: row.endsLabel,
      expired: row.expired,
      active: row.active,
    });
  }

  return {
    summary: { activeCodes, signups, subscribers, conversionPercent },
    codes,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readError(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
    return body.error;
  }
  return fallback;
}
