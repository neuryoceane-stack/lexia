/** Statuts d'abonnement stockés dans users.subscription_status */
export const SUBSCRIPTION_STATUSES = [
  "inactive",
  "trialing",
  "active",
  "canceled",
  "past_due",
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export type SubscriptionUserRow = {
  subscriptionStatus?: SubscriptionStatus | string | null;
  plan?: string | null;
};

/** Accès premium / abonnement actif (Stripe ou bypass test dev). */
export function hasActiveSubscription(user: SubscriptionUserRow): boolean {
  const status = user.subscriptionStatus;
  return status === "active" || status === "trialing";
}

/** Offre élève validée : chiffres ronds, essai d'un mois avec carte. */
export const SUBSCRIPTION_TRIAL_DAYS = 30;
export const SUBSCRIPTION_MONTHLY_EUROS = 4;
export const SUBSCRIPTION_YEARLY_EUROS = 40;

export const BILLING_PLANS = ["monthly", "annual"] as const;
export type BillingPlan = (typeof BILLING_PLANS)[number];

export type AccountPlan = "free" | BillingPlan;

export function assertSubscriptionStatus(value: string): SubscriptionStatus {
  if ((SUBSCRIPTION_STATUSES as readonly string[]).includes(value)) {
    return value as SubscriptionStatus;
  }
  throw new Error(`subscription_status inconnu : ${value}`);
}

export function assertAccountPlan(value: string): AccountPlan {
  if (value === "free" || value === "monthly" || value === "annual") return value;
  throw new Error(`plan inconnu : ${value}`);
}

export function parseBillingPlan(body: unknown): BillingPlan | null {
  if (!body || typeof body !== "object") return null;
  const plan = (body as { plan?: unknown }).plan;
  if (plan === "monthly" || plan === "annual") return plan;
  return null;
}

/** Un premier essai, ou un réabonnement après résiliation. */
export function canStartSubscriptionCheckout(status: SubscriptionStatus): boolean {
  return status === "inactive" || status === "canceled";
}

/** L'essai n'est proposé qu'une fois, au premier abonnement. */
export function subscriptionCheckoutIncludesTrial(status: SubscriptionStatus): boolean {
  return status === "inactive";
}

export function formatEuros(amount: number): string {
  return `${amount}\u00a0€`;
}

export function subscriptionStatusLabel(status: SubscriptionStatus): string {
  switch (status) {
    case "inactive":
      return "Sans abonnement";
    case "trialing":
      return "Essai en cours";
    case "active":
      return "Actif";
    case "canceled":
      return "Résilié";
    case "past_due":
      return "Paiement en échec";
    default: {
      const unexpected: never = status;
      throw new Error(`Statut non affiché : ${String(unexpected)}`);
    }
  }
}

export function formatPeriodEnd(unixSeconds: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(unixSeconds * 1000));
}

export type SubscriptionView = {
  showBilling: true;
  status: SubscriptionStatus;
  plan: AccountPlan;
  currentPeriodEnd: number | null;
  canSubscribe: boolean;
  includesTrial: boolean;
  canManagePortal: boolean;
};
