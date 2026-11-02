"use client";

import { useEffect, useState } from "react";
import { Check, CreditCard, Sparkles, Ticket, X } from "lucide-react";
import { BackLink } from "@/components/back-link";
import { BRAND_NAME } from "@/lib/brand";
import { openBillingPortal, startSubscriptionCheckout } from "@/lib/subscription-client";
import { CancelSubscriptionModal } from "./cancel-subscription-modal";
import {
  PROMO_WRONG_PLAN,
  type PromoBenefitType,
} from "@/lib/promo-codes";
import {
  OFFER_MINOR_NOTICE,
  OFFER_MONTHLY_DETAIL,
  OFFER_MONTHLY_EUROS,
  OFFER_MONTHLY_LABEL,
  OFFER_MONTHLY_PERIOD,
  OFFER_TRIAL_CARD_LABEL,
  OFFER_YEARLY_BADGE,
  OFFER_YEARLY_DETAIL,
  OFFER_YEARLY_EUROS,
  OFFER_YEARLY_LABEL,
  OFFER_YEARLY_PERIOD,
  OFFER_YEARLY_PER_MONTH_LABEL,
  formatOfferEuros,
} from "@/lib/offer";
import {
  subscribedIntro,
  subscriptionDisplay,
  subscriptionOfferIntro,
  subscriptionUnavailableCopy,
  type BillingPlan,
  type SubscriptionView,
} from "@/lib/subscription";

const INK = "var(--ink)";
const MARK = "var(--mark)";
const SURFACE = "var(--surface)";
const TEXT = "var(--ink)";
const MUTED = "var(--muted)";
const LINE = "var(--line)";

type CheckoutResult = "success" | "cancel" | null;

