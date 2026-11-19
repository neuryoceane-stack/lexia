import assert from "node:assert/strict";
import { test } from "node:test";
import { formatShopPriceCents } from "./shop-price";

test("formatShopPriceCents affiche les euros entiers sans décimales", () => {
  assert.equal(formatShopPriceCents(400), "4 €");
  assert.equal(formatShopPriceCents(0), "0 €");
});

test("formatShopPriceCents garde les centimes quand nécessaire", () => {
  assert.equal(formatShopPriceCents(450), "4,50 €");
});