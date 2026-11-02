import { OFFER_TRIAL_DAYS } from "@/lib/offer";

export const PROMO_BENEFIT_TYPES = [
  "percent",
  "fixed_amount",
  "free_months",
  "extended_trial",
] as const;

export type PromoBenefitType = (typeof PROMO_BENEFIT_TYPES)[number];

export const PROMO_CODE_MIN_LENGTH = 3;
export const PROMO_CODE_MAX_LENGTH = 32;
/** Limite Stripe de trial_period_days. */
export const PROMO_TRIAL_DAYS_MAX = 730;
/** Limite pratique d'un coupon repeating. */
export const PROMO_MONTHS_MAX = 36;
/** 10 000 €, en centimes. */
export const PROMO_FIXED_CENTS_MAX = 1_000_000;
export const PROMO_INSTITUTION_MAX = 120;
/** Stripe refuse un redeem_by à plus de 5 ans. On reste en deçà. */
const PROMO_END_MAX_MS = 5 * 365 * 24 * 60 * 60 * 1000;

export const PROMO_NOT_FOUND = "Ce code n'existe pas.";
export const PROMO_EXPIRED = "Ce code a expiré.";
export const PROMO_UNAVAILABLE = "Ce code n'est plus disponible.";
export const PROMO_WRONG_PLAN = "Ce code ne s'applique pas à ce plan.";
export const PROMO_ALREADY_USED = "Vous avez déjà utilisé ce code.";
export const PROMO_TABLES_MISSING = "Les codes promo ne sont pas encore en place.";
export const PROMO_TRIAL_ONCE =
  "Ce code prolonge l'essai, qui n'est proposé qu'une seule fois.";
export const PROMO_EMPTY = "Saisissez un code.";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export class PromoCodeError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PromoCodeError";
    this.status = status;
  }
}

export function isPromoBenefitType(value: unknown): value is PromoBenefitType {
  return (
    typeof value === "string" &&
    (PROMO_BENEFIT_TYPES as readonly string[]).includes(value)
  );
}

export function normalizePromoCode(raw: string): string | null {
  const code = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (code.length < PROMO_CODE_MIN_LENGTH || code.length > PROMO_CODE_MAX_LENGTH) {
    return null;
  }
  if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(code)) return null;
  return code;
}