export function AbonnementClient({
  initial,
  checkout,
  confirmationError,
}: {
  initial: SubscriptionView;
  checkout: CheckoutResult;
  confirmationError: string | null;
}) {
  const [view, setView] = useState(initial);
  const [pendingPlan, setPendingPlan] = useState<BillingPlan | null>(null);
  const [portalPending, setPortalPending] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [error, setError] = useState<string | null>(confirmationError);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);

  useEffect(() => {
    setView(initial);
  }, [initial]);

  async function subscribe(plan: BillingPlan) {
    setError(null);
    if (appliedPromo) {
      const allowed = plan === "monthly" ? appliedPromo.appliesMonthly : appliedPromo.appliesAnnual;
      if (!allowed) {
        setError(PROMO_WRONG_PLAN);
        return;
      }
    }
    setPendingPlan(plan);
    try {
      await startSubscriptionCheckout(plan, appliedPromo?.code);
    } catch (cause) {
      setPendingPlan(null);
      setError(cause instanceof Error ? cause.message : "Impossible de démarrer le paiement.");
    }
  }

  async function manage() {
    setError(null);
    setPortalPending(true);
    try {
      await openBillingPortal();
    } catch (cause) {
      setPortalPending(false);
      setError(cause instanceof Error ? cause.message : "Impossible d'ouvrir le portail de gestion.");
    }
  }

  const checkoutOpen = view.billingConfigured && view.canSubscribe;
  const portalOpen = view.billingConfigured && view.canManagePortal;
  const canCancel =
    portalOpen &&
    !view.cancelAtPeriodEnd &&
    (view.status === "active" || view.status === "trialing" || view.status === "past_due");
  const intro =
    !view.billingConfigured && view.canSubscribe
      ? subscriptionUnavailableCopy()
      : view.canSubscribe
        ? subscriptionOfferIntro(
            view.includesTrial,
            appliedPromo?.benefitType === "extended_trial" ? appliedPromo.label : undefined,
          )
        : subscribedIntro();

  return (
    <div className="mx-auto max-w-[760px]">
      <BackLink href="/app/parametres">Paramètres</BackLink>

      <header className="mb-6">
        <p style={{ fontSize: 13, fontWeight: 500, color: INK, marginBottom: 6 }}>{BRAND_NAME}</p>
        <h1 style={{ fontFamily: "DM Sans, sans-serif", fontSize: 28, fontWeight: 500, color: TEXT, margin: 0 }}>
          Ton abonnement
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.55, color: MUTED, marginTop: 8, maxWidth: 560 }}>
          {intro}
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.5, color: MUTED, marginTop: 10, maxWidth: 560 }}>
          {OFFER_MINOR_NOTICE}
        </p>
      </header>

      {checkout === "cancel" ? (
        <Notice tone="gold">
          Le paiement a été annulé. Aucun montant n&apos;a été débité.
        </Notice>
      ) : null}

      {checkout === "success" && !confirmationError && !view.canSubscribe ? (
        <Notice tone="green">
          {view.cancelAtPeriodEnd
            ? "Ta résiliation est programmée. Tu gardes l'accès jusqu'à la fin de la période en cours."
            : view.status === "trialing"
              ? "Ton essai est lancé. Le premier prélèvement aura lieu à la fin de l'essai, sauf résiliation."
              : "Ton abonnement est enregistré."}
        </Notice>
      ) : null}

      {checkout === "success" && !confirmationError && view.canSubscribe ? (
        <Notice tone="gold">
          Le paiement est revenu, mais aucun abonnement actif n&apos;est associé à ton compte.
        </Notice>
      ) : null}

      <StatusCard view={view} />

      {checkoutOpen ? (
        <PromoCodeBox
          applied={appliedPromo}
          onApplied={(promo) => {
            setAppliedPromo(promo);
            setError(null);
          }}
          onClear={() => {
            setAppliedPromo(null);
            setError(null);
          }}
        />
      ) : null}

      {checkoutOpen ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <PlanCard
            title={OFFER_MONTHLY_LABEL}
            amount={formatOfferEuros(OFFER_MONTHLY_EUROS)}
            period={OFFER_MONTHLY_PERIOD}
            detail={OFFER_MONTHLY_DETAIL}
            cta={view.includesTrial ? "Commencer l'essai" : "S'abonner"}
            pending={pendingPlan === "monthly"}
            disabled={pendingPlan !== null}
            onSubscribe={() => void subscribe("monthly")}
          />
          <PlanCard
            title={OFFER_YEARLY_LABEL}
            amount={formatOfferEuros(OFFER_YEARLY_EUROS)}
            perMonth={OFFER_YEARLY_PER_MONTH_LABEL}
            period={OFFER_YEARLY_PERIOD}
            detail={OFFER_YEARLY_DETAIL}
            highlighted
            badge={OFFER_YEARLY_BADGE}
            cta={view.includesTrial ? "Commencer l'essai" : "S'abonner"}
            pending={pendingPlan === "annual"}
            disabled={pendingPlan !== null}
            onSubscribe={() => void subscribe("annual")}
          />
        </div>
      ) : null}

      {!view.billingConfigured && view.canManagePortal ? (
        <p style={{ marginTop: 16, fontSize: 14, lineHeight: 1.5, color: MUTED }}>
          La gestion du paiement n&apos;est pas disponible pour le moment.
        </p>
      ) : null}

      {canCancel && view.status === "past_due" ? (
        <PortalButton pending={portalPending} onClick={() => void manage()} label="Gérer mon abonnement" filled />
      ) : null}

      {canCancel ? (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setCancelOpen(true);
          }}
          className="mt-5 flex min-h-11 w-full items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
          style={{
            background: SURFACE,
            color: INK,
            border: `1.5px solid ${INK}`,
            borderRadius: 999,
            padding: "12px 18px",
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Résilier mon abonnement
        </button>
      ) : null}

      {portalOpen && canCancel && view.status !== "past_due" ? (
        <button
          type="button"
          onClick={() => void manage()}
          disabled={portalPending}
          className="mx-auto mt-3 flex min-h-11 items-center justify-center gap-2 px-3 text-sm font-medium text-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-wait"
        >
          <CreditCard size={16} aria-hidden />
          {portalPending ? "Ouverture du portail…" : "Gérer la facturation"}
        </button>
      ) : null}

      {portalOpen && !canCancel ? (
        <PortalButton pending={portalPending} onClick={() => void manage()} label="Gérer mon abonnement" filled />
      ) : null}

      <CancelSubscriptionModal
        open={cancelOpen}
        trial={view.status === "trialing"}
        pastDue={view.status === "past_due"}
        periodEnd={view.currentPeriodEnd}
        onClose={() => setCancelOpen(false)}
        onConfirmed={(next) => {
          setView(next);
          setCancelOpen(false);
        }}
      />

      {error ? (
        <p role="alert" style={{ marginTop: 14, fontSize: 14, color: "var(--false-text)" }}>
          {error}
        </p>
      ) : null}

      {checkoutOpen ? (
        <ul className="mt-6 grid gap-2" style={{ listStyle: "none", padding: 0, marginBottom: 0 }}>
          {view.includesTrial ? (
            <Reassurance>
              {appliedPromo?.benefitType === "extended_trial"
                ? `${appliedPromo.label}, carte bancaire requise`
                : OFFER_TRIAL_CARD_LABEL}
            </Reassurance>
          ) : (
            <Reassurance>Carte bancaire requise, prélèvement aujourd&apos;hui</Reassurance>
          )}
          <Reassurance>
            {`${formatOfferEuros(OFFER_MONTHLY_EUROS)} par mois ou ${formatOfferEuros(OFFER_YEARLY_EUROS)} par an`}
          </Reassurance>
          <Reassurance>Résiliable à tout moment, sans frais</Reassurance>
        </ul>
      ) : null}
    </div>
  );
}

