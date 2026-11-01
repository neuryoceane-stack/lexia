import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SM2_DEFAULT_EASE_FACTOR,
  SM2_MAX_EASE_FACTOR,
  SM2_MAX_INTERVAL_DAYS,
  SM2_MIN_EASE_FACTOR,
  computeSM2,
  ensureFiniteSm2ForInsert,
  type SM2Output,
} from "./sm2";

function assertScheduled(result: SM2Output): void {
  assert.equal(Number.isFinite(result.interval), true);
  assert.ok(result.interval >= 1);
  assert.ok(result.interval <= SM2_MAX_INTERVAL_DAYS);
  assert.equal(Number.isFinite(result.easeFactor), true);
  assert.ok(result.easeFactor >= SM2_MIN_EASE_FACTOR);
  assert.ok(result.easeFactor <= SM2_MAX_EASE_FACTOR);
  assert.equal(Number.isFinite(result.repetitions), true);
  assert.equal(Number.isFinite(result.nextReviewAt.getTime()), true);
  assert.ok(Math.abs(result.easeFactor * 100 - Math.round(result.easeFactor * 100)) < 1e-9);
}

describe("computeSM2", () => {
  it("garde un intervalle fini d'au plus 365 jours après 40 réussites", () => {
    let state = {
      easeFactor: SM2_DEFAULT_EASE_FACTOR,
      interval: 1,
      repetitions: 0,
    };
    const now = new Date("2026-03-01T08:00:00.000Z");

    for (let step = 0; step < 40; step += 1) {
      const result = computeSM2({ ...state, rating: 3 }, now);
      assertScheduled(result);
      state = {
        easeFactor: result.easeFactor,
        interval: result.interval,
        repetitions: result.repetitions,
      };
    }

    assert.equal(state.interval, SM2_MAX_INTERVAL_DAYS);
    assert.equal(state.easeFactor, SM2_MAX_EASE_FACTOR);
    assert.equal(state.repetitions, 40);
  });

  it("produit un résultat valide à partir de l'état aberrant observé en production", () => {
    const now = new Date("2026-11-01T20:00:00.000Z");
    const result = computeSM2(
      {
        easeFactor: 4.200000000000001,
        interval: 365829807,
        repetitions: 17,
        rating: 3,
      },
      now,
    );

    assertScheduled(result);
    assert.equal(result.interval, SM2_MAX_INTERVAL_DAYS);
    assert.equal(result.easeFactor, SM2_MAX_EASE_FACTOR);
    assert.equal(result.repetitions, 18);

    const expected = new Date(now);
    expected.setDate(expected.getDate() + SM2_MAX_INTERVAL_DAYS);
    assert.equal(result.nextReviewAt.getTime(), expected.getTime());
  });

  it("plafonne aussi un intervalle infini", () => {
    const result = computeSM2({
      easeFactor: Number.POSITIVE_INFINITY,
      interval: Number.POSITIVE_INFINITY,
      repetitions: 8,
      rating: 2,
    });
    assertScheduled(result);
    assert.equal(result.interval, SM2_MAX_INTERVAL_DAYS);
    assert.equal(result.easeFactor, SM2_MAX_EASE_FACTOR);
  });

  it("laisse un résultat non fini si l'intervalle précédent est NaN", () => {
    const now = new Date("2026-11-01T20:00:00.000Z");
    const result = computeSM2(
      {
        easeFactor: 2.5,
        interval: Number.NaN,
        repetitions: 4,
        rating: 3,
      },
      now,
    );
    assert.equal(Number.isFinite(result.interval), false);
    assert.equal(Number.isFinite(result.nextReviewAt.getTime()), false);

    const warnings: string[] = [];
    const fallback = ensureFiniteSm2ForInsert(
      result,
      "mot-nan",
      now,
      (message) => warnings.push(message),
    );
    assert.equal(fallback.interval, 1);
    assert.equal(fallback.easeFactor, SM2_DEFAULT_EASE_FACTOR);
    assert.equal(fallback.repetitions, 0);
    assert.equal(Number.isFinite(fallback.nextReviewAt.getTime()), true);
    assert.match(warnings[0] ?? "", /mot-nan/);
  });

  it("remet les répétitions à zéro en cas d'échec", () => {
    const now = new Date("2026-11-01T20:00:00.000Z");
    for (const rating of [0, 1] as const) {
      const result = computeSM2(
        {
          easeFactor: 2.6,
          interval: 21,
          repetitions: 5,
          rating,
        },
        now,
      );
      assert.equal(result.repetitions, 0);
      assert.equal(result.interval, 1);
      assert.equal(result.easeFactor, 2.6);
      assert.equal(
        result.nextReviewAt.getTime(),
        now.getTime() + 10 * 60 * 1000,
      );
    }
  });

  it("ramène le facteur aberrant dans la plage même après un échec", () => {
    const result = computeSM2({
      easeFactor: 4.2,
      interval: 365829807,
      repetitions: 17,
      rating: 0,
    });
    assert.equal(result.repetitions, 0);
    assert.equal(result.interval, 1);
    assert.equal(result.easeFactor, SM2_MAX_EASE_FACTOR);
    assert.equal(Number.isFinite(result.nextReviewAt.getTime()), true);
  });
});

describe("ensureFiniteSm2ForInsert", () => {
  it("laisse inchangé un résultat déjà fini", () => {
    const now = new Date("2026-11-01T20:00:00.000Z");
    const result = computeSM2(
      {
        easeFactor: SM2_DEFAULT_EASE_FACTOR,
        interval: 1,
        repetitions: 0,
        rating: 3,
      },
      now,
    );
    const warnings: string[] = [];
    const kept = ensureFiniteSm2ForInsert(
      result,
      "mot-ok",
      now,
      (message) => warnings.push(message),
    );
    assert.equal(kept, result);
    assert.deepEqual(warnings, []);
  });

  it("replie à un intervalle d'un jour et journalise le mot", () => {
    const now = new Date("2026-11-01T20:00:00.000Z");
    const warnings: string[] = [];
    const fallback = ensureFiniteSm2ForInsert(
      {
        easeFactor: Number.NaN,
        interval: Number.POSITIVE_INFINITY,
        repetitions: Number.NaN,
        nextReviewAt: new Date(Number.NaN),
      },
      "mot-aberrant",
      now,
      (message) => warnings.push(message),
    );

    assert.equal(fallback.interval, 1);
    assert.equal(fallback.easeFactor, SM2_DEFAULT_EASE_FACTOR);
    assert.equal(fallback.repetitions, 0);
    const expected = new Date(now);
    expected.setDate(expected.getDate() + 1);
    assert.equal(fallback.nextReviewAt.getTime(), expected.getTime());
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /mot-aberrant/);
  });
});
