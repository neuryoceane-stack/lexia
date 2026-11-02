import assert from "node:assert/strict";
import { describe, it } from "node:test";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./db/schema";
import {
  PROMO_ALREADY_USED,
  PROMO_EXPIRED,
  PROMO_NOT_FOUND,
  PROMO_TRIAL_ONCE,
  PROMO_UNAVAILABLE,
  PROMO_WRONG_PLAN,
  checkoutPromoEffect,
  endOfParisDay,
  generatePromoCode,
  isMissingPromoTable,
  isPromoExpired,
  isUniqueConstraint,
  normalizePromoCode,
  parsePromoDraft,
  promoAdvantageShort,
  promoBenefitLabel,
  promoConversionPercent,
  promoCouponSpec,
  promoRedemptionIntent,
  promoRefusal,
  promoUsesLabel,
} from "./promo-codes";
import { PROMO_SCHEMA_STATEMENTS } from "./promo-codes-sql";
import { loadPromoDashboard } from "./promo-codes-store";

describe("normalizePromoCode", () => {
  it("met en majuscules et retire les espaces", () => {
    assert.equal(normalizePromoCode("  lycee-20 "), "LYCEE-20");
  });

  it("refuse un tiret en bord ou un caractère interdit", () => {
    assert.equal(normalizePromoCode("-LYCEE"), null);
    assert.equal(normalizePromoCode("LYCÉE"), null);
    assert.equal(normalizePromoCode("AB"), null);
  });
});

describe("generatePromoCode", () => {
  it("produit un code lisible, unique dans un petit échantillon", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 20; i += 1) {
      const code = generatePromoCode();
      assert.match(code, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/);
      codes.add(code);
    }
    assert.equal(codes.size, 20);
  });
});

describe("libellés", () => {
  it("décrit l'avantage au vouvoiement", () => {
    assert.equal(promoBenefitLabel("percent", 20), "-20\u00a0% sur votre abonnement");
    assert.equal(promoBenefitLabel("fixed_amount", 500), "-5\u00a0€ sur votre abonnement");
    assert.equal(promoBenefitLabel("fixed_amount", 550), "-5,50\u00a0€ sur votre abonnement");
    assert.equal(promoBenefitLabel("free_months", 1), "1 mois offert");
    assert.equal(promoBenefitLabel("free_months", 2), "2 mois offerts");
    assert.equal(promoBenefitLabel("extended_trial", 30), "Essai de 30 jours");
    assert.equal(promoAdvantageShort("percent", 20), "-20\u00a0%");
    assert.equal(promoUsesLabel(3, null), "3 / illimité");
    assert.equal(promoUsesLabel(3, 50), "3 / 50");
  });

  it("ne calcule pas un pourcentage sans inscription", () => {
    assert.equal(promoConversionPercent(0, 0), null);
    assert.equal(promoConversionPercent(1, 4), 25);
  });
});

describe("parsePromoDraft", () => {
  const now = new Date("2026-06-15T12:00:00.000Z");

  it("accepte les quatre avantages et convertit les euros en centimes", () => {
    const percent = parsePromoDraft(
      {
        code: "rentree",
        benefitType: "percent",
        value: "20",
        institution: "  Lycée Pasteur  ",
        maxUses: "",
        endsOn: "2026-12-31",
        appliesMonthly: true,
        appliesAnnual: false,
      },
      now,
    );
    assert.equal(percent.ok, true);
    if (!percent.ok) return;
    assert.equal(percent.draft.code, "RENTREE");
    assert.equal(percent.draft.value, 20);
    assert.equal(percent.draft.institution, "Lycée Pasteur");
    assert.equal(percent.draft.maxUses, null);
    assert.equal(percent.draft.appliesAnnual, false);

    const fixed = parsePromoDraft(
      {
        code: "MOINS-5",
        benefitType: "fixed_amount",
        value: "5,50",
        appliesMonthly: true,
        appliesAnnual: true,
      },
      now,
    );
    assert.equal(fixed.ok, true);
    if (fixed.ok) assert.equal(fixed.draft.value, 550);
  });

  it("refuse les valeurs hors limites", () => {
    assert.equal(
      parsePromoDraft({ code: "A", benefitType: "percent", value: 0, appliesMonthly: true }, now).ok,
      false,
    );
    const tooHigh = parsePromoDraft(
      { code: "CODE", benefitType: "percent", value: 101, appliesMonthly: true },
      now,
    );
    assert.equal(tooHigh.ok, false);
    if (!tooHigh.ok) assert.match(tooHigh.message, /1 et 100/);

    const zeroEuros = parsePromoDraft(
      { code: "CODE", benefitType: "fixed_amount", value: "0", appliesMonthly: true },
      now,
    );
    assert.equal(zeroEuros.ok, false);

    const noPlan = parsePromoDraft(
      { code: "CODE", benefitType: "free_months", value: 2, appliesMonthly: false, appliesAnnual: false },
      now,
    );
    assert.equal(noPlan.ok, false);
    if (!noPlan.ok) assert.equal(noPlan.message, "Choisissez au moins une formule.");

    const past = parsePromoDraft(
      { code: "CODE", benefitType: "extended_trial", value: 30, endsOn: "2020-01-01", appliesAnnual: true },
      now,
    );
    assert.equal(past.ok, false);
  });
});