type AppliedPromo = {
  code: string;
  benefitType: PromoBenefitType;
  label: string;
  appliesMonthly: boolean;
  appliesAnnual: boolean;
  planHint: string | null;
};

function PromoCodeBox({
  applied,
  onApplied,
  onClear,
}: {
  applied: AppliedPromo | null;
  onApplied: (promo: AppliedPromo) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  async function apply(event: React.FormEvent) {
    event.preventDefault();
    setPromoError(null);
    setPending(true);
    try {
      const response = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setPromoError(readPromoError(body, "Impossible de vérifier ce code."));
        return;
      }
      const promo = parseAppliedPromo(body);
      if (!promo) {
        setPromoError("Impossible de vérifier ce code.");
        return;
      }
      onApplied(promo);
      setCode("");
      setOpen(false);
    } catch {
      setPromoError("Impossible de vérifier ce code.");
    } finally {
      setPending(false);
    }
  }

  if (applied) {
    return (
      <div
        className="mt-5"
        style={{
          background: SURFACE,
          border: `1.5px solid ${INK}`,
          borderRadius: 16,
          padding: 16,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p style={{ margin: 0, fontSize: 12, fontWeight: 500, letterSpacing: "0.04em", color: MUTED }}>
              {applied.code}
            </p>
            <p className="marker" style={{ margin: "8px 0 0", fontSize: 15, fontWeight: 500 }}>
              {applied.label}
            </p>
            {applied.planHint ? (
              <p style={{ margin: "8px 0 0", fontSize: 13, color: MUTED }}>{applied.planHint}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClear}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              minHeight: 44,
              background: SURFACE,
              color: INK,
              border: `1.5px solid ${INK}`,
              borderRadius: 999,
              padding: "0 14px",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <X size={14} aria-hidden />
            Retirer
          </button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={false}
        className="mt-5 inline-flex min-h-11 items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
        style={{
          background: "none",
          border: "none",
          padding: 0,
          color: INK,
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          textDecoration: "underline",
          textUnderlineOffset: 3,
        }}
      >
        <Ticket size={16} aria-hidden />
        Vous avez un code promo ?
      </button>
    );
  }

  return (
    <form onSubmit={(event) => void apply(event)} className="mt-5">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="promo-code-eleve">
          Code promo
        </label>
        <input
          id="promo-code-eleve"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder="Votre code"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          style={{
            flex: 1,
            minHeight: 44,
            borderRadius: 12,
            border: `1px solid ${LINE}`,
            background: SURFACE,
            color: TEXT,
            padding: "0 14px",
            fontSize: 15,
          }}
        />
        <button
          type="submit"
          disabled={pending || code.trim() === ""}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-wait"
          style={{
            minHeight: 44,
            borderRadius: 999,
            border: "none",
            background: INK,
            color: SURFACE,
            padding: "0 18px",
            fontSize: 14,
            fontWeight: 500,
            cursor: pending ? "wait" : "pointer",
            opacity: pending || code.trim() === "" ? 0.6 : 1,
          }}
        >
          {pending ? "Vérification…" : "Appliquer"}
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setPromoError(null);
        }}
        className="mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        style={{
          background: "none",
          border: "none",
          padding: 0,
          color: MUTED,
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        Fermer
      </button>
      {promoError ? (
        <p role="alert" style={{ margin: "8px 0 0", fontSize: 14, color: "var(--false-text)" }}>
          {promoError}
        </p>
      ) : null}
    </form>
  );
}

function parseAppliedPromo(body: unknown): AppliedPromo | null {
  if (!body || typeof body !== "object") return null;
  const row = body as Record<string, unknown>;
  if (typeof row.code !== "string" || typeof row.label !== "string") return null;
  if (
    row.benefitType !== "percent" &&
    row.benefitType !== "fixed_amount" &&
    row.benefitType !== "free_months" &&
    row.benefitType !== "extended_trial"
  ) {
    return null;
  }
  if (typeof row.appliesMonthly !== "boolean" || typeof row.appliesAnnual !== "boolean") return null;
  const planHint = row.planHint == null ? null : typeof row.planHint === "string" ? row.planHint : null;
  if (row.planHint != null && planHint == null) return null;
  return {
    code: row.code,
    benefitType: row.benefitType,
    label: row.label,
    appliesMonthly: row.appliesMonthly,
    appliesAnnual: row.appliesAnnual,
    planHint,
  };
}

function readPromoError(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
    return body.error;
  }
  return fallback;
}