/** Code lisible, en majuscules, avec un tiret. Sans I, O, 0 ni 1. */
export function generatePromoCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let alphabetIndex = 0;
  const chars: string[] = [];
  while (chars.length < 8) {
    if (alphabetIndex >= bytes.length) {
      crypto.getRandomValues(bytes);
      alphabetIndex = 0;
    }
    const value = bytes[alphabetIndex];
    alphabetIndex += 1;
    if (value === undefined || value >= 256 - (256 % CODE_ALPHABET.length)) continue;
    chars.push(CODE_ALPHABET[value % CODE_ALPHABET.length] ?? "");
  }
  return `${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}

export function formatPromoCount(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

export function formatPromoEurosFromCents(cents: number): string {
  const euros = cents / 100;
  const hasCents = cents % 100 !== 0;
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(euros);
  return `${formatted}\u00a0€`;
}

/** Phrase affichée à l'élève avant le paiement. */
export function promoBenefitLabel(type: PromoBenefitType, value: number): string {
  switch (type) {
    case "percent":
      return `-${value}\u00a0% sur votre abonnement`;
    case "fixed_amount":
      return `-${formatPromoEurosFromCents(value)} sur votre abonnement`;
    case "free_months":
      return value === 1 ? "1 mois offert" : `${value} mois offerts`;
    case "extended_trial":
      return value === 1 ? "Essai de 1 jour" : `Essai de ${value} jours`;
    default: {
      const unexpected: never = type;
      throw new Error(`Avantage inconnu : ${String(unexpected)}`);
    }
  }
}

/** Colonne Avantage du tableau créateur. */
export function promoAdvantageShort(type: PromoBenefitType, value: number): string {
  switch (type) {
    case "percent":
      return `-${value}\u00a0%`;
    case "fixed_amount":
      return `-${formatPromoEurosFromCents(value)}`;
    case "free_months":
      return value === 1 ? "1 mois offert" : `${value} mois offerts`;
    case "extended_trial":
      return value === 1 ? "Essai de 1 jour" : `Essai de ${value} jours`;
    default: {
      const unexpected: never = type;
      throw new Error(`Avantage inconnu : ${String(unexpected)}`);
    }
  }
}

export function promoBenefitName(type: PromoBenefitType): string {
  switch (type) {
    case "percent":
      return "Pourcentage";
    case "fixed_amount":
      return "Montant fixe";
    case "free_months":
      return "Mois offerts";
    case "extended_trial":
      return "Essai prolongé";
    default: {
      const unexpected: never = type;
      throw new Error(`Avantage inconnu : ${String(unexpected)}`);
    }
  }
}

export function promoValueField(type: PromoBenefitType): {
  label: string;
  unit: string;
  hint: string;
} {
  switch (type) {
    case "percent":
      return {
        label: "Pourcentage",
        unit: "%",
        hint: "De 1 à 100. Retiré du premier paiement, après l'essai.",
      };
    case "fixed_amount":
      return {
        label: "Montant",
        unit: "€",
        hint: "Retiré du premier paiement, après l'essai.",
      };
    case "free_months":
      return {
        label: "Nombre de mois",
        unit: "mois",
        hint: "Ces mois sont offerts sur les paiements après l'essai. Sur la formule annuelle, la facture de l'année est offerte si elle tombe dans la période.",
      };
    case "extended_trial":
      return {
        label: "Durée de l'essai",
        unit: "jours",
        hint: `Remplace l'essai de ${OFFER_TRIAL_DAYS} jours. La carte bancaire reste demandée.`,
      };
    default: {
      const unexpected: never = type;
      throw new Error(`Avantage inconnu : ${String(unexpected)}`);
    }
  }
}

export function promoPlanHint(
  appliesMonthly: boolean,
  appliesAnnual: boolean,
): string | null {
  if (appliesMonthly && appliesAnnual) return null;
  if (appliesMonthly) return "Ce code s'applique à la formule mensuelle.";
  if (appliesAnnual) return "Ce code s'applique à la formule annuelle.";
  return PROMO_WRONG_PLAN;
}

export function promoUsesLabel(used: number, maxUses: number | null): string {
  const count = formatPromoCount(used);
  if (maxUses == null) return `${count} / illimité`;
  return `${count} / ${formatPromoCount(maxUses)}`;
}

/** Null tant qu'aucune inscription ne permet un pourcentage. */
export function promoConversionPercent(
  subscribers: number,
  signups: number,
): number | null {
  if (signups <= 0) return null;
  return Math.round((subscribers / signups) * 100);
}

export type PromoCouponSpec =
  | { kind: "none" }
  | {
      kind: "coupon";
      percentOff?: number;
      amountOff?: number;
      currency?: "eur";
      duration: "once" | "repeating";
      durationInMonths?: number;
    };

/**
 * Pourcentage et montant fixe : une fois, sur le premier paiement.
 * Une facture d'essai à 0 € ne consomme pas ce coupon (Stripe ignore
 * les coupons sur une facture déjà à zéro).
 * Mois offerts : 100 % pendant N mois à partir du début de l'abonnement.
 */
export function promoCouponSpec(
  type: PromoBenefitType,
  value: number,
): PromoCouponSpec {
  switch (type) {
    case "extended_trial":
      return { kind: "none" };
    case "percent":
      return { kind: "coupon", percentOff: value, duration: "once" };
    case "fixed_amount":
      return { kind: "coupon", amountOff: value, currency: "eur", duration: "once" };
    case "free_months":
      return {
        kind: "coupon",
        percentOff: 100,
        duration: "repeating",
        durationInMonths: value,
      };
    default: {
      const unexpected: never = type;
      throw new Error(`Avantage inconnu : ${String(unexpected)}`);
    }
  }
}

