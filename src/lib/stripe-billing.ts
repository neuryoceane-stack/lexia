import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getAppBaseUrl, getStripe, isStripeBillingConfigured } from "@/lib/stripe";
import {
  SUBSCRIPTION_MONTHLY_EUROS,
  SUBSCRIPTION_TRIAL_DAYS,
  SUBSCRIPTION_YEARLY_EUROS,
  assertAccountPlan,
  assertSubscriptionStatus,
  canStartSubscriptionCheckout,
  subscriptionCheckoutIncludesTrial,
  checkoutSessionOwnershipError,
  type AccountPlan,
  type BillingPlan,
  type SubscriptionStatus,
  type SubscriptionView,
} from "@/lib/subscription";

export class BillingError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BillingError";
    this.status = status;
  }
}

const EXPECTED_UNIT_AMOUNT: Record<BillingPlan, number> = {
  monthly: SUBSCRIPTION_MONTHLY_EUROS * 100,
  annual: SUBSCRIPTION_YEARLY_EUROS * 100,
};

const EXPECTED_INTERVAL: Record<BillingPlan, "month" | "year"> = {
  monthly: "month",
  annual: "year",
};

const OPEN_SUBSCRIPTION_STATUSES = new Set<Stripe.Subscription.Status>([
  "trialing",
  "active",
  "past_due",
  "unpaid",
]);

type BillingUserRow = {
  id: string;
  plan: string;
  subscriptionStatus: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeStatusSyncedAt: number | null;
};

const billingUserColumns = {
  id: users.id,
  plan: users.plan,
  subscriptionStatus: users.subscriptionStatus,
  stripeCustomerId: users.stripeCustomerId,
  stripeSubscriptionId: users.stripeSubscriptionId,
  stripeStatusSyncedAt: users.stripeStatusSyncedAt,
};

export function requirePriceId(plan: BillingPlan): string {
  const envName = plan === "monthly" ? "STRIPE_PRICE_MONTHLY" : "STRIPE_PRICE_YEARLY";
  const value = process.env[envName]?.trim();
  if (!value || !value.startsWith("price_")) {
    console.error(`[stripe] ${envName} manquante ou invalide`);
    throw new BillingError("L'abonnement n'est pas encore configuré.", 503);
  }
  return value;
}

export function planFromPriceId(priceId: string): BillingPlan | null {
  const monthly = process.env.STRIPE_PRICE_MONTHLY?.trim();
  const yearly = process.env.STRIPE_PRICE_YEARLY?.trim();
  if (monthly && priceId === monthly) return "monthly";
  if (yearly && priceId === yearly) return "annual";
  return null;
}

/**
 * Traduit un statut Stripe vers l'enum Lexiva.
 * `paused` n'a pas d'équivalent : l'événement échoue pour rester visible.
 * `unpaid` rejoint `past_due` (paiement en échec, pas d'accès premium à l'étape 2).
 */
export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status
): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "past_due";
    case "canceled":
      return "canceled";
    case "incomplete":
    case "incomplete_expired":
      return "inactive";
    case "paused":
      throw new Error("Statut Stripe paused non pris en charge");
    default: {
      const unexpected: never = status;
      throw new Error(`Statut Stripe non géré : ${String(unexpected)}`);
    }
  }
}

export function toSubscriptionView(
  row: {
    subscriptionStatus: string;
    plan: string;
    stripeCustomerId: string | null;
    subscriptionCurrentPeriodEnd: number | null;
  },
  billingConfigured: boolean
): SubscriptionView {
  const status = assertSubscriptionStatus(row.subscriptionStatus);
  const plan = assertAccountPlan(row.plan);
  const canSubscribe = canStartSubscriptionCheckout(status);
  return {
    showBilling: true,
    status,
    plan,
    currentPeriodEnd: row.subscriptionCurrentPeriodEnd,
    canSubscribe,
    includesTrial: subscriptionCheckoutIncludesTrial(status),
    canManagePortal: Boolean(row.stripeCustomerId) && status !== "inactive",
    cancelAtPeriodEnd: false,
    billingConfigured,
  };
}

