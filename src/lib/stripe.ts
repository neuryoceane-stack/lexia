import Stripe from "stripe";

/**
 * Client Stripe limité aux clés de test.
 * Une clé live (sk_live / rk_live) est refusée : Lexiva ne parle qu'au mode test.
 */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY manquante");
  }
  assertStripeTestKey(key);
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

export function assertStripeTestKey(key: string): void {
  if (
    key.startsWith("sk_live") ||
    key.startsWith("rk_live") ||
    key.includes("_live_")
  ) {
    throw new Error("Clé Stripe live refusée");
  }
  if (!key.startsWith("sk_test_") && !key.startsWith("rk_test_")) {
    throw new Error("Clé Stripe de test requise (sk_test_ ou rk_test_)");
  }
}

/** Origine publique de l'app (succès Checkout, retour portail). */
export function getAppBaseUrl(): string {
  const raw = process.env.NEXTAUTH_URL?.trim();
  if (!raw) throw new Error("NEXTAUTH_URL manquante");
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("NEXTAUTH_URL invalide");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("NEXTAUTH_URL invalide");
  }
  return url.origin;
}
