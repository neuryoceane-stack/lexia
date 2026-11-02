import "server-only";

import Stripe from "stripe";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getStripe, isStripeBillingConfigured } from "@/lib/stripe";
import {
  SUBSCRIPTION_TRIAL_DAYS,
  assertSubscriptionStatus,
  subscriptionCheckoutIncludesTrial,
  type BillingPlan,
} from "@/lib/subscription";
import {
  PROMO_ALREADY_USED,
  PROMO_EMPTY,
  PROMO_NOT_FOUND,
  PROMO_TABLES_MISSING,
  PromoCodeError,
  checkoutPromoEffect,
  isMissingPromoTable,
  isPromoExpired,
  isUniqueConstraint,
  normalizePromoCode,
  promoBenefitLabel,
  promoCouponSpec,
  promoPlanHint,
  promoRedemptionIntent,
  promoRefusal,
  stripeCouponIdForCode,
  type PromoBenefitType,
} from "@/lib/promo-codes";
import {
  countPromoRedemptions,
  findPromoByCode,
  findPromoById,
  hasPromoRedemption,
  insertPromoCode,
  insertPromoRedemption,
  loadPromoDashboard,
  setPromoActive,
  setPromoStripeCouponId,
  type PromoCodeRecord,
  type PromoDashboard,
} from "@/lib/promo-codes-store";

export type PromoPreview = {
  code: string;
  benefitType: PromoBenefitType;
  value: number;
  label: string;
  appliesMonthly: boolean;
  appliesAnnual: boolean;
  planHint: string | null;
};

const STRIPE_REDEEM_BY_MAX_SEC = 4 * 365 * 24 * 60 * 60;

export async function listPromoCodes(): Promise<PromoDashboard> {
  return runPromo(() => loadPromoDashboard(db, new Date()));
}

export async function createPromoCode(input: {
  code: string;
  benefitType: PromoBenefitType;
  value: number;
  institution: string | null;
  maxUses: number | null;
  endsAt: Date | null;
  appliesMonthly: boolean;
  appliesAnnual: boolean;
}): Promise<{ couponReady: boolean }> {
  return runPromo(async () => {
    const id = crypto.randomUUID();
    const couponId = await createStripeCouponIfConfigured({
      id,
      code: input.code,
      benefitType: input.benefitType,
      value: input.value,
      maxUses: input.maxUses,
      endsAt: input.endsAt,
    });
    try {
      await insertPromoCode(db, {
        id,
        code: input.code,
        benefitType: input.benefitType,
        value: input.value,
        institution: input.institution,
        maxUses: input.maxUses,
        endsAt: input.endsAt,
        appliesMonthly: input.appliesMonthly,
        appliesAnnual: input.appliesAnnual,
        stripeCouponId: couponId,
      });
    } catch (error) {
      if (isUniqueConstraint(error)) {
        throw new PromoCodeError("Ce code existe déjà.", 409);
      }
      throw error;
    }
    return { couponReady: couponId != null || input.benefitType === "extended_trial" };
  });
}

export async function updatePromoActive(id: string, active: boolean): Promise<void> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    throw new PromoCodeError("Ce code est introuvable.", 404);
  }
  const updated = await runPromo(() => setPromoActive(db, id, active));
  if (!updated) throw new PromoCodeError("Ce code est introuvable.", 404);
}

export async function previewPromoCode(input: {
  userId: string;
  rawCode: string;
  includesTrial: boolean;
}): Promise<PromoPreview> {
  const code = normalizePromoCode(input.rawCode);
  if (!input.rawCode.trim()) throw new PromoCodeError(PROMO_EMPTY, 400);
  if (!code) throw new PromoCodeError(PROMO_NOT_FOUND, 404);

  const row = await runPromo(() => findPromoByCode(db, code));
  const facts = await usageFacts(row, input.userId);
  const appliesToPlan = row ? row.appliesMonthly || row.appliesAnnual : false;
  const message = promoRefusal({
    found: Boolean(row),
    active: row?.active ?? false,
    expired: row ? isPromoExpired(row.endsAt, new Date()) : false,
    limitReached: facts.limitReached,
    alreadyUsed: facts.alreadyUsed,
    appliesToPlan,
    extendedTrialBlocked: row?.benefitType === "extended_trial" && !input.includesTrial,
  });
  if (message || !row) throw new PromoCodeError(message ?? PROMO_NOT_FOUND, refusalStatus(message));

  return {
    code: row.code,
    benefitType: row.benefitType,
    value: row.value,
    label: promoBenefitLabel(row.benefitType, row.value),
    appliesMonthly: row.appliesMonthly,
    appliesAnnual: row.appliesAnnual,
    planHint: promoPlanHint(row.appliesMonthly, row.appliesAnnual),
  };
}