export async function loadSubscriptionView(userId: string): Promise<SubscriptionView | null> {
  let row: {
    subscriptionStatus: string;
    plan: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    subscriptionCurrentPeriodEnd: number | null;
  };
  try {
    const [found] = await db
      .select({
        subscriptionStatus: users.subscriptionStatus,
        plan: users.plan,
        stripeCustomerId: users.stripeCustomerId,
        stripeSubscriptionId: users.stripeSubscriptionId,
        subscriptionCurrentPeriodEnd: users.subscriptionCurrentPeriodEnd,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!found) return null;
    row = found;
  } catch (error) {
    if (!isMissingStripeColumn(error)) throw error;
    console.error("[stripe] colonnes d'abonnement absentes", error);
    const [basic] = await db
      .select({
        subscriptionStatus: users.subscriptionStatus,
        plan: users.plan,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!basic) return null;
    return toSubscriptionView(
      { ...basic, stripeCustomerId: null, subscriptionCurrentPeriodEnd: null },
      false
    );
  }
  const billingConfigured = isStripeBillingConfigured();
  const view = toSubscriptionView(row, billingConfigured);
  if (
    !billingConfigured ||
    !row.stripeSubscriptionId ||
    (view.status !== "active" && view.status !== "trialing")
  ) {
    return view;
  }

  const subscription = await getStripe().subscriptions.retrieve(row.stripeSubscriptionId);
  const scheduled = isCancellationScheduled(subscription);
  return {
    ...view,
    cancelAtPeriodEnd: scheduled,
    currentPeriodEnd:
      scheduled && subscription.cancel_at != null ? subscription.cancel_at : view.currentPeriodEnd,
  };
}

/**
 * Confirme un retour Checkout sans attendre le webhook.
 * Idempotent : un second appel, ou un webhook déjà appliqué plus récent, ne régresse pas le statut.
 * L'horloge utilisée est session.created, pas l'heure du serveur, pour laisser passer un événement Stripe ultérieur.
 */
export async function confirmCheckoutSessionForUser(userId: string, sessionId: string): Promise<void> {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    throw new BillingError("Session de paiement invalide.", 400);
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  await assertCheckoutSessionOwner(session, userId);

  if (session.status !== "complete") {
    throw new BillingError("Le paiement n'est pas encore confirmé.", 409);
  }
  if (!isSubscriptionCheckout(session)) {
    throw new BillingError("Cette session ne correspond pas à un abonnement Lexiva.", 400);
  }

  const subscriptionRef = session.subscription;
  const subscriptionId =
    typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id ?? null;
  if (!subscriptionId) {
    throw new BillingError("La session ne contient pas d'abonnement.", 409);
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  if (subscription.status === "incomplete" || subscription.status === "incomplete_expired") {
    throw new BillingError("Le paiement n'est pas finalisé.", 409);
  }

  await applyStripeSubscription({
    eventCreated: session.created,
    subscription,
    userIdHint: userId,
    customerIdHint: stripeObjectId(session.customer),
  });
}

export async function createSubscriptionCheckout(input: {
  userId: string;
  email: string;
  plan: BillingPlan;
}): Promise<string> {
  const stripe = getStripe();
  const baseUrl = appBaseUrlOrConfigError();
  const priceId = requirePriceId(input.plan);
  await assertConfiguredPrice(stripe, input.plan, priceId);

  const row = await requireBillingUser(input.userId);
  const status = assertSubscriptionStatus(row.subscriptionStatus);
  await assertCheckoutAllowed(stripe, row, status);

  const customerId = await ensureStripeCustomer(stripe, row, input.email);
  const includesTrial = status === "inactive";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: input.userId,
    locale: "fr",
    payment_method_types: ["card"],
    payment_method_collection: "always",
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      userId: input.userId,
      plan: input.plan,
      kind: "lexiva_subscription",
    },
    subscription_data: {
      metadata: { userId: input.userId, plan: input.plan },
      description:
        input.plan === "monthly"
          ? "Lexiva — formule mensuelle"
          : "Lexiva — formule annuelle",
      ...(includesTrial ? { trial_period_days: SUBSCRIPTION_TRIAL_DAYS } : {}),
    },
    success_url: `${baseUrl}/app/abonnement?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/app/abonnement?checkout=cancel`,
  });

  if (!session.url) {
    throw new Error("Checkout Stripe sans URL");
  }
  return session.url;
}

