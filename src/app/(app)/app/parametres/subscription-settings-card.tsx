"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import {
  fetchSubscriptionView,
  openBillingPortal,
} from "@/lib/subscription-client";
import {
  SUBSCRIPTION_MONTHLY_EUROS,
  SUBSCRIPTION_YEARLY_EUROS,
  formatEuros,
  formatPeriodEnd,
  subscriptionStatusLabel,
  type SubscriptionView,
} from "@/lib/subscription";

const SECTION_CARD_STYLE = {
  background: "white",
  border: "0.5px solid rgba(108,63,200,.12)",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 4px 24px rgba(108,63,200,.12), 0 1px 3px rgba(108,63,200,.08)",
} as const;

export function SubscriptionSettingsCard() {
  const [view, setView] = useState<SubscriptionView | { showBilling: false } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [portalPending, setPortalPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchSubscriptionView()
      .then((next) => {
        if (!cancelled) setView(next);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Impossible de lire l'abonnement.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!view && !error) return null;
  if (view && !view.showBilling) return null;

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

  return (
    <div className="mb-3" style={SECTION_CARD_STYLE}>
      <div className="mb-3 flex items-center gap-2">
        <CreditCard size={18} color="#6C3FC8" aria-hidden />
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: "#1A1033", fontFamily: "DM Sans, sans-serif" }}>
          Abonnement et paiement
        </h2>
      </div>

      {view && view.showBilling ? <Summary view={view} /> : null}

      <div className="mt-3 flex flex-col gap-2">
        {view && view.showBilling && view.canSubscribe ? (
          <Link
            href="/app/abonnement"
            className="flex w-full items-center justify-center no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C3FC8] focus-visible:ring-offset-2"
            style={{
              background: "#6C3FC8",
              color: "white",
              borderRadius: 20,
              padding: "11px 16px",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            S&apos;abonner
          </Link>
        ) : null}
        {view && view.showBilling && view.canManagePortal ? (
          <button
            type="button"
            onClick={() => void manage()}
            disabled={portalPending}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C3FC8] focus-visible:ring-offset-2 disabled:cursor-wait"
            style={{
              background: "white",
              color: "#6C3FC8",
              border: "1.5px solid #6C3FC8",
              borderRadius: 20,
              padding: "11px 16px",
              fontSize: 14,
              fontWeight: 500,
              cursor: portalPending ? "wait" : "pointer",
            }}
          >
            {portalPending ? "Ouverture du portail…" : "Gérer mon abonnement"}
          </button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" style={{ margin: "10px 0 0", fontSize: 13, color: "#B42318" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Summary({ view }: { view: SubscriptionView }) {
  const price =
    view.plan === "monthly"
      ? `${formatEuros(SUBSCRIPTION_MONTHLY_EUROS)} / mois`
      : view.plan === "annual"
        ? `${formatEuros(SUBSCRIPTION_YEARLY_EUROS)} / an`
        : "Aucune formule";
  const showPrice = view.canManagePortal && view.plan !== "free";
  const date = view.currentPeriodEnd != null ? formatPeriodEnd(view.currentPeriodEnd) : null;

  return (
    <div>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#1A1033" }}>
        {subscriptionStatusLabel(view.status)}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B6B8A", lineHeight: 1.45 }}>
        {view.status === "active" && !view.canManagePortal
          ? "Votre accès Lexiva est actif."
          : showPrice
            ? price
            : "Choisissez une formule mensuelle ou annuelle."}
        {date && view.status === "trialing" ? ` Fin de l'essai le ${date}.` : ""}
        {date && view.status === "active" && view.canManagePortal ? ` Prochain renouvellement le ${date}.` : ""}
        {date && view.status === "canceled" ? ` Fin de période le ${date}.` : ""}
      </p>
    </div>
  );
}
