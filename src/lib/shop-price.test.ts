import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SHOP_LIST_SOURCE,
  SHOP_LOT_PACK_SHARE_CENTS,
  SHOP_LOT_PRICE_CENTS,
  SHOP_LOT_SIZE,
  ShopSelectionError,
  countsTowardFreemiumPersonalWords,
  formatShopPriceCents,
  quoteShopSelection,
  shopLotOfferLabel,
  shopSelectionCopy,
} from "./shop-price";

test("formatShopPriceCents affiche les euros entiers sans décimales", () => {
  assert.equal(formatShopPriceCents(400), "4 €");
  assert.equal(formatShopPriceCents(0), "0 €");
});

test("formatShopPriceCents garde les centimes quand nécessaire", () => {
  assert.equal(formatShopPriceCents(450), "4,50 €");
  assert.equal(formatShopPriceCents(SHOP_LOT_PACK_SHARE_CENTS), "2,50 €");
});

function pack(id: string, price = 300, language = "eng") {
  return { id, price, language };
}

test("le lot coûte 10 € pour 4 packs, partagé en 2,50 €", () => {
  assert.equal(SHOP_LOT_SIZE, 4);
  assert.equal(SHOP_LOT_PRICE_CENTS, 1000);
  assert.notEqual(SHOP_LOT_PRICE_CENTS, 1600);
  assert.equal(SHOP_LOT_PACK_SHARE_CENTS, 250);
  const quote = quoteShopSelection([pack("a"), pack("b"), pack("c"), pack("d")]);
  assert.equal(quote.lotCount, 1);
  assert.equal(quote.remainderCount, 0);
  assert.equal(quote.totalCents, 1000);
  assert.equal(quote.listPriceCents, 1200);
  assert.equal(quote.savingsCents, 200);
  assert.deepEqual(
    quote.lines.map((line) => line.amountCents),
    [250, 250, 250, 250]
  );
  assert.equal(
    quote.lines.reduce((sum, line) => sum + line.amountCents, 0),
    quote.totalCents
  );
  const copy = shopSelectionCopy(quote);
  assert.equal(copy.lotMessage, shopLotOfferLabel());
  assert.equal(copy.lotMessage, `4 packs = ${formatShopPriceCents(1000)}`);
  assert.equal(copy.listTotalLabel, formatShopPriceCents(1200));
  assert.equal(copy.hint, null);
});

test("1, 2 ou 3 packs restent au prix catalogue", () => {
  for (const count of [1, 2, 3]) {
    const quote = quoteShopSelection(
      Array.from({ length: count }, (_, index) => pack(`p${index}`))
    );
    assert.equal(quote.lotCount, 0);
    assert.equal(quote.totalCents, count * 300);
    assert.equal(quote.savingsCents, 0);
    const copy = shopSelectionCopy(quote);
    assert.equal(copy.lotMessage, null);
    const missing = 4 - count;
    assert.equal(
      copy.hint,
      `Encore ${missing} ${missing > 1 ? "listes" : "liste"} pour ${shopLotOfferLabel()}`
    );
  }
});

test("5 packs : un lot à 10 € plus une liste à 3 €", () => {
  const quote = quoteShopSelection([
    pack("a"),
    pack("b"),
    pack("c"),
    pack("d"),
    pack("e"),
  ]);
  assert.equal(quote.lotCount, 1);
  assert.equal(quote.remainderCount, 1);
  assert.equal(quote.totalCents, 1300);
  assert.deepEqual(
    quote.lines.map((line) => line.amountCents),
    [250, 250, 250, 250, 300]
  );
  assert.equal(shopSelectionCopy(quote).lotMessage, shopLotOfferLabel());
});

test("8 packs : deux lots, 20 €", () => {
  const quote = quoteShopSelection(
    Array.from({ length: 8 }, (_, index) => pack(`p${index}`))
  );
  assert.equal(quote.lotCount, 2);
  assert.equal(quote.totalCents, 2000);
  assert.equal(quote.savingsCents, 400);
});

test("un lot qui ne serait pas une réduction n'est pas appliqué", () => {
  const quote = quoteShopSelection([
    pack("a", 200),
    pack("b", 200),
    pack("c", 200),
    pack("d", 200),
  ]);
  assert.equal(quote.lotCount, 0);
  assert.equal(quote.totalCents, 800);
});

test("quatre listes de prix différents sont refusées", () => {
  assert.throws(
    () => quoteShopSelection([pack("a", 300), pack("b", 300), pack("c", 300), pack("d", 400)]),
    (error: unknown) => error instanceof ShopSelectionError && error.code === "mixed_price"
  );
});

test("un lot ne mélange pas les langues", () => {
  assert.throws(
    () => quoteShopSelection([pack("a"), pack("b"), pack("c"), pack("d", 300, "spa")]),
    (error: unknown) => error instanceof ShopSelectionError && error.code === "mixed_language"
  );
});

test("le message « encore une liste » disparaît si le lot n'est plus atteignable", () => {
  const quote = quoteShopSelection([pack("a"), pack("b"), pack("c")]);
  assert.equal(shopSelectionCopy(quote, { lotReachable: false }).hint, null);
  assert.equal(shopSelectionCopy(quote).hint?.startsWith("Encore 1 liste"), true);
});

test("les listes boutique, y compris un lot, restent hors des 20 mots gratuits", () => {
  const sources = Array.from({ length: SHOP_LOT_SIZE }, () => SHOP_LIST_SOURCE);
  assert.equal(sources.filter((source) => countsTowardFreemiumPersonalWords(source)).length, 0);
  assert.equal(countsTowardFreemiumPersonalWords("manual"), true);
  assert.equal(countsTowardFreemiumPersonalWords("ocr"), true);
  assert.equal(countsTowardFreemiumPersonalWords("pdf"), true);
});