export async function createBillingPortalUrl(userId: string): Promise<string> {
  const stripe = getStripe();
  const baseUrl = appBaseUrlOrConfigError();
  const [row] = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) throw new BillingError("Compte introuvable.", 404);
  if (!row.stripeCustomerId) {
    throw new BillingError("Aucun abonnement à gérer pour le moment.", 400);
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: row.stripeCustomerId,
    return_url: `${baseUrl}/app/abonnement`,
    locale: "fr",
  });
  return session.url;
}

export function isSubscriptionCheckout(session: Stripe.Checkout.Session): boolean {
  return session.mode === "subscription" || session.metadata?.kind === "lexiva_subscription";
}

export async function syncSubscriptionCheckout(
  session: Stripe.Checkout.Session,
  eventCreated: number
): Promise<void> {
  const subscriptionRef = session.subscription;
  const subscriptionId =
    typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id ?? null;
  if (!subscriptionId) {
    throw new Error("Checkout abonnement sans subscription");
  }
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  await applyStripeSubscription({
    eventCreated,
    subscription,
    userIdHint: session.metadata?.userId ?? session.client_reference_id,
    customerIdHint: stripeObjectId(session.customer),
  });
}

export async function applyStripeSubscription(input: {
  eventCreated: number;
  subscription: Stripe.Subscription;
  userIdHint?: string | null;
  customerIdHint?: string | null;
}): Promise<void> {
  const customerId = input.customerIdHint ?? stripeObjectId(input.subscription.customer);
  const user = await resolveBillingUser({
    userId: input.userIdHint ?? input.subscription.metadata?.userId ?? null,
    customerId,
    subscriptionId: input.subscription.id,
  });

  if (isStaleEvent(user, input.eventCreated)) {
    console.info("[stripe] événement abonnement plus ancien ignoré", {
      userId: user.id,
      eventCreated: input.eventCreated,
      syncedAt: user.stripeStatusSyncedAt,
    });
    return;
  }

  if (user.stripeCustomerId && customerId && user.stripeCustomerId !== customerId) {
    throw new Error(`Conflit stripe_customer_id pour l'utilisateur ${user.id}`);
  }

  const status = mapStripeSubscriptionStatus(input.subscription.status);
  const periodEnd = input.subscription.items.data[0]?.current_period_end ?? null;
  const plan = resolvePlan(input.subscription, status);

  await db
    .update(users)
    .set({
      subscriptionStatus: status,
      plan,
      stripeCustomerId: customerId ?? user.stripeCustomerId,
      stripeSubscriptionId: status === "inactive" ? null : input.subscription.id,
      subscriptionCurrentPeriodEnd: periodEnd,
      stripeStatusSyncedAt: input.eventCreated,
    })
    .where(eq(users.id, user.id));
}

export async function applyInvoicePaymentFailed(input: {
  eventCreated: number;
  invoice: Stripe.Invoice;
}): Promise<void> {
  const subscriptionId = invoiceSubscriptionId(input.invoice);
  if (!subscriptionId) {
    throw new Error("invoice.payment_failed sans identifiant d'abonnement");
  }

  const customerId = stripeObjectId(input.invoice.customer);
  const user = await resolveBillingUser({
    userId: input.invoice.parent?.subscription_details?.metadata?.userId ?? null,
    customerId,
    subscriptionId,
  });

  if (isStaleEvent(user, input.eventCreated)) {
    console.info("[stripe] payment_failed plus ancien ignoré", {
      userId: user.id,
      eventCreated: input.eventCreated,
    });
    return;
  }

  const status = assertSubscriptionStatus(user.subscriptionStatus);
  if (status !== "active" && status !== "trialing" && status !== "past_due") {
    console.error("[stripe] payment_failed non appliqué : statut incompatible", {
      userId: user.id,
      status,
      subscriptionId,
    });
    throw new Error(
      `invoice.payment_failed incompatible avec le statut ${status} (${user.id})`
    );
  }

  if (user.stripeSubscriptionId && user.stripeSubscriptionId !== subscriptionId) {
    throw new Error(
      `payment_failed pour ${subscriptionId}, abonnement enregistré ${user.stripeSubscriptionId}`
    );
  }

  await db
    .update(users)
    .set({
      subscriptionStatus: "past_due",
      stripeCustomerId: customerId ?? user.stripeCustomerId,
      stripeSubscriptionId: subscriptionId,
      stripeStatusSyncedAt: input.eventCreated,
    })
    .where(eq(users.id, user.id));
}