export function stripeCouponIdForCode(code: string): string {
  return `kim_${code}`;
}

export type CheckoutPromoEffect =
  | { ok: true; trialPeriodDays: number | undefined; attachCoupon: boolean }
  | { ok: false; message: string };

/** Décide l'essai et le coupon, une fois le code déjà jugé utilisable. */
export function checkoutPromoEffect(input: {
  includesTrial: boolean;
  defaultTrialDays: number;
  benefitType: PromoBenefitType;
  value: number;
  appliesMonthly: boolean;
  appliesAnnual: boolean;
  plan: "monthly" | "annual";
}): CheckoutPromoEffect {
  const applies = input.plan === "monthly" ? input.appliesMonthly : input.appliesAnnual;
  if (!applies) return { ok: false, message: PROMO_WRONG_PLAN };
  if (input.benefitType === "extended_trial") {
    if (!input.includesTrial) return { ok: false, message: PROMO_TRIAL_ONCE };
    return { ok: true, trialPeriodDays: input.value, attachCoupon: false };
  }
  return {
    ok: true,
    trialPeriodDays: input.includesTrial ? input.defaultTrialDays : undefined,
    attachCoupon: true,
  };
}

export type PromoRedemptionIntent =
  | { kind: "none" }
  | { kind: "missing-user" }
  | { kind: "record"; promoCodeId: string; userId: string; code: string | null };

export function promoRedemptionIntent(
  metadata:
    | {
        promoCodeId?: string | null;
        userId?: string | null;
        promoCode?: string | null;
      }
    | null
    | undefined,
): PromoRedemptionIntent {
  const promoCodeId = metadata?.promoCodeId?.trim() ?? "";
  if (!promoCodeId) return { kind: "none" };
  const userId = metadata?.userId?.trim() ?? "";
  if (!userId) return { kind: "missing-user" };
  const rawCode = metadata?.promoCode?.trim() ?? "";
  return {
    kind: "record",
    promoCodeId,
    userId,
    code: rawCode ? rawCode.toUpperCase() : null,
  };
}

export function endOfParisDay(isoDate: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return null;
  const calendar = new Date(Date.UTC(year, month - 1, day));
  if (
    calendar.getUTCFullYear() !== year ||
    calendar.getUTCMonth() !== month - 1 ||
    calendar.getUTCDate() !== day
  ) {
    return null;
  }

  const localAsUtc = Date.UTC(year, month - 1, day, 23, 59, 59, 999);
  let instant = localAsUtc - timeZoneOffsetMs(new Date(localAsUtc), "Europe/Paris");
  const corrected = timeZoneOffsetMs(new Date(instant), "Europe/Paris");
  instant = localAsUtc - corrected;
  const result = new Date(instant);
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(result);
  if (formatted !== isoDate) return null;
  return result;
}

function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const floored = new Date(Math.floor(date.getTime() / 1000) * 1000);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(floored);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour) % 24,
    Number(map.minute),
    Number(map.second),
  );
  return asUtc - floored.getTime();
}

export function formatPromoEnd(endsAt: Date | null): string {
  if (!endsAt) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(endsAt);
}

export function isPromoExpired(endsAt: Date | null, now: Date): boolean {
  return endsAt != null && endsAt.getTime() <= now.getTime();
}

export type NormalizedPromoDraft = {
  code: string;
  benefitType: PromoBenefitType;
  /** Pourcentage, centimes, mois ou jours, selon benefitType. */
  value: number;
  institution: string | null;
  maxUses: number | null;
  endsAt: Date | null;
  appliesMonthly: boolean;
  appliesAnnual: boolean;
};

