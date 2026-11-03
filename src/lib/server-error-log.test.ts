import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildErrorFingerprint,
  nextReviewStatusOnRecurrence,
  normalizeMessageForFingerprint,
  sanitizeErrorMessage,
} from "./error-event-utils";
import { TECH_HEALTH_SCHEMA_SQL } from "./tech-health-sql";

describe("sanitizeErrorMessage", () => {
  it("retire e-mails, jetons et identifiants", () => {
    const raw =
      "Utilisateur eleve@exemple.fr token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig id 550e8400-e29b-41d4-a716-446655440000 count 42";
    const cleaned = sanitizeErrorMessage(raw);
    assert.match(cleaned, /<email>/);
    assert.match(cleaned, /<token>/);
    assert.match(cleaned, /<id>/);
    assert.match(cleaned, /<n>/);
    assert.doesNotMatch(cleaned, /eleve@exemple\.fr/);
    assert.doesNotMatch(cleaned, /550e8400/);
    assert.doesNotMatch(cleaned, /eyJhbGci/);
  });

  it("tronque à 300 caractères", () => {
    const long = "a".repeat(400);
    assert.equal(sanitizeErrorMessage(long).length, 300);
  });
});

describe("normalizeMessageForFingerprint", () => {
  it("regroupe des variantes de casse et d'espaces", () => {
    const a = normalizeMessageForFingerprint("  Valeur   Invalide  ");
    const b = normalizeMessageForFingerprint("valeur invalide");
    assert.equal(a, b);
  });
});

describe("buildErrorFingerprint", () => {
  it("produit le même empreinte pour le même message normalisé sur la même route", () => {
    const message = normalizeMessageForFingerprint(
      sanitizeErrorMessage("Erreur mot 123 sur /api/revision"),
    );
    const fp1 = buildErrorFingerprint("/api/revision", "POST", message);
    const fp2 = buildErrorFingerprint("/api/revision?foo=1", "POST", message);
    assert.equal(fp1, fp2);
  });

  it("diffère selon la route ou la méthode", () => {
    const message = normalizeMessageForFingerprint(sanitizeErrorMessage("timeout"));
    const a = buildErrorFingerprint("/api/extract/ocr", "POST", message);
    const b = buildErrorFingerprint("/api/extract/pdf", "POST", message);
    const c = buildErrorFingerprint("/api/extract/ocr", "GET", message);
    assert.notEqual(a, b);
    assert.notEqual(a, c);
  });
});

describe("nextReviewStatusOnRecurrence", () => {
  it("repasse une erreur corrigée en nouvelle", () => {
    assert.equal(nextReviewStatusOnRecurrence("fixed"), "new");
  });

  it("conserve les statuts en cours d'examen ou nouveaux", () => {
    assert.equal(nextReviewStatusOnRecurrence("new"), "new");
    assert.equal(nextReviewStatusOnRecurrence("to_check"), "to_check");
  });
});

describe("TECH_HEALTH_SCHEMA_SQL", () => {
  it("contient les deux tables et les index attendus", () => {
    assert.match(TECH_HEALTH_SCHEMA_SQL, /CREATE TABLE IF NOT EXISTS error_events/);
    assert.match(TECH_HEALTH_SCHEMA_SQL, /CREATE UNIQUE INDEX IF NOT EXISTS error_events_fingerprint_unique/);
    assert.match(TECH_HEALTH_SCHEMA_SQL, /CREATE TABLE IF NOT EXISTS email_events/);
    assert.match(TECH_HEALTH_SCHEMA_SQL, /CREATE INDEX IF NOT EXISTS email_events_created_at_idx/);
  });
});