describe("fin de journée à Paris", () => {
  it("ferme la journée en heure d'hiver et en heure d'été", () => {
    assert.equal(endOfParisDay("2026-01-15")?.toISOString(), "2026-01-15T22:59:59.999Z");
    assert.equal(endOfParisDay("2026-07-15")?.toISOString(), "2026-07-15T21:59:59.999Z");
    assert.equal(endOfParisDay("2026-02-31"), null);
  });

  it("considère le code expiré après cette seconde", () => {
    const ends = endOfParisDay("2026-01-15");
    assert.ok(ends);
    assert.equal(isPromoExpired(ends, new Date("2026-01-15T22:59:59.000Z")), false);
    assert.equal(isPromoExpired(ends, new Date("2026-01-15T23:00:00.000Z")), true);
  });
});

describe("décision de paiement", () => {
  it("laisse l'essai de 15 jours pour un pourcentage", () => {
    const effect = checkoutPromoEffect({
      includesTrial: true,
      defaultTrialDays: 15,
      benefitType: "percent",
      value: 20,
      appliesMonthly: true,
      appliesAnnual: false,
      plan: "monthly",
    });
    assert.deepEqual(effect, { ok: true, trialPeriodDays: 15, attachCoupon: true });
    assert.deepEqual(promoCouponSpec("percent", 20), {
      kind: "coupon",
      percentOff: 20,
      duration: "once",
    });
    assert.deepEqual(promoCouponSpec("fixed_amount", 500), {
      kind: "coupon",
      amountOff: 500,
      currency: "eur",
      duration: "once",
    });
    assert.deepEqual(promoCouponSpec("free_months", 2), {
      kind: "coupon",
      percentOff: 100,
      duration: "repeating",
      durationInMonths: 2,
    });
  });

  it("remplace l'essai et refuse un second essai", () => {
    const extended = checkoutPromoEffect({
      includesTrial: true,
      defaultTrialDays: 15,
      benefitType: "extended_trial",
      value: 30,
      appliesMonthly: true,
      appliesAnnual: true,
      plan: "annual",
    });
    assert.deepEqual(extended, { ok: true, trialPeriodDays: 30, attachCoupon: false });

    const blocked = checkoutPromoEffect({
      includesTrial: false,
      defaultTrialDays: 15,
      benefitType: "extended_trial",
      value: 30,
      appliesMonthly: true,
      appliesAnnual: true,
      plan: "monthly",
    });
    assert.deepEqual(blocked, { ok: false, message: PROMO_TRIAL_ONCE });
  });

  it("refuse le plan non concerné", () => {
    const effect = checkoutPromoEffect({
      includesTrial: true,
      defaultTrialDays: 15,
      benefitType: "percent",
      value: 10,
      appliesMonthly: false,
      appliesAnnual: true,
      plan: "monthly",
    });
    assert.deepEqual(effect, { ok: false, message: PROMO_WRONG_PLAN });
  });

  it("sans code, l'intention de rédemption est vide", () => {
    assert.deepEqual(promoRedemptionIntent(null), { kind: "none" });
    assert.deepEqual(promoRedemptionIntent({ promoCodeId: "id" }), { kind: "missing-user" });
    assert.deepEqual(promoRedemptionIntent({ promoCodeId: "id", userId: "user", promoCode: "abc" }), {
      kind: "record",
      promoCodeId: "id",
      userId: "user",
      code: "ABC",
    });
  });
});