export async function resolvePromoForCheckout(input: {
  userId: string;
  rawCode: string;
  plan: BillingPlan;
  includesTrial: boolean;
}): Promise<{
  promoCodeId: string;
  code: string;
  trialPeriodDays: number | undefined;
  couponId: string | null;
}> {
  const code = normalizePromoCode(input.rawCode);
  if (!code) throw new PromoCodeError(PROMO_NOT_FOUND, 404);

  const row = await runPromo(() => findPromoByCode(db, code));
  const facts = await usageFacts(row, input.userId);
  const appliesToPlan = row
    ? input.plan === "monthly"
      ? row.appliesMonthly
      : row.appliesAnnual
    : false;
  const message = promoRefusal({
    found: Boolean(row),
    active: row?.active ?? false,
    expired: row ? isPromoExpired(row.endsAt, new Date()) : false,
    limitReached: facts.limitReached,
    alreadyUsed: facts.alreadyUsed,
    appliesToPlan,
    extendedTrialBlocked: row?.benefitType === "extended_trial" && !input.includesTrial,
  });
  if (message || !row) {
    throw new PromoCodeError(message ?? PROMO_NOT_FOUND, refusalStatus(message));
  }

  const effect = checkoutPromoEffect({
    includesTrial: input.includesTrial,
    defaultTrialDays: SUBSCRIPTION_TRIAL_DAYS,
    benefitType: row.benefitType,
    value: row.value,
    appliesMonthly: row.appliesMonthly,
    appliesAnnual: row.appliesAnnual,
    plan: input.plan,
  });
  if (!effect.ok) throw new PromoCodeError(effect.message, 400);

  const couponId = effect.attachCoupon ? await ensureStripeCoupon(row, true) : null;
  return {
    promoCodeId: row.id,
    code: row.code,
    trialPeriodDays: effect.trialPeriodDays,
    couponId,
  };
}

export async function recordPromoRedemptionFromCheckout(
  metadata: {
    promoCodeId?: string | null;
    userId?: string | null;
    promoCode?: string | null;
  } | null,
  eventCreated: number,
): Promise<void> {
  const intent = promoRedemptionIntent(metadata);
  if (intent.kind === "none") return;
  if (intent.kind === "missing-user") {
    throw new Error("Checkout promo sans utilisateur");
  }

  const row = await runPromo(() => findPromoById(db, intent.promoCodeId));
  if (!row) {
    throw new Error(`Code promo introuvable pour le webhook : ${intent.promoCodeId}`);
  }
  if (intent.code && intent.code !== row.code) {
    throw new Error(
      `metadata promo incohérente : ${intent.code} pour ${row.code} (${row.id})`,
    );
  }

  await runPromo(() =>
    insertPromoRedemption(db, {
      id: crypto.randomUUID(),
      promoCodeId: row.id,
      userId: intent.userId,
      redeemedAt: new Date(eventCreated * 1000),
    }),
  );
}

export async function loadIncludesTrial(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ subscriptionStatus: users.subscriptionStatus })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) throw new PromoCodeError("Compte introuvable.", 404);
  return subscriptionCheckoutIncludesTrial(assertSubscriptionStatus(row.subscriptionStatus));
}

async function usageFacts(
  row: PromoCodeRecord | null,
  userId: string,
): Promise<{ limitReached: boolean; alreadyUsed: boolean }> {
  if (!row) return { limitReached: false, alreadyUsed: false };
  const [used, alreadyUsed] = await runPromo(() =>
    Promise.all([
      countPromoRedemptions(db, row.id),
      hasPromoRedemption(db, row.id, userId),
    ]),
  );
  return {
    limitReached: row.maxUses != null && used >= row.maxUses,
    alreadyUsed,
  };
}

async function createStripeCouponIfConfigured(row: {
  id: string;
  code: string;
  benefitType: PromoBenefitType;
  value: number;
  maxUses: number | null;
  endsAt: Date | null;
}): Promise<string | null> {
  if (row.benefitType === "extended_trial") return null;
  if (!stripeSecretPresent()) return null;
  return ensureStripeCoupon(row, false);
}

function stripeSecretPresent(): boolean {
  if (isStripeBillingConfigured()) return true;
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (!key) return false;
  if (key.startsWith("sk_live") || key.startsWith("rk_live") || key.includes("_live_")) {
    throw new PromoCodeError("Une clé Stripe live est refusée. Utilisez une clé de test.", 503);
  }
  if (!key.startsWith("sk_test_") && !key.startsWith("rk_test_")) {
    throw new PromoCodeError("Une clé Stripe de test est requise pour créer le coupon.", 503);
  }
  return true;
}

