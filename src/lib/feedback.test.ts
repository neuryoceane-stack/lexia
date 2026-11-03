import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectFeedbackBrowser,
  detectFeedbackDeviceClass,
  sanitizeFeedbackPagePath,
} from "./feedback-context";
import {
  FEEDBACK_DESCRIPTION_MAX,
  isFeedbackFormValid,
  validateFeedbackForm,
} from "./feedback-form";
import { FEEDBACK_META_SCHEMA_SQL } from "./feedback-meta-sql";
import { isMissingFeedbackMetaTable } from "./feedback-meta";

describe("sanitizeFeedbackPagePath", () => {
  it("conserve un chemin simple", () => {
    assert.equal(sanitizeFeedbackPagePath("/app/revision"), "/app/revision");
  });

  it("retire les segments ressemblant à des identifiants", () => {
    assert.equal(
      sanitizeFeedbackPagePath("/app/familles/V1StGXR8_Z5jdHi6B-myT"),
      "/app/familles",
    );
    assert.equal(
      sanitizeFeedbackPagePath("/app/professeur/classes/550e8400-e29b-41d4-a716-446655440000"),
      "/app/professeur/classes",
    );
  });
});

describe("detectFeedbackDeviceClass", () => {
  it("classe mobile, tablette et ordinateur selon la largeur", () => {
    assert.equal(detectFeedbackDeviceClass(390, "Mozilla/5.0"), "mobile");
    assert.equal(detectFeedbackDeviceClass(820, "Mozilla/5.0"), "tablette");
    assert.equal(detectFeedbackDeviceClass(1280, "Mozilla/5.0"), "ordinateur");
  });

  it("détecte une tablette via le user-agent", () => {
    const ipad =
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
    assert.equal(detectFeedbackDeviceClass(1280, ipad), "tablette");
  });
});

describe("detectFeedbackBrowser", () => {
  it("extrait le nom et la version majeure", () => {
    const chrome =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
    assert.equal(detectFeedbackBrowser(chrome), "Chrome 131");
  });

  it("priorise Edge avant Chrome", () => {
    const edge =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0";
    assert.equal(detectFeedbackBrowser(edge), "Edge 131");
  });
});

describe("validateFeedbackForm", () => {
  it("refuse un formulaire incomplet", () => {
    assert.equal(isFeedbackFormValid({ type: null, description: "" }), false);
    assert.equal(isFeedbackFormValid({ type: "bug", description: "   " }), false);
    assert.equal(isFeedbackFormValid({ type: "invalid", description: "ok" }), false);
  });

  it("accepte une description valide et refuse un texte trop long", () => {
    const ok = validateFeedbackForm({ type: "idee", description: "  Une suggestion  " });
    assert.equal(ok.ok, true);
    if (ok.ok) {
      assert.equal(ok.type, "idee");
      assert.equal(ok.description, "Une suggestion");
    }

    const long = "a".repeat(FEEDBACK_DESCRIPTION_MAX + 1);
    const ko = validateFeedbackForm({ type: "bug", description: long });
    assert.equal(ko.ok, false);
  });
});

describe("feedback_meta SQL", () => {
  it("contient la table et l'index unique", () => {
    assert.match(FEEDBACK_META_SCHEMA_SQL, /CREATE TABLE IF NOT EXISTS feedback_meta/);
    assert.match(
      FEEDBACK_META_SCHEMA_SQL,
      /CREATE UNIQUE INDEX IF NOT EXISTS feedback_meta_feedback_id_unique/,
    );
  });
});

describe("isMissingFeedbackMetaTable", () => {
  it("reconnaît l'absence de la table annexe", () => {
    assert.equal(
      isMissingFeedbackMetaTable(new Error("SQLITE_ERROR: no such table: feedback_meta")),
      true,
    );
    assert.equal(isMissingFeedbackMetaTable(new Error("no such table: users")), false);
  });
});