export function billingHttpError(error: unknown): { message: string; status: number } | null {
  if (error instanceof BillingError) {
    return { message: error.message, status: error.status };
  }
  if (error instanceof Error && isStripeConfigError(error)) {
    console.error("[stripe] configuration", error.message);
    return { message: "L'abonnement n'est pas encore configuré.", status: 503 };
  }
  if (error instanceof Stripe.errors.StripeInvalidRequestError) {
    console.error("[stripe]", error.code, error.message);
    if (/portal/i.test(error.message)) {
      return { message: "Le portail de gestion n'est pas encore activé.", status: 503 };
    }
    return { message: "Le service de paiement a refusé l'opération.", status: 502 };
  }
  if (error instanceof Stripe.errors.StripeError) {
    console.error("[stripe]", error.type, error.code, error.message);
    return { message: "Le service de paiement a refusé l'opération.", status: 502 };
  }
  return null;
}

function isStripeConfigError(error: Error): boolean {
  return /STRIPE_|NEXTAUTH_URL|Clé Stripe/.test(error.message);
}

function appBaseUrlOrConfigError(): string {
  try {
    return getAppBaseUrl();
  } catch (error) {
    console.error("[stripe] URL d'application", error);
    throw new BillingError("L'abonnement n'est pas encore configuré.", 503);
  }
}

async function assertConfiguredPrice(
  stripe: Stripe,
  plan: BillingPlan,
  priceId: string
): Promise<void> {
  const price = await stripe.prices.retrieve(priceId);
  const coherent =
    price.active &&
    price.currency === "eur" &&
    price.unit_amount === EXPECTED_UNIT_AMOUNT[plan] &&
    price.recurring?.interval === EXPECTED_INTERVAL[plan] &&
    price.recurring.interval_count === 1;
  if (coherent) return;

  console.error("[stripe] prix incohérent avec l'offre Lexiva", {
    plan,
    priceId,
    active: price.active,
    currency: price.currency,
    unit_amount: price.unit_amount,
    interval: price.recurring?.interval,
    interval_count: price.recurring?.interval_count,
  });
  throw new BillingError("La formule sélectionnée n'est pas disponible pour le moment.", 503);
}

async function assertCheckoutAllowed(
  stripe: Stripe,
  row: BillingUserRow,
  status: SubscriptionStatus
): Promise<void> {
  if (row.stripeSubscriptionId) {
    const existing = await stripe.subscriptions.retrieve(row.stripeSubscriptionId).catch((error: unknown) => {
      if (isMissingStripeResource(error)) return null;
      throw error;
    });
    if (existing && OPEN_SUBSCRIPTION_STATUSES.has(existing.status)) {
      throw new BillingError(
        "Vous avez déjà un abonnement en cours. Utilisez « Gérer mon abonnement » pour le modifier ou le résilier.",
        409
      );
    }
    if (existing?.status === "paused") {
      throw new Error(`Abonnement Stripe en pause non géré (${existing.id})`);
    }
    if (existing?.status === "incomplete") {
      await stripe.subscriptions.cancel(existing.id);
    }
    return;
  }

  if (status === "active" || status === "trialing" || status === "past_due") {
    throw new BillingError(
      status === "past_due"
        ? "Un paiement est en échec sur ce compte. Mettez à jour la carte depuis le portail."
        : "Votre accès Lexiva est déjà actif.",
      409
    );
  }
}

async function ensureStripeCustomer(
  stripe: Stripe,
  row: BillingUserRow,
  email: string
): Promise<string> {
  if (row.stripeCustomerId) return row.stripeCustomerId;

  const customer = await stripe.customers.create(
    {
      email,
      preferred_locales: ["fr-FR"],
      metadata: { userId: row.id },
    },
    { idempotencyKey: `lexiva-customer-${row.id}` }
  );

  await db
    .update(users)
    .set({ stripeCustomerId: customer.id })
    .where(eq(users.id, row.id));

  return customer.id;
}

