import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildStudentEntitlement,
  computeFreemiumCounts,
  freemiumBulkImportMessage,
} from "./student-entitlement.logic";
import { isFreemiumEnabled } from "./freemium";
import { FREEMIUM_PERSONAL_WORD_LIMIT } from "./offer";

describe("computeFreemiumCounts", () => {
  it("compte 14 actifs et 6 places pour 14 mots", () => {
    assert.deepEqual(computeFreemiumCounts(14), {
      activeWordCount: 14,
      lockedWordCount: 0,
      remainingSlots: FREEMIUM_PERSONAL_WORD_LIMIT - 14,
    });
  });

  it("verrouille 15 mots au-delà de 20", () => {
    assert.deepEqual(computeFreemiumCounts(35), {
      activeWordCount: FREEMIUM_PERSONAL_WORD_LIMIT,
      lockedWordCount: 15,
      remainingSlots: 0,
    });
  });
});

describe("buildStudentEntitlement", () => {
  it("freemium off : illimité sans quota appliqué", () => {
    const e = buildStudentEntitlement(false, true, null, 40);
    assert.equal(e.freemiumActive, false);
    assert.equal(e.unlimited, true);
    assert.equal(e.personalWordTotal, 0);
  });

  it("gratuit sous 20 mots", () => {
    const e = buildStudentEntitlement(true, false, null, 12);
    assert.equal(e.unlimited, false);
    assert.equal(e.activeWordCount, 12);
    assert.equal(e.remainingSlots, 8);
    assert.equal(e.lockedWordCount, 0);
  });

  it("gratuit au-dessus de 20", () => {
    const e = buildStudentEntitlement(true, false, null, 35);
    assert.equal(e.activeWordCount, 20);
    assert.equal(e.lockedWordCount, 15);
    assert.equal(e.remainingSlots, 0);
  });

  it("abonné actif illimité", () => {
    const e = buildStudentEntitlement(true, true, "subscription", 120);
    assert.equal(e.unlimited, true);
    assert.equal(e.unlimitedReason, "subscription");
  });

  it("essai illimité", () => {
    const e = buildStudentEntitlement(true, true, "trial", 50);
    assert.equal(e.unlimitedReason, "trial");
  });

  it("élève de classe (pilote)", () => {
    const e = buildStudentEntitlement(true, true, "class_pilot", 80);
    assert.equal(e.unlimitedReason, "class_pilot");
  });

  it("liste boutique : illustré par illimité abonné inchangé", () => {
    const e = buildStudentEntitlement(true, true, "subscription", 5);
    assert.equal(e.personalWordTotal, 5);
  });
});

describe("freemiumBulkImportMessage", () => {
  it("explique un import partiel", () => {
    const msg = freemiumBulkImportMessage(3, 7, 0);
    assert.ok(msg?.includes("3 mot"));
    assert.ok(msg?.includes("7 mot"));
  });
});

describe("suppression logique (compteurs)", () => {
  it("simule le déblocage après suppression", () => {
    const before = computeFreemiumCounts(21);
    assert.equal(before.lockedWordCount, 1);
    const after = computeFreemiumCounts(20);
    assert.equal(after.lockedWordCount, 0);
    assert.equal(after.remainingSlots, 0);
  });
});

describe("isFreemiumEnabled", () => {
  it("ne s'active qu'avec la valeur exacte true", () => {
    const prev = process.env.FREEMIUM_ENABLED;
    process.env.FREEMIUM_ENABLED = "true";
    assert.equal(isFreemiumEnabled(), true);
    process.env.FREEMIUM_ENABLED = "1";
    assert.equal(isFreemiumEnabled(), false);
    process.env.FREEMIUM_ENABLED = prev;
  });
});