describe("promoRefusal", () => {
  const base = {
    found: true,
    active: true,
    expired: false,
    limitReached: false,
    alreadyUsed: false,
    appliesToPlan: true,
    extendedTrialBlocked: false,
  };

  it("donne le message le plus précis", () => {
    assert.equal(promoRefusal({ ...base, found: false, expired: true }), PROMO_NOT_FOUND);
    assert.equal(promoRefusal({ ...base, alreadyUsed: true, expired: true }), PROMO_ALREADY_USED);
    assert.equal(promoRefusal({ ...base, active: false }), PROMO_UNAVAILABLE);
    assert.equal(promoRefusal({ ...base, limitReached: true }), PROMO_UNAVAILABLE);
    assert.equal(promoRefusal({ ...base, expired: true }), PROMO_EXPIRED);
    assert.equal(promoRefusal({ ...base, appliesToPlan: false }), PROMO_WRONG_PLAN);
    assert.equal(promoRefusal({ ...base, extendedTrialBlocked: true }), PROMO_TRIAL_ONCE);
    assert.equal(promoRefusal(base), null);
  });
});

describe("erreurs de base", () => {
  it("reconnaît une table absente et une contrainte unique", () => {
    const missing = new Error("Failed query");
    missing.cause = new Error("SQLITE_ERROR: no such table: promo_codes");
    assert.equal(isMissingPromoTable(missing), true);
    assert.equal(isMissingPromoTable(new Error("no such table: users")), false);

    const unique = new Error("UNIQUE constraint failed: promo_codes.code");
    assert.equal(isUniqueConstraint(unique), true);
  });
});

describe("schéma SQL", () => {
  it("accepte le SQL prévu et refuse un second usage du même code", async () => {
    const sqlite = new Database(":memory:");
    sqlite.exec(`CREATE TABLE users (
      id TEXT PRIMARY KEY NOT NULL,
      subscription_status TEXT NOT NULL DEFAULT 'inactive'
    )`);
    for (const statement of PROMO_SCHEMA_STATEMENTS) sqlite.exec(statement);
    for (const statement of PROMO_SCHEMA_STATEMENTS) sqlite.exec(statement);

    const database = drizzle(sqlite, { schema });
    sqlite.prepare("INSERT INTO users (id, subscription_status) VALUES (?, ?)").run("eleve-1", "active");
    sqlite.prepare("INSERT INTO users (id, subscription_status) VALUES (?, ?)").run("eleve-2", "trialing");

    const endsAt = endOfParisDay("2026-07-15");
    assert.ok(endsAt);
    await database.insert(schema.promoCodes).values({
      id: "promo-1",
      code: "LYCEE-20",
      benefitType: "percent",
      value: 20,
      institution: "Lycée",
      maxUses: 10,
      endsAt,
      appliesMonthly: true,
      appliesAnnual: false,
      active: true,
    });

    await assert.rejects(
      database.insert(schema.promoCodes).values({
        id: "promo-2",
        code: "LYCEE-20",
        benefitType: "percent",
        value: 10,
        appliesMonthly: true,
        appliesAnnual: true,
        active: true,
      }),
    );

    await database.insert(schema.promoCodeRedemptions).values({
      id: "use-1",
      promoCodeId: "promo-1",
      userId: "eleve-1",
      redeemedAt: new Date("2026-06-01T10:00:00.000Z"),
    });
    await database.insert(schema.promoCodeRedemptions).values({
      id: "use-2",
      promoCodeId: "promo-1",
      userId: "eleve-2",
      redeemedAt: new Date("2026-06-02T10:00:00.000Z"),
    });

    let unique = false;
    try {
      await database.insert(schema.promoCodeRedemptions).values({
        id: "use-3",
        promoCodeId: "promo-1",
        userId: "eleve-1",
        redeemedAt: new Date(),
      });
    } catch (error) {
      unique = isUniqueConstraint(error);
    }
    assert.equal(unique, true);

    const [stored] = await database
      .select({ endsAt: schema.promoCodes.endsAt, active: schema.promoCodes.active })
      .from(schema.promoCodes)
      .where(eq(schema.promoCodes.id, "promo-1"));
    assert.equal(stored?.active, true);
    assert.equal(stored?.endsAt?.toISOString(), "2026-07-15T21:59:59.000Z");

    const dashboard = await loadPromoDashboard(database, new Date("2026-06-15T12:00:00.000Z"));
    assert.equal(dashboard.summary.activeCodes, 1);
    assert.equal(dashboard.summary.signups, 2);
    assert.equal(dashboard.summary.subscribers, 1);
    assert.equal(dashboard.summary.conversionPercent, 50);
    assert.equal(dashboard.codes[0]?.inscrits, 2);
    assert.equal(dashboard.codes[0]?.abonnes, 1);
    assert.equal(dashboard.codes[0]?.usesLabel, "2 / 10");
    assert.equal(dashboard.codes[0]?.expired, false);

    sqlite.close();
  });
});
