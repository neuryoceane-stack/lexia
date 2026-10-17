import type { BillingPlan, SubscriptionView } from "@/lib/subscription";

async function readError(response: Response, fallback: string): Promise<string> {
  const data: unknown = await response.json().catch(() => null);
  if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
    return data.error;
  }
  return fallback;
}

export async function fetchSubscriptionView(): Promise<
  SubscriptionView | { showBilling: false }
> {
  const response = await fetch("/api/stripe/subscription", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await readError(response, "Impossible de lire l'abonnement."));
  }
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || !("showBilling" in data)) {
    throw new Error("Réponse d'abonnement illisible.");
  }
  return data as SubscriptionView | { showBilling: false };
}

export async function startSubscriptionCheckout(plan: BillingPlan): Promise<void> {
  const response = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
  const data: unknown = await response.json().catch(() => null);
  const url =
    data && typeof data === "object" && "url" in data && typeof data.url === "string"
      ? data.url
      : null;
  if (!response.ok || !url) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : "Impossible de démarrer le paiement.";
    throw new Error(message);
  }
  window.location.assign(url);
}

export async function openBillingPortal(): Promise<void> {
  const response = await fetch("/api/stripe/portal", { method: "POST" });
  const data: unknown = await response.json().catch(() => null);
  const url =
    data && typeof data === "object" && "url" in data && typeof data.url === "string"
      ? data.url
      : null;
  if (!response.ok || !url) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : "Impossible d'ouvrir le portail de gestion.";
    throw new Error(message);
  }
  window.location.assign(url);
}
