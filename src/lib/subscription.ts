import {
  OFFER_MONTHLY_EUROS,
  OFFER_TRIAL_DAYS,
  OFFER_YEARLY_EUROS,
  formatOfferEuros,
} from "@/lib/offer";

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

/** Alias de l'offre officielle, lus aussi par le contrôle de montant Stripe. */
export const SUBSCRIPTION_TRIAL_DAYS = OFFER_TRIAL_DAYS;
export const SUBSCRIPTION_MONTHLY_EUROS = OFFER_MONTHLY_EUROS;
export const SUBSCRIPTION_YEARLY_EUROS = OFFER_YEARLY_EUROS;

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
  return formatOfferEuros(amount);
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
      return "Paiement échoué";
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
  /** Résiliation demandée, accès conservé jusqu'à la fin de période. Lu chez Stripe, pas stocké. */
  cancelAtPeriodEnd: boolean;
  /** Faux tant que la clé de test et les Price ID ne sont pas en place. */
  billingConfigured: boolean;
};

/** Message élève quand le paiement n'est pas ouvert. Ce n'est pas une erreur. */
export function subscriptionUnavailableCopy(): string {
  return "L'abonnement n'est pas encore ouvert. Tu peux continuer à utiliser Lexiva.";
}

export function subscriptionOfferIntro(includesTrial: boolean): string {
  if (includesTrial) {
    return `Essai de ${SUBSCRIPTION_TRIAL_DAYS} jours. Une carte bancaire est requise. ${formatEuros(SUBSCRIPTION_MONTHLY_EUROS)} par mois ou ${formatEuros(SUBSCRIPTION_YEARLY_EUROS)} par an.`;
  }
  return "Choisis une formule pour reprendre Lexiva. Une carte bancaire est requise. Le prélèvement a lieu aujourd'hui.";
}

/** Texte affiché après souscription. La carte n'est mentionnée qu'à ce moment-là. */
export function subscribedIntro(): string {
  return "Ta carte est enregistrée. Retrouve ici ta formule et le portail pour gérer ta carte ou résilier.";
}

export function subscriptionDisplay(view: {
  status: SubscriptionStatus;
  plan: AccountPlan;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  canManagePortal: boolean;
}): { label: string; detail: string } {
  const date = view.currentPeriodEnd != null ? formatPeriodEnd(view.currentPeriodEnd) : null;
  const formula =
    view.plan === "monthly"
      ? `Formule mensuelle, ${formatEuros(SUBSCRIPTION_MONTHLY_EUROS)} par mois.`
      : view.plan === "annual"
        ? `Formule annuelle, ${formatEuros(SUBSCRIPTION_YEARLY_EUROS)} par an.`
        : null;

  if (view.cancelAtPeriodEnd && (view.status === "active" || view.status === "trialing")) {
    return {
      label: "Résiliation programmée",
      detail: date
        ? `Ta résiliation est programmée. Tu gardes l'accès jusqu'au ${date}.`
        : "Ta résiliation est programmée. Tu gardes l'accès jusqu'à la fin de la période en cours.",
    };
  }

  switch (view.status) {
    case "inactive":
      return {
        label: "Sans abonnement",
        detail: subscriptionOfferIntro(true),
      };
    case "trialing":
      return {
        label: "Essai en cours",
        detail: joinSentences(
          formula,
          date
            ? `Le premier prélèvement aura lieu le ${date}, sauf résiliation.`
            : "Le premier prélèvement aura lieu à la fin de l'essai, sauf résiliation."
        ),
      };
    case "active":
      if (!view.canManagePortal) {
        return { label: "Actif", detail: "Ton accès Lexiva est actif." };
      }
      return {
        label: "Actif",
        detail: joinSentences(formula, date ? `Prochain renouvellement le ${date}.` : "Ton abonnement est actif."),
      };
    case "canceled":
      return {
        label: "Résilié",
        detail: date
          ? `Ton abonnement est résilié. La période s'est terminée le ${date}. Tu peux choisir une nouvelle formule quand tu le souhaites.`
          : "Ton abonnement est résilié. Tu peux choisir une nouvelle formule quand tu le souhaites.",
      };
    case "past_due":
      return {
        label: "Paiement échoué",
        detail:
          "Le dernier paiement a échoué. Mets à jour ta carte depuis le portail pour conserver ta formule.",
      };
    default: {
      const unexpected: never = view.status;
      throw new Error(`Statut non affiché : ${String(unexpected)}`);
    }
  }
}

function joinSentences(...parts: Array<string | null>): string {
  return parts.filter((part): part is string => Boolean(part)).join(" ");
}

/** Null si la session Checkout appartient au compte. Sinon un message à afficher, sans détail interne. */
export function checkoutSessionOwnershipError(input: {
  metadataUserId: string | null;
  clientReferenceId: string | null;
  sessionCustomerId: string | null;
  userId: string;
  userCustomerId: string | null;
}): string | null {
  if (
    input.metadataUserId !== input.userId ||
    (input.clientReferenceId != null && input.clientReferenceId !== input.userId) ||
    (input.userCustomerId != null &&
      input.sessionCustomerId != null &&
      input.userCustomerId !== input.sessionCustomerId)
  ) {
    return "Cette session de paiement ne correspond pas à ton compte.";
  }
  return null;
}
