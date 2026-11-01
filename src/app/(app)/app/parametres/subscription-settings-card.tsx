"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import {
  fetchSubscriptionView,
  openBillingPortal,
} from "@/lib/subscription-client";
import {
  subscriptionDisplay,
  subscriptionUnavailableCopy,
  type SubscriptionView,
} from "@/lib/subscription";

const SECTION_CARD_STYLE = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 16,
  padding: 16,
  boxShadow:
    "0 4px 24px color-mix(in srgb, var(--ink) 12%, transparent), 0 1px 3px color-mix(in srgb, var(--ink) 8%, transparent)",
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
        <CreditCard size={18} color="var(--ink)" aria-hidden />
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: "var(--ink)", fontFamily: "DM Sans, sans-serif" }}>
          Abonnement et paiement
        </h2>
      </div>

      {view && view.showBilling && !view.billingConfigured && view.canSubscribe ? (
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--muted)" }}>
          {subscriptionUnavailableCopy()}
        </p>
      ) : null}

      {view && view.showBilling && (view.billingConfigured || !view.canSubscribe) ? (
        <Summary view={view} />
      ) : null}

      {!view || !view.showBilling || view.billingConfigured || !view.canManagePortal ? null : (
        <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.45, color: "var(--muted)" }}>
          La gestion du paiement n&apos;est pas disponible pour le moment.
        </p>
      )}

      {view && view.showBilling && view.billingConfigured && (view.canSubscribe || view.canManagePortal) ? (
      <div className="mt-3 flex flex-col gap-2">
        {view.canSubscribe ? (
          <Link
            href="/app/abonnement"
            className="flex w-full items-center justify-center no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
            style={{
              background: "var(--ink)",
              color: "var(--surface)",
              borderRadius: 20,
              padding: "11px 16px",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            S&apos;abonner
          </Link>
        ) : null}
        {view.canManagePortal ? (
          <button
            type="button"
            onClick={() => void manage()}
            disabled={portalPending}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-wait"
            style={{
              background: "var(--surface)",
              color: "var(--ink)",
              border: "1.5px solid var(--ink)",
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
      ) : null}

      {error ? (
        <p role="alert" style={{ margin: "10px 0 0", fontSize: 13, color: "var(--false-text)" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Summary({ view }: { view: SubscriptionView }) {
  const display = subscriptionDisplay(view);
  return (
    <div>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{display.label}</p>
      <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.45 }}>{display.detail}</p>
    </div>
  );
}
