import assert from "node:assert/strict";
import { test } from "node:test";
import { formatShopPriceCents } from "./shop-price";

test("formatShopPriceCents affiche les centimes en euros", () => {
  assert.equal(formatShopPriceCents(400), "4,00 €");
  assert.equal(formatShopPriceCents(0), "0,00 €");
});