import { and, desc, eq, sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";
import { promoCodeRedemptions, promoCodes, users } from "@/lib/db/schema";
import {
  formatPromoEnd,
  isPromoBenefitType,
  isPromoExpired,
  isUniqueConstraint,
  promoAdvantageShort,
  promoBenefitLabel,
  promoConversionPercent,
  promoUsesLabel,
  type PromoBenefitType,
} from "@/lib/promo-codes";

export type PromoDatabase = BetterSQLite3Database<typeof schema>;

export type PromoCodeRecord = {
  id: string;
  code: string;
  benefitType: PromoBenefitType;
  value: number;
  institution: string | null;
  maxUses: number | null;
  endsAt: Date | null;
  appliesMonthly: boolean;
  appliesAnnual: boolean;
  active: boolean;
  stripeCouponId: string | null;
};

export type PromoCodeListItem = {
  id: string;
  code: string;
  benefitType: PromoBenefitType;
  value: number;
  label: string;
  advantage: string;
  institution: string | null;
  maxUses: number | null;
  used: number;
  usesLabel: string;
  inscrits: number;
  abonnes: number;
  endsAt: string | null;
  endsLabel: string;
  expired: boolean;
  active: boolean;
  appliesMonthly: boolean;
  appliesAnnual: boolean;
};

export type PromoDashboard = {
  summary: {
    activeCodes: number;
    signups: number;
    subscribers: number;
    conversionPercent: number | null;
  };
  codes: PromoCodeListItem[];
};

const promoColumns = {
  id: promoCodes.id,
  code: promoCodes.code,
  benefitType: promoCodes.benefitType,
  value: promoCodes.value,
  institution: promoCodes.institution,
  maxUses: promoCodes.maxUses,
  endsAt: promoCodes.endsAt,
  appliesMonthly: promoCodes.appliesMonthly,
  appliesAnnual: promoCodes.appliesAnnual,
  active: promoCodes.active,
  stripeCouponId: promoCodes.stripeCouponId,
};

export async function loadPromoDashboard(
  database: PromoDatabase,
  now: Date,
): Promise<PromoDashboard> {
  const rows = await database
    .select({
      ...promoColumns,
      createdAt: promoCodes.createdAt,
      used: sql<number>`count(${promoCodeRedemptions.id})`.mapWith(Number),
      inscrits: sql<number>`count(distinct ${promoCodeRedemptions.userId})`.mapWith(Number),
      abonnes:
        sql<number>`count(distinct case when ${users.subscriptionStatus} = 'active' then ${promoCodeRedemptions.userId} end)`.mapWith(
          Number,
        ),
    })
    .from(promoCodes)
    .leftJoin(promoCodeRedemptions, eq(promoCodeRedemptions.promoCodeId, promoCodes.id))
    .leftJoin(users, eq(users.id, promoCodeRedemptions.userId))
    .groupBy(
      promoCodes.id,
      promoCodes.code,
      promoCodes.benefitType,
      promoCodes.value,
      promoCodes.institution,
      promoCodes.maxUses,
      promoCodes.endsAt,
      promoCodes.appliesMonthly,
      promoCodes.appliesAnnual,
      promoCodes.active,
      promoCodes.stripeCouponId,
      promoCodes.createdAt,
    )
    .orderBy(desc(promoCodes.createdAt));

  const [totals] = await database
    .select({
      signups: sql<number>`count(distinct ${promoCodeRedemptions.userId})`.mapWith(Number),
      subscribers:
        sql<number>`count(distinct case when ${users.subscriptionStatus} = 'active' then ${promoCodeRedemptions.userId} end)`.mapWith(
          Number,
        ),
    })
    .from(promoCodeRedemptions)
    .leftJoin(users, eq(users.id, promoCodeRedemptions.userId));

  const signups = requireCount(totals?.signups, "inscriptions");
  const subscribers = requireCount(totals?.subscribers, "abonnés");

  const codes: PromoCodeListItem[] = rows.map((row) => {
    const benefitType = requireBenefit(row.benefitType);
    const used = requireCount(row.used, "utilisations");
    const inscrits = requireCount(row.inscrits, "inscrits");
    const abonnes = requireCount(row.abonnes, "abonnés du code");
    return {
      id: row.id,
      code: row.code,
      benefitType,
      value: row.value,
      label: promoBenefitLabel(benefitType, row.value),
      advantage: promoAdvantageShort(benefitType, row.value),
      institution: row.institution,
      maxUses: row.maxUses,
      used,
      usesLabel: promoUsesLabel(used, row.maxUses),
      inscrits,
      abonnes,
      endsAt: row.endsAt ? row.endsAt.toISOString() : null,
      endsLabel: formatPromoEnd(row.endsAt),
      expired: isPromoExpired(row.endsAt, now),
      active: row.active,
      appliesMonthly: row.appliesMonthly,
      appliesAnnual: row.appliesAnnual,
    };
  });

  return {
    summary: {
      activeCodes: codes.filter((code) => code.active).length,
      signups,
      subscribers,
      conversionPercent: promoConversionPercent(subscribers, signups),
    },
    codes,
  };
}

export async function findPromoByCode(
  database: PromoDatabase,
  code: string,
): Promise<PromoCodeRecord | null> {
  const [row] = await database
    .select(promoColumns)
    .from(promoCodes)
    .where(eq(promoCodes.code, code))
    .limit(1);
  return row ? toRecord(row) : null;
}

export async function findPromoById(
  database: PromoDatabase,
  id: string,
): Promise<PromoCodeRecord | null> {
  const [row] = await database
    .select(promoColumns)
    .from(promoCodes)
    .where(eq(promoCodes.id, id))
    .limit(1);
  return row ? toRecord(row) : null;
}

export async function countPromoRedemptions(
  database: PromoDatabase,
  promoCodeId: string,
): Promise<number> {
  const [row] = await database
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(promoCodeRedemptions)
    .where(eq(promoCodeRedemptions.promoCodeId, promoCodeId));
  return requireCount(row?.count, "utilisations");
}

export async function hasPromoRedemption(
  database: PromoDatabase,
  promoCodeId: string,
  userId: string,
): Promise<boolean> {
  const [row] = await database
    .select({ id: promoCodeRedemptions.id })
    .from(promoCodeRedemptions)
    .where(
      and(
        eq(promoCodeRedemptions.promoCodeId, promoCodeId),
        eq(promoCodeRedemptions.userId, userId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function insertPromoCode(
  database: PromoDatabase,
  values: {
    id: string;
    code: string;
    benefitType: PromoBenefitType;
    value: number;
    institution: string | null;
    maxUses: number | null;
    endsAt: Date | null;
    appliesMonthly: boolean;
    appliesAnnual: boolean;
    stripeCouponId: string | null;
  },
): Promise<void> {
  await database.insert(promoCodes).values({
    id: values.id,
    code: values.code,
    benefitType: values.benefitType,
    value: values.value,
    institution: values.institution,
    maxUses: values.maxUses,
    endsAt: values.endsAt,
    appliesMonthly: values.appliesMonthly,
    appliesAnnual: values.appliesAnnual,
    active: true,
    stripeCouponId: values.stripeCouponId,
  });
}

export async function setPromoActive(
  database: PromoDatabase,
  id: string,
  active: boolean,
): Promise<boolean> {
  const updated = await database
    .update(promoCodes)
    .set({ active })
    .where(eq(promoCodes.id, id))
    .returning({ id: promoCodes.id });
  return updated.length > 0;
}

export async function setPromoStripeCouponId(
  database: PromoDatabase,
  id: string,
  stripeCouponId: string,
): Promise<void> {
  await database.update(promoCodes).set({ stripeCouponId }).where(eq(promoCodes.id, id));
}

/** False si cet élève a déjà une ligne pour ce code (webhook rejoué). */
export async function insertPromoRedemption(
  database: PromoDatabase,
  values: { id: string; promoCodeId: string; userId: string; redeemedAt: Date },
): Promise<boolean> {
  try {
    await database.insert(promoCodeRedemptions).values(values);
    return true;
  } catch (error) {
    if (isUniqueConstraint(error)) return false;
    throw error;
  }
}

function toRecord(row: {
  id: string;
  code: string;
  benefitType: string;
  value: number;
  institution: string | null;
  maxUses: number | null;
  endsAt: Date | null;
  appliesMonthly: boolean;
  appliesAnnual: boolean;
  active: boolean;
  stripeCouponId: string | null;
}): PromoCodeRecord {
  return {
    ...row,
    benefitType: requireBenefit(row.benefitType),
    institution: row.institution?.trim() ? row.institution.trim() : null,
  };
}

function requireBenefit(value: string): PromoBenefitType {
  if (!isPromoBenefitType(value)) {
    throw new Error(`benefit_type inconnu : ${value}`);
  }
  return value;
}

function requireCount(value: unknown, label: string): number {
  const count = typeof value === "bigint" ? Number(value) : Number(value);
  if (!Number.isFinite(count)) {
    throw new Error(`Compte ${label} illisible`);
  }
  return count;
}
