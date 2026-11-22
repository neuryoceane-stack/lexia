import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clampRevisionSessionWordLimit,
  initialRevisionSessionWordLimit,
  isRevisionSessionAllWords,
  parseRevisionSessionWordLimitQuery,
  presetRevisionSessionWordLimit,
  revisionSessionSliderValues,
  snapRevisionSessionWordLimit,
} from "./revision-session-word-limit";

describe("revision-session-word-limit", () => {
  it("plafonne sans erreur quand la sélection rétrécit", () => {
    assert.equal(clampRevisionSessionWordLimit(50, 30), 30);
    assert.equal(clampRevisionSessionWordLimit(50, 18), 18);
    assert.equal(clampRevisionSessionWordLimit(50, 12), 12);
    assert.equal(clampRevisionSessionWordLimit(25, 100), 25);
  });

  it("Tout renvoie le total exact", () => {
    assert.equal(presetRevisionSessionWordLimit("all", 47), 47);
    assert.equal(isRevisionSessionAllWords(47, 47), true);
    assert.equal(isRevisionSessionAllWords(20, 100), false);
  });

  it("aligne sur le pas de 5", () => {
    assert.equal(snapRevisionSessionWordLimit(22, 100), 20);
    assert.equal(snapRevisionSessionWordLimit(23, 100), 25);
    assert.equal(
      snapRevisionSessionWordLimit(100, 100, { allowFullTotal: true }),
      100
    );
  });

  it("valeurs du slider incluent le total si hors pas", () => {
    const values = revisionSessionSliderValues(23);
    assert.deepEqual(values, [5, 10, 15, 20, 23]);
  });

  it("parse la query limit", () => {
    assert.equal(parseRevisionSessionWordLimitQuery("20"), 20);
    assert.equal(parseRevisionSessionWordLimitQuery("0"), undefined);
    assert.equal(parseRevisionSessionWordLimitQuery(""), undefined);
  });

  it("initialise depuis la préférence avec défaut 20", () => {
    assert.equal(initialRevisionSessionWordLimit(20, 100), 20);
    assert.equal(initialRevisionSessionWordLimit(20, 8), 8);
  });
});