/**
 * Consultation d'un pack : séparation mots / expressions, recherche sans casse ni accent.
 * Aucun accès base.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  filterShopPackEntries,
  foldShopPackSearch,
  parseShopPackDetail,
  shopPackContentErrorMessage,
  shopPackDetailFromRow,
  splitShopPackEntries,
  type ShopPackContentRow,
  type ShopPackEntry,
} from "./shop-pack-contents";

const ROW: ShopPackContentRow = {
  id: "pack-eng-01",
  title: "Saisons",
  description: "Le temps qu'il fait.",
  emoji: "☀️",
  language: "fra",
  level: "A2 → B2",
  price: 300,
  wordCount: 3,
  expressionCount: 1,
  wordsJson: JSON.stringify([
    { term: "été", definition: "Saison chaude" },
    { term: "cœur", definition: "Organe" },
    { term: "chien", definition: "Dog", isExpression: false },
    { term: "il pleut des cordes", definition: "Il pleut fort", isExpression: true },
    { term: "naïve", definition: "Ça va, à côté", isExpression: false },
  ]),
};

function terms(entries: readonly ShopPackEntry[]): string[] {
  return entries.map((entry) => entry.term);
}

describe("splitShopPackEntries", () => {
  it("range les expressions à part et garde l'ordre", () => {
    const detail = shopPackDetailFromRow(ROW);
    const split = splitShopPackEntries(detail.entries);
    assert.deepEqual(terms(split.words), ["été", "cœur", "chien", "naïve"]);
    assert.deepEqual(terms(split.expressions), ["il pleut des cordes"]);
    assert.equal(split.words.every((entry) => entry.isExpression === false), true);
    assert.equal(split.expressions[0]?.isExpression, true);
  });

  it("refuse un words_json illisible", () => {
    assert.throws(
      () => shopPackDetailFromRow({ ...ROW, wordsJson: "{" }),
      /words_json illisible/,
    );
    assert.equal(
      shopPackContentErrorMessage(new Error("words_json[2] n'a pas de terme")),
      "L'entrée 3 du pack n'a pas de terme.",
    );
    assert.equal(shopPackContentErrorMessage(new Error("autre")), null);
  });

  it("accepte un pack sans entrée", () => {
    const detail = shopPackDetailFromRow({ ...ROW, wordsJson: null, wordCount: 0, expressionCount: 0 });
    assert.deepEqual(detail.entries, []);
    assert.deepEqual(splitShopPackEntries(detail.entries), { words: [], expressions: [] });
  });
});

describe("filterShopPackEntries", () => {
  const entries = shopPackDetailFromRow(ROW).entries;

  it("ignore la casse, les accents et les ligatures sur le terme et la définition", () => {
    assert.equal(foldShopPackSearch("  ÉTÉ "), "ete");
    assert.equal(foldShopPackSearch("BŒUF"), "boeuf");
    assert.equal(foldShopPackSearch(" naïve "), "naive");
    assert.deepEqual(terms(filterShopPackEntries(entries, "  ETE ")), ["été"]);
    assert.deepEqual(terms(filterShopPackEntries(entries, "coeur")), ["cœur"]);
    assert.deepEqual(terms(filterShopPackEntries(entries, "SAISON")), ["été"]);
    assert.deepEqual(terms(filterShopPackEntries(entries, "FORT")), ["il pleut des cordes"]);
    assert.deepEqual(terms(filterShopPackEntries(entries, "ca va")), ["naïve"]);
    assert.deepEqual(terms(filterShopPackEntries(entries, "a cote")), ["naïve"]);
    assert.deepEqual(terms(filterShopPackEntries(entries, "NAIVE")), ["naïve"]);
    const found = splitShopPackEntries(filterShopPackEntries(entries, "pleut"));
    assert.deepEqual(terms(found.words), []);
    assert.deepEqual(terms(found.expressions), ["il pleut des cordes"]);
  });

  it("ne renvoie rien si rien ne correspond, et tout si la recherche est vide", () => {
    assert.deepEqual(filterShopPackEntries(entries, "zzz"), []);
    assert.equal(filterShopPackEntries(entries, "   ").length, entries.length);
    assert.deepEqual(terms(filterShopPackEntries(entries, "")), terms(entries));
  });
});

describe("parseShopPackDetail", () => {
  it("accepte la réponse et refuse une entrée au type d'expression ambigu", () => {
    const detail = shopPackDetailFromRow(ROW);
    assert.deepEqual(parseShopPackDetail(detail), detail);
    assert.equal(
      parseShopPackDetail({
        ...detail,
        entries: [{ term: "été", definition: "Saison", isExpression: "true" }],
      }),
      null,
    );
    assert.equal(parseShopPackDetail({ ...detail, entries: [{ term: "été" }] }), null);
    assert.equal(parseShopPackDetail(null), null);
  });
});