export function parsePromoDraft(
  body: unknown,
  now: Date,
): { ok: true; draft: NormalizedPromoDraft } | { ok: false; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Requête invalide." };
  }
  const record = body as Record<string, unknown>;

  if (typeof record.code !== "string" || record.code.trim() === "") {
    return { ok: false, message: PROMO_EMPTY };
  }
  const code = normalizePromoCode(record.code);
  if (!code) {
    return {
      ok: false,
      message: "Le code ne peut contenir que des lettres, des chiffres et des tirets.",
    };
  }

  if (!isPromoBenefitType(record.benefitType)) {
    return { ok: false, message: "Choisissez un avantage." };
  }

  const value = storedValue(record.benefitType, record.value);
  if (!value.ok) return value;

  const institution = readInstitution(record.institution);
  if (!institution.ok) return institution;

  const maxUses = readMaxUses(record.maxUses);
  if (!maxUses.ok) return maxUses;

  const endsAt = readEndsAt(record.endsOn, now);
  if (!endsAt.ok) return endsAt;

  const appliesMonthly = record.appliesMonthly === true;
  const appliesAnnual = record.appliesAnnual === true;
  if (!appliesMonthly && !appliesAnnual) {
    return { ok: false, message: "Choisissez au moins une formule." };
  }

  return {
    ok: true,
    draft: {
      code,
      benefitType: record.benefitType,
      value: value.value,
      institution: institution.value,
      maxUses: maxUses.value,
      endsAt: endsAt.value,
      appliesMonthly,
      appliesAnnual,
    },
  };
}

function storedValue(
  type: PromoBenefitType,
  raw: unknown,
): { ok: true; value: number } | { ok: false; message: string } {
  if (type === "fixed_amount") {
    const cents = parseEurosToCents(raw);
    if (cents == null) {
      return { ok: false, message: "Indiquez un montant supérieur à 0 €." };
    }
    if (cents > PROMO_FIXED_CENTS_MAX) {
      return { ok: false, message: "Indiquez un montant inférieur ou égal à 10\u00a0000 €." };
    }
    return { ok: true, value: cents };
  }

  const integer = readPositiveInteger(raw);
  if (integer == null) {
    return { ok: false, message: positiveIntegerMessage(type) };
  }
  if (type === "percent" && (integer < 1 || integer > 100)) {
    return { ok: false, message: "Indiquez un pourcentage entre 1 et 100." };
  }
  if (type === "free_months" && integer > PROMO_MONTHS_MAX) {
    return { ok: false, message: `Indiquez un nombre de mois entre 1 et ${PROMO_MONTHS_MAX}.` };
  }
  if (type === "extended_trial" && integer > PROMO_TRIAL_DAYS_MAX) {
    return {
      ok: false,
      message: `Indiquez une durée d'essai entre 1 et ${PROMO_TRIAL_DAYS_MAX} jours.`,
    };
  }
  return { ok: true, value: integer };
}

function positiveIntegerMessage(type: PromoBenefitType): string {
  switch (type) {
    case "percent":
      return "Indiquez un pourcentage entre 1 et 100.";
    case "free_months":
      return "Indiquez un nombre entier de mois.";
    case "extended_trial":
      return "Indiquez un nombre entier de jours.";
    case "fixed_amount":
      return "Indiquez un montant supérieur à 0 €.";
    default: {
      const unexpected: never = type;
      return `Valeur invalide (${String(unexpected)}).`;
    }
  }
}

function readPositiveInteger(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 1) return null;
    return raw;
  }
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!/^[1-9]\d*$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value) || value < 1) return null;
  return value;
}

function parseEurosToCents(raw: unknown): number | null {
  const text =
    typeof raw === "number" && Number.isFinite(raw)
      ? String(raw)
      : typeof raw === "string"
        ? raw.trim().replace(/\s/g, "").replace(",", ".")
        : null;
  if (text == null || !/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const [whole, frac = ""] = text.split(".");
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents < 1) return null;
  return cents;
}

