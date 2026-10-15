"use client";

import { useState } from "react";
import { Check, CreditCard, Sparkles } from "lucide-react";
import { BackLink } from "@/components/back-link";
import { openBillingPortal, startSubscriptionCheckout } from "@/lib/subscription-client";
import {
  SUBSCRIPTION_MONTHLY_EUROS,
  SUBSCRIPTION_TRIAL_DAYS,
  SUBSCRIPTION_YEARLY_EUROS,
  formatEuros,
  subscribedIntro,
  subscriptionDisplay,
  subscriptionOfferIntro,
  type BillingPlan,
  type SubscriptionView,
} from "@/lib/subscription";

const VIOLET = "#6C3FC8";
const GOLD = "#F5A623";
const GREEN = "#1D9E75";
const TEXT = "#1A1033";
const MUTED = "#6B6B8A";

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
  const view = initial;
  const [pendingPlan, setPendingPlan] = useState<BillingPlan | null>(null);
  const [portalPending, setPortalPending] = useState(false);
  const [error, setError] = useState<string | null>(confirmationError);

  async function subscribe(plan: BillingPlan) {
    setError(null);
    setPendingPlan(plan);
    try {
      await startSubscriptionCheckout(plan);
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

  const intro = view.canSubscribe ? subscriptionOfferIntro(view.includesTrial) : subscribedIntro();

  return (
    <div className="mx-auto max-w-[760px]">
      <BackLink href="/app/parametres">Paramètres</BackLink>

      <header className="mb-6">
        <p style={{ fontSize: 13, fontWeight: 500, color: VIOLET, marginBottom: 6 }}>Lexiva</p>
        <h1 style={{ fontFamily: "DM Sans, sans-serif", fontSize: 28, fontWeight: 500, color: TEXT, margin: 0 }}>
          Votre abonnement
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.55, color: MUTED, marginTop: 8, maxWidth: 560 }}>
          {intro}
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
            ? "Votre résiliation est programmée. Vous gardez l'accès jusqu'à la fin de la période en cours."
            : view.status === "trialing"
              ? "Votre essai est lancé. Le premier prélèvement aura lieu à la fin de l'essai, sauf résiliation."
              : "Votre abonnement est enregistré."}
        </Notice>
      ) : null}

      {checkout === "success" && !confirmationError && view.canSubscribe ? (
        <Notice tone="gold">
          Le paiement est revenu, mais aucun abonnement actif n&apos;est associé à votre compte.
        </Notice>
      ) : null}

      <StatusCard view={view} />

      {view.canSubscribe ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <PlanCard
            title="Mensuel"
            amount={formatEuros(SUBSCRIPTION_MONTHLY_EUROS)}
            period="par mois"
            detail="Sans engagement"
            cta={view.includesTrial ? "Commencer l'essai gratuit" : "S'abonner"}
            pending={pendingPlan === "monthly"}
            disabled={pendingPlan !== null}
            onSubscribe={() => void subscribe("monthly")}
          />
          <PlanCard
            title="Annuel"
            amount={formatEuros(SUBSCRIPTION_YEARLY_EUROS)}
            period="par an"
            detail="Facturé une fois par an"
            highlighted
            cta={view.includesTrial ? "Commencer l'essai gratuit" : "S'abonner"}
            pending={pendingPlan === "annual"}
            disabled={pendingPlan !== null}
            onSubscribe={() => void subscribe("annual")}
          />
        </div>
      ) : null}

      {view.canManagePortal ? (
        <button
          type="button"
          onClick={() => void manage()}
          disabled={portalPending}
          className="mt-5 flex w-full items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C3FC8] focus-visible:ring-offset-2 disabled:cursor-wait"
          style={{
            background: VIOLET,
            color: "white",
            border: "none",
            borderRadius: 20,
            padding: "12px 18px",
            fontSize: 15,
            fontWeight: 500,
            cursor: portalPending ? "wait" : "pointer",
          }}
        >
          <CreditCard size={18} aria-hidden />
          {portalPending ? "Ouverture du portail…" : "Gérer mon abonnement"}
        </button>
      ) : null}

      {error ? (
        <p role="alert" style={{ marginTop: 14, fontSize: 14, color: "#B42318" }}>
          {error}
        </p>
      ) : null}

      {view.canSubscribe ? (
        <ul className="mt-6 grid gap-2" style={{ listStyle: "none", padding: 0, marginBottom: 0 }}>
          {view.includesTrial ? (
            <Reassurance>Essai de {SUBSCRIPTION_TRIAL_DAYS} jours, carte bancaire requise</Reassurance>
          ) : (
            <Reassurance>Carte bancaire requise, prélèvement aujourd&apos;hui</Reassurance>
          )}
          <Reassurance>
            {`${formatEuros(SUBSCRIPTION_MONTHLY_EUROS)} par mois ou ${formatEuros(SUBSCRIPTION_YEARLY_EUROS)} par an`}
          </Reassurance>
          <Reassurance>Résiliable à tout moment depuis le portail de paiement</Reassurance>
        </ul>
      ) : null}
    </div>
  );
}

