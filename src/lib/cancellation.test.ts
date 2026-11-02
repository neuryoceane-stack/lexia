import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CHURN_CSV_HEADERS,
  churnPercent,
  departureToCsvRow,
  formatCsvDate,
  formatTenureDays,
  isCancellationStorageUnavailable,
  isCancellationUniqueConflict,
  normalizeCancellationComment,
  parisMonthStart,
  parseCancellationReason,
  parseChurnResponse,
  resolveCancellationPlan,
  studentLabel,
  summarizeCancellations,
  toCsv,
  type CancellationStamp,
  type ChurnDeparture,
} from "./cancellation";

const NOV_2026 = new Date("2026-11-02T06:24:00.000Z");

describe("parseCancellationReason", () => {
  it("accepte un motif vide", () => {
    assert.equal(parseCancellationReason(null), null);
    assert.equal(parseCancellationReason(""), null);
    assert.equal(parseCancellationReason(undefined), null);
  });

  it("accepte les six motifs et refuse le reste", () => {
    assert.equal(parseCancellationReason("exam_passed"), "exam_passed");
    assert.equal(parseCancellationReason("trop cher"), "invalid");
    assert.equal(parseCancellationReason(1), "invalid");
  });
});

describe("normalizeCancellationComment", () => {
  it("ramène le vide à null et refuse un texte trop long", () => {
    assert.equal(normalizeCancellationComment(null), null);
    assert.equal(normalizeCancellationComment("   "), null);
    assert.equal(normalizeCancellationComment("  merci  "), "merci");
    assert.equal(normalizeCancellationComment("x".repeat(1001)), "invalid");
    assert.equal(normalizeCancellationComment(12), "invalid");
  });
});

describe("resolveCancellationPlan", () => {
  it("garde l'essai même si le prix est mensuel", () => {
    assert.equal(
      resolveCancellationPlan({
        status: "trialing",
        trialEnd: 1,
        canceledAt: null,
        metadataPlan: "monthly",
        interval: "month",
        pricePlan: "monthly",
      }),
      "trial",
    );
  });

  it("reconnaît un essai résilié avant trial_end", () => {
    assert.equal(
      resolveCancellationPlan({
        status: "canceled",
        trialEnd: 200,
        canceledAt: 150,
        metadataPlan: null,
        interval: "month",
        pricePlan: "monthly",
      }),
      "trial",
    );
  });

  it("retombe sur l'intervalle du prix", () => {
    assert.equal(
      resolveCancellationPlan({
        status: "active",
        trialEnd: null,
        canceledAt: null,
        metadataPlan: null,
        interval: "year",
        pricePlan: null,
      }),
      "annual",
    );
    assert.equal(
      resolveCancellationPlan({
        status: "active",
        trialEnd: null,
        canceledAt: null,
        metadataPlan: null,
        interval: "week",
        pricePlan: null,
      }),
      null,
    );
  });
});

describe("calendrier de Paris", () => {
  it("place le 1er novembre 2026 à 23:00 UTC", () => {
    assert.equal(parisMonthStart(NOV_2026).toISOString(), "2026-10-31T23:00:00.000Z");
  });

  it("place le 1er juillet 2026 à 22:00 UTC", () => {
    assert.equal(
      parisMonthStart(new Date("2026-07-15T12:00:00.000Z")).toISOString(),
      "2026-06-30T22:00:00.000Z",
    );
  });

  it("écrit la date CSV en jour/mois/année de Paris", () => {
    assert.equal(formatCsvDate(new Date("2026-11-02T23:30:00.000Z")), "03/11/2026");
  });
});

describe("formatTenureDays", () => {
  it("affiche les jours puis les mois", () => {
    assert.equal(formatTenureDays(0.2), "moins d'un jour");
    assert.equal(formatTenureDays(1), "1 jour");
    assert.equal(formatTenureDays(12), "12 jours");
    assert.equal(formatTenureDays(34), "34 jours");
    assert.equal(formatTenureDays(152), "5 mois");
  });
});

describe("churnPercent", () => {
  it("arrondit et refuse une base vide", () => {
    assert.equal(churnPercent(3, 6), 50);
    assert.equal(churnPercent(1, 6), 17);
    assert.equal(churnPercent(0, 6), 0);
    assert.equal(churnPercent(2, 0), null);
  });
});