function readInstitution(
  raw: unknown,
): { ok: true; value: string | null } | { ok: false; message: string } {
  if (raw == null) return { ok: true, value: null };
  if (typeof raw !== "string") {
    return { ok: false, message: "Le nom d'établissement est invalide." };
  }
  const institution = raw.trim();
  if (institution === "") return { ok: true, value: null };
  if (institution.length > PROMO_INSTITUTION_MAX) {
    return {
      ok: false,
      message: `L'établissement ne peut pas dépasser ${PROMO_INSTITUTION_MAX} caractères.`,
    };
  }
  return { ok: true, value: institution };
}

function readMaxUses(
  raw: unknown,
): { ok: true; value: number | null } | { ok: false; message: string } {
  if (raw == null) return { ok: true, value: null };
  if (typeof raw === "string" && raw.trim() === "") return { ok: true, value: null };
  const value = readPositiveInteger(raw);
  if (value == null || value > 1_000_000) {
    return {
      ok: false,
      message: "Indiquez une limite d'au moins 1, ou laissez le champ vide.",
    };
  }
  return { ok: true, value };
}

function readEndsAt(
  raw: unknown,
  now: Date,
): { ok: true; value: Date | null } | { ok: false; message: string } {
  if (raw == null) return { ok: true, value: null };
  if (typeof raw !== "string" || raw.trim() === "") return { ok: true, value: null };
  const endsAt = endOfParisDay(raw.trim());
  if (!endsAt) return { ok: false, message: "Indiquez une date de fin valide." };
  if (endsAt.getTime() <= now.getTime()) {
    return { ok: false, message: "Choisissez une date de fin à venir." };
  }
  if (endsAt.getTime() > now.getTime() + PROMO_END_MAX_MS) {
    return { ok: false, message: "La date de fin ne peut pas dépasser 5 ans." };
  }
  return { ok: true, value: endsAt };
}

/** Ordre des messages élève. Null si le code peut être utilisé. */
export function promoRefusal(input: {
  found: boolean;
  active: boolean;
  expired: boolean;
  limitReached: boolean;
  alreadyUsed: boolean;
  appliesToPlan: boolean;
  extendedTrialBlocked: boolean;
}): string | null {
  if (!input.found) return PROMO_NOT_FOUND;
  if (input.alreadyUsed) return PROMO_ALREADY_USED;
  if (!input.active || input.limitReached) return PROMO_UNAVAILABLE;
  if (input.expired) return PROMO_EXPIRED;
  if (!input.appliesToPlan) return PROMO_WRONG_PLAN;
  if (input.extendedTrialBlocked) return PROMO_TRIAL_ONCE;
  return null;
}

export function readOptionalPromoCode(
  body: unknown,
): { ok: true; code: string | null } | { ok: false; message: string } {
  if (!body || typeof body !== "object" || !("promoCode" in body)) {
    return { ok: true, code: null };
  }
  const value = (body as { promoCode?: unknown }).promoCode;
  if (value == null || value === "") return { ok: true, code: null };
  if (typeof value !== "string") return { ok: false, message: "Requête invalide." };
  return { ok: true, code: value };
}

export function isMissingPromoTable(error: unknown): boolean {
  const text = errorText(error);
  return (
    /no such table:\s*promo_codes\b/i.test(text) ||
    /no such table:\s*promo_code_redemptions\b/i.test(text)
  );
}

export function isUniqueConstraint(error: unknown): boolean {
  const text = errorText(error);
  if (/unique constraint failed/i.test(text)) return true;
  return /SQLITE_CONSTRAINT_UNIQUE/.test(text);
}

function errorText(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (current instanceof Error) {
      parts.push(current.message);
      const code = (current as { code?: unknown }).code;
      if (typeof code === "string") parts.push(code);
      current = current.cause;
    } else if (typeof current === "object") {
      const record = current as { message?: unknown; code?: unknown; cause?: unknown };
      if (typeof record.message === "string") parts.push(record.message);
      if (typeof record.code === "string") parts.push(record.code);
      current = record.cause;
    } else {
      parts.push(String(current));
      break;
    }
  }
  return parts.join(" ");
}