function StatusCard({ view }: { view: SubscriptionView }) {
  if (view.status === "inactive" && view.canSubscribe && !view.cancelAtPeriodEnd) return null;

  const display = subscriptionDisplay(view);
  const tone = statusTone(view);

  return (
    <section
      style={{
        background: "white",
        border: "0.5px solid rgba(108,63,200,.14)",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 2px 12px rgba(108, 63, 200, 0.08)",
      }}
    >
      <div className="flex items-center gap-2">
        <Sparkles size={16} color={tone} aria-hidden />
        <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: TEXT }}>{display.label}</p>
      </div>
      <p style={{ margin: "8px 0 0", fontSize: 14, color: MUTED, lineHeight: 1.5 }}>{display.detail}</p>
    </section>
  );
}

function statusTone(view: SubscriptionView): string {
  if (view.cancelAtPeriodEnd) return GOLD;
  if (view.status === "active" || view.status === "trialing") return GREEN;
  if (view.status === "past_due" || view.status === "canceled") return GOLD;
  return VIOLET;
}

function PlanCard({
  title,
  amount,
  period,
  detail,
  highlighted = false,
  cta,
  pending,
  disabled,
  onSubscribe,
}: {
  title: string;
  amount: string;
  period: string;
  detail: string;
  highlighted?: boolean;
  cta: string;
  pending: boolean;
  disabled: boolean;
  onSubscribe: () => void;
}) {
  return (
    <article
      style={{
        position: "relative",
        background: highlighted ? "rgba(108,63,200,.06)" : "white",
        border: highlighted ? `2px solid ${VIOLET}` : "0.5px solid rgba(108,63,200,.14)",
        borderRadius: 16,
        padding: 18,
        boxShadow: "0 2px 12px rgba(108, 63, 200, 0.08)",
      }}
    >
      {highlighted ? (
        <span
          style={{
            position: "absolute",
            top: -10,
            left: 16,
            background: GOLD,
            color: "#1A1033",
            fontSize: 11,
            fontWeight: 500,
            padding: "3px 10px",
            borderRadius: 20,
          }}
        >
          2 mois offerts
        </span>
      ) : null}
      <p style={{ margin: "6px 0 0", fontSize: 15, fontWeight: 500, color: TEXT }}>{title}</p>
      <p style={{ margin: "10px 0 0", fontSize: 32, fontWeight: 500, color: highlighted ? VIOLET : TEXT, lineHeight: 1 }}>
        {amount}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 13, color: MUTED }}>{period}</p>
      <p style={{ margin: "12px 0 16px", fontSize: 13, color: MUTED }}>{detail}</p>
      <button
        type="button"
        onClick={onSubscribe}
        disabled={disabled}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C3FC8] focus-visible:ring-offset-2 disabled:cursor-wait"
        style={{
          width: "100%",
          background: VIOLET,
          color: "white",
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
      <Check size={16} color={GREEN} aria-hidden />
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
    tone === "green"
      ? { background: "rgba(29,158,117,.12)", color: "#146C50" }
      : tone === "gold"
        ? { background: "rgba(245,166,35,.18)", color: "#8A5A00" }
        : { background: "rgba(108,63,200,.10)", color: VIOLET };
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