function PortalButton({
  pending,
  onClick,
  label,
  filled,
}: {
  pending: boolean;
  onClick: () => void;
  label: string;
  filled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-wait"
      style={{
        background: filled ? INK : SURFACE,
        color: filled ? SURFACE : INK,
        border: filled ? "none" : `1.5px solid ${INK}`,
        borderRadius: 999,
        padding: "12px 18px",
        fontSize: 15,
        fontWeight: 500,
        cursor: pending ? "wait" : "pointer",
      }}
    >
      <CreditCard size={18} aria-hidden />
      {pending ? "Ouverture du portail…" : label}
    </button>
  );
}

function StatusCard({ view }: { view: SubscriptionView }) {
  if (view.status === "inactive" && view.canSubscribe && !view.cancelAtPeriodEnd) return null;

  const display = subscriptionDisplay(view);

  return (
    <section
      style={{
        background: SURFACE,
        border: `1px solid ${LINE}`,
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 2px 12px color-mix(in srgb, var(--ink) 8%, transparent)",
      }}
    >
      <div className="flex items-center gap-2">
        <Sparkles size={16} color={INK} aria-hidden />
        <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: TEXT }}>{display.label}</p>
      </div>
      <p style={{ margin: "8px 0 0", fontSize: 14, color: MUTED, lineHeight: 1.5 }}>{display.detail}</p>
    </section>
  );
}

function PlanCard({
  title,
  amount,
  perMonth,
  period,
  detail,
  highlighted = false,
  badge,
  cta,
  pending,
  disabled,
  onSubscribe,
}: {
  title: string;
  amount: string;
  perMonth?: string;
  period: string;
  detail: string;
  highlighted?: boolean;
  badge?: string;
  cta: string;
  pending: boolean;
  disabled: boolean;
  onSubscribe: () => void;
}) {
  return (
    <article
      style={{
        position: "relative",
        background: SURFACE,
        border: highlighted ? `1.5px solid ${INK}` : `1px solid ${LINE}`,
        borderRadius: 16,
        padding: 18,
        boxShadow: "0 2px 12px color-mix(in srgb, var(--ink) 8%, transparent)",
      }}
    >
      {highlighted && badge ? (
        <span
          style={{
            position: "absolute",
            top: -10,
            left: 16,
            background: MARK,
            color: INK,
            fontSize: 11,
            fontWeight: 500,
            padding: "3px 10px",
            borderRadius: 20,
          }}
        >
          {badge}
        </span>
      ) : null}
      <p style={{ margin: "6px 0 0", fontSize: 15, fontWeight: 500, color: TEXT }}>{title}</p>
      <p style={{ margin: "10px 0 0", fontSize: 32, fontWeight: 500, color: TEXT, lineHeight: 1 }}>
        {amount}
      </p>
      {perMonth ? (
        <p style={{ margin: "6px 0 0", fontSize: 12, color: MUTED }}>{perMonth}</p>
      ) : null}
      <p style={{ margin: "4px 0 0", fontSize: 13, color: MUTED }}>{period}</p>
      <p style={{ margin: "12px 0 16px", fontSize: 13, color: MUTED }}>{detail}</p>
      <button
        type="button"
        onClick={onSubscribe}
        disabled={disabled}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-wait"
        style={{
          width: "100%",
          background: INK,
          color: SURFACE,
          border: "none",
          borderRadius: 20,
          padding: "11px 16px",
          fontSize: 14,
          fontWeight: 500,
          cursor: disabled ? "wait" : "pointer",
          opacity: disabled && !pending ? 0.6 : 1,
        }}
      >
        {pending ? "Redirection…" : cta}
      </button>
    </article>
  );
}

function Reassurance({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2" style={{ fontSize: 14, color: TEXT }}>
      <Check size={16} color={INK} aria-hidden />
      {children}
    </li>
  );
}

function Notice({
  children,
  tone,
}: {
  children: string;
  tone: "green" | "gold" | "violet";
}) {
  const styles =
    tone === "gold" || tone === "violet"
      ? { background: MARK, color: INK }
      : { background: SURFACE, color: INK, border: `1px solid ${LINE}` };
  return (
    <p
      role="status"
      style={{
        ...styles,
        borderRadius: 12,
        padding: "12px 14px",
        fontSize: 14,
        lineHeight: 1.45,
        marginBottom: 16,
      }}
    >
      {children}
    </p>
  );
}