async function ensureStripeCoupon(
  row: {
    id: string;
    code: string;
    benefitType: PromoBenefitType;
    value: number;
    maxUses: number | null;
    endsAt: Date | null;
    stripeCouponId?: string | null;
  },
  persist: boolean,
): Promise<string> {
  const spec = promoCouponSpec(row.benefitType, row.value);
  if (spec.kind === "none") {
    throw new Error(`Coupon demandé pour un avantage sans coupon (${row.benefitType})`);
  }

  const stripe = getStripe();
  const couponId = row.stripeCouponId || stripeCouponIdForCode(row.code);
  const existing = await stripe.coupons.retrieve(couponId).catch((error: unknown) => {
    if (isMissingStripeResource(error)) return null;
    throw error;
  });

  if (existing) {
    if (!couponMatches(existing, spec)) {
      throw new PromoCodeError(
        "Ce code a déjà un coupon Stripe différent. Choisissez un autre code.",
        409,
      );
    }
    if (persist && row.stripeCouponId !== existing.id) {
      await persistStripeCouponId(row.id, existing.id);
    }
    return existing.id;
  }

  const redeemBy = stripeRedeemBy(row.endsAt);
  try {
    const created = await stripe.coupons.create({
      id: couponId,
      name: `Code ${row.code}`.slice(0, 40),
      metadata: { promoCodeId: row.id, code: row.code },
      duration: spec.duration,
      ...(spec.percentOff != null ? { percent_off: spec.percentOff } : {}),
      ...(spec.amountOff != null ? { amount_off: spec.amountOff, currency: "eur" as const } : {}),
      ...(spec.durationInMonths != null ? { duration_in_months: spec.durationInMonths } : {}),
      ...(row.maxUses != null ? { max_redemptions: row.maxUses } : {}),
      ...(redeemBy != null ? { redeem_by: redeemBy } : {}),
    });
    if (persist) await persistStripeCouponId(row.id, created.id);
    return created.id;
  } catch (error) {
    if (!isStripeCouponConflict(error)) throw error;
    const raced = await stripe.coupons.retrieve(couponId);
    if (!couponMatches(raced, spec)) {
      throw new PromoCodeError(
        "Ce code a déjà un coupon Stripe différent. Choisissez un autre code.",
        409,
      );
    }
    if (persist) await persistStripeCouponId(row.id, raced.id);
    return raced.id;
  }
}

async function persistStripeCouponId(id: string, stripeCouponId: string): Promise<void> {
  try {
    await setPromoStripeCouponId(db, id, stripeCouponId);
  } catch (error) {
    if (isMissingPromoTable(error)) throw new PromoCodeError(PROMO_TABLES_MISSING, 503);
    throw error;
  }
}

function couponMatches(
  coupon: Stripe.Coupon,
  spec: Exclude<ReturnType<typeof promoCouponSpec>, { kind: "none" }>,
): boolean {
  if (coupon.duration !== spec.duration) return false;
  if ((spec.durationInMonths ?? null) !== (coupon.duration_in_months ?? null)) return false;
  if (spec.percentOff != null && coupon.percent_off !== spec.percentOff) return false;
  if (spec.amountOff != null && coupon.amount_off !== spec.amountOff) return false;
  if (spec.amountOff != null && coupon.currency !== "eur") return false;
  return true;
}

function stripeRedeemBy(endsAt: Date | null): number | null {
  if (!endsAt) return null;
  const seconds = Math.floor(endsAt.getTime() / 1000);
  const latest = Math.floor(Date.now() / 1000) + STRIPE_REDEEM_BY_MAX_SEC;
  if (seconds > latest) return null;
  return seconds;
}

function isMissingStripeResource(error: unknown): boolean {
  return (
    error instanceof Stripe.errors.StripeInvalidRequestError &&
    (error.code === "resource_missing" || error.statusCode === 404)
  );
}

function isStripeCouponConflict(error: unknown): boolean {
  return (
    error instanceof Stripe.errors.StripeInvalidRequestError &&
    error.code === "resource_already_exists"
  );
}

function refusalStatus(message: string | null): number {
  if (message === PROMO_NOT_FOUND) return 404;
  if (message === PROMO_TABLES_MISSING) return 503;
  if (message === PROMO_ALREADY_USED) return 409;
  return 400;
}

async function runPromo<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof PromoCodeError) throw error;
    if (isMissingPromoTable(error)) throw new PromoCodeError(PROMO_TABLES_MISSING, 503);
    throw error;
  }
}
