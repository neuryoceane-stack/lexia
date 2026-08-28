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