describe("summarizeCancellations", () => {
  it("compte les départs du mois sans les ajouter deux fois s'ils sont encore abonnés", () => {
    const rows: CancellationStamp[] = [
      {
        userId: "still",
        startedAt: new Date("2026-06-01T00:00:00.000Z"),
        cancelledAt: new Date("2026-11-02T08:00:00.000Z"),
        reason: "too_expensive",
      },
      {
        userId: "gone",
        startedAt: new Date("2026-09-01T00:00:00.000Z"),
        cancelledAt: new Date("2026-11-01T10:00:00.000Z"),
        reason: null,
      },
      {
        userId: "newcomer",
        startedAt: new Date("2026-11-01T00:00:00.000Z"),
        cancelledAt: new Date("2026-11-02T00:00:00.000Z"),
        reason: "other",
      },
    ];
    const summary = summarizeCancellations(rows, new Set(["still", "active-a", "active-b"]), NOV_2026);
    assert.equal(summary.total, 3);
    assert.equal(summary.cancellationsThisMonth, 3);
    assert.equal(summary.subscribersAtMonthStart, 4);
    assert.equal(summary.churnPercent, 75);
    assert.equal(summary.reasons30d.find((row) => row.reason === "unspecified")?.count, 1);
    assert.equal(summary.reasons30d.find((row) => row.reason === "too_expensive")?.count, 1);
    assert.ok(summary.averageTenureDays != null && summary.averageTenureDays > 0);
  });

  it("laisse la moyenne vide quand aucune ligne n'existe", () => {
    const summary = summarizeCancellations([], new Set(["a"]), NOV_2026);
    assert.equal(summary.total, 0);
    assert.equal(summary.averageTenureDays, null);
    assert.equal(summary.churnPercent, 0);
    assert.equal(summary.subscribersAtMonthStart, 1);
  });
});

describe("csv", () => {
  it("échappe les guillemets et aligne les colonnes du tableau", () => {
    const row: ChurnDeparture = {
      cancelledAt: "2026-11-02T10:00:00.000Z",
      student: "Ada, \"Kim\"",
      plan: "monthly",
      tenureDays: 34,
      reason: "too_expensive",
      comment: "ligne\n2",
    };
    const csv = toCsv([[...CHURN_CSV_HEADERS], departureToCsvRow(row)]);
    assert.ok(csv.startsWith("\uFEFFDate,Élève,Plan,Durée,Motif,Un mot laissé\r\n"));
    assert.ok(csv.includes('"Ada, ""Kim"""'));
    assert.ok(csv.includes('"ligne\n2"'));
    assert.ok(csv.includes("Mensuel"));
    assert.ok(csv.includes("Trop cher"));
  });
});

describe("parseChurnResponse", () => {
  it("accepte l'état sans table et refuse un motif inconnu", () => {
    assert.deepEqual(parseChurnResponse({ available: false }), { available: false });
    assert.equal(
      parseChurnResponse({
        available: true,
        total: 0,
        cancellationsThisMonth: 0,
        subscribersAtMonthStart: 0,
        churnPercent: null,
        averageTenureDays: null,
        reasons30d: [],
        recent: [{ cancelledAt: "x", student: "a", plan: "monthly", tenureDays: 1, reason: "nope", comment: null }],
      }),
      null,
    );
  });
});

describe("libellé élève", () => {
  it("prend le prénom, sinon l'e-mail", () => {
    assert.equal(studentLabel("  Ada ", "ada@exemple.fr"), "Ada");
    assert.equal(studentLabel("  ", "ada@exemple.fr"), "ada@exemple.fr");
    assert.equal(studentLabel(null, "ada@exemple.fr"), "ada@exemple.fr");
  });
});

describe("erreurs de table", () => {
  it("reconnaît l'absence de table et le conflit d'unicité", () => {
    const missing = new Error("no such table: cancellation_feedback");
    const unique = new Error(
      "UNIQUE constraint failed: cancellation_feedback.user_id, cancellation_feedback.subscription_started_at",
    );
    assert.equal(isCancellationStorageUnavailable(missing), true);
    assert.equal(isCancellationUniqueConflict(unique), true);
    assert.equal(isCancellationStorageUnavailable(new Error("no such table: users")), false);
  });
});