function resolvePlan(subscription: Stripe.Subscription, status: SubscriptionStatus): AccountPlan {
  if (status === "inactive" || status === "canceled") return "free";

  const priceId = subscription.items.data[0]?.price.id ?? null;
  if (!priceId) {
    throw new Error(`Abonnement ${subscription.id} sans prix`);
  }
  const fromPrice = planFromPriceId(priceId);
  if (!fromPrice) {
    throw new Error(`Prix Stripe non configuré : ${priceId}`);
  }

  const metadataPlan = subscription.metadata?.plan;
  if (
    (metadataPlan === "monthly" || metadataPlan === "annual") &&
    metadataPlan !== fromPrice
  ) {
    throw new Error(
      `metadata.plan (${metadataPlan}) incohérent avec le prix ${priceId} (${fromPrice})`
    );
  }
  return fromPrice;
}

async function requireBillingUser(userId: string): Promise<BillingUserRow> {
  const [row] = await db
    .select(billingUserColumns)
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) throw new BillingError("Compte introuvable.", 404);
  return row;
}

async function resolveBillingUser(hints: {
  userId?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
}): Promise<BillingUserRow> {
  const byId = hints.userId ? await findBillingUser(eq(users.id, hints.userId)) : null;
  const byCustomer = hints.customerId
    ? await findBillingUser(eq(users.stripeCustomerId, hints.customerId))
    : null;
  const bySubscription = hints.subscriptionId
    ? await findBillingUser(eq(users.stripeSubscriptionId, hints.subscriptionId))
    : null;

  const found = [byId, byCustomer, bySubscription].filter((row): row is BillingUserRow => row !== null);
  const ids = new Set(found.map((row) => row.id));
  if (ids.size > 1) {
    throw new Error("Conflit d'identité entre metadata, client et abonnement Stripe");
  }
  const user = byId ?? byCustomer ?? bySubscription;
  if (!user) {
    throw new Error("Utilisateur introuvable pour l'événement Stripe");
  }
  return user;
}

async function findBillingUser(
  where: ReturnType<typeof eq>
): Promise<BillingUserRow | null> {
  const [row] = await db.select(billingUserColumns).from(users).where(where).limit(1);
  return row ?? null;
}

function isStaleEvent(user: BillingUserRow, eventCreated: number): boolean {
  return user.stripeStatusSyncedAt != null && eventCreated < user.stripeStatusSyncedAt;
}

function isCancellationScheduled(subscription: Stripe.Subscription): boolean {
  if (
    subscription.status === "canceled" ||
    subscription.status === "incomplete" ||
    subscription.status === "incomplete_expired"
  ) {
    return false;
  }
  return subscription.cancel_at_period_end || subscription.cancel_at != null;
}

async function assertCheckoutSessionOwner(
  session: Stripe.Checkout.Session,
  userId: string
): Promise<void> {
  const metadataUserId = session.metadata?.userId ?? null;
  const referenceId = session.client_reference_id;
  const row = await requireBillingUser(userId);
  const customerId = stripeObjectId(session.customer);
  const ownershipError = checkoutSessionOwnershipError({
    metadataUserId,
    clientReferenceId: referenceId,
    sessionCustomerId: customerId,
    userId,
    userCustomerId: row.stripeCustomerId,
  });
  if (ownershipError) {
    throw new BillingError(ownershipError, 403);
  }
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const subscription = invoice.parent?.subscription_details?.subscription;
  if (!subscription) return null;
  return typeof subscription === "string" ? subscription : subscription.id;
}

function stripeObjectId(
  value: string | { id: string; deleted?: unknown } | null | undefined
): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value.deleted === true) return null;
  return value.id;
}

function isMissingStripeColumn(error: unknown): boolean {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current; depth += 1) {
    if (current instanceof Error) {
      parts.push(current.message);
      current = current.cause;
    } else {
      parts.push(String(current));
      break;
    }
  }
  const text = parts.join(" ");
  return /no such column/i.test(text) && /stripe_|subscription_current_period_end/i.test(text);
}

function isMissingStripeResource(error: unknown): boolean {
  return (
    error instanceof Stripe.errors.StripeInvalidRequestError &&
    error.code === "resource_missing"
  );
}
