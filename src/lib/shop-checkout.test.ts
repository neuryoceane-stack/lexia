import assert from "node:assert/strict";
import { test } from "node:test";
import { requireShopPackWords } from "./shop-pack-preview";
import {
  SHOP_LOT_PRICE_CENTS,
  SHOP_LOT_PACK_SHARE_CENTS,
  quoteShopSelection,
  shopSelectionCopy,
} from "./shop-price";
import {
  catalogStripePriceError,
  parseShopCheckoutRequest,
  planShopCheckoutLines,
  planShopFulfillment,
  planShopPackGrant,
  readShopCheckoutPackIds,
  resolveShopCheckout,
  shopCheckoutEventDisposition,
  shopCheckoutMetadata,
  type ShopCatalogPack,
} from "./shop-checkout";
import { isSqliteUniqueConstraint } from "./sqlite-error";

function catalog(overrides: Partial<ShopCatalogPack> & Pick<ShopCatalogPack, "id">): ShopCatalogPack {
  return {
    title: overrides.id,
    description: "Liste",
    price: 300,
    language: "eng",
    isActive: true,
    type: "thematique",
    stripePriceId: null,
    owned: false,
    ...overrides,
  };
}

test("une sélection déjà possédée est refusée et le client peut recalculer", () => {
  const packs = ["a", "b", "c", "d"].map((id) => catalog({ id, owned: id === "c" }));
  const resolved = resolveShopCheckout(["a", "b", "c", "d"], packs);
  assert.equal(resolved.ok, false);
  if (resolved.ok) return;
  assert.equal(resolved.status, 409);
  assert.deepEqual(resolved.ownedPackIds, ["c"]);

  const remaining = ["a", "b", "d"].map((id) => catalog({ id }));
  const again = resolveShopCheckout(["a", "b", "d"], remaining);
  assert.equal(again.ok, true);
  if (!again.ok) return;
  assert.equal(again.quote.lotCount, 0);
  assert.equal(again.quote.totalCents, 900);
  assert.equal(shopSelectionCopy(again.quote).lotMessage, null);
});

test("une liste inactive ne part pas en paiement", () => {
  const resolved = resolveShopCheckout(
    ["a"],
    [catalog({ id: "a", isActive: false })]
  );
  assert.equal(resolved.ok, false);
  if (!resolved.ok) assert.equal(resolved.status, 404);
});

test("le lot part en une ligne Stripe à 10 €, avec les quatre ids", () => {
  const packs = ["pack-eng-01", "pack-eng-02", "pack-eng-03", "pack-eng-04"].map((id) =>
    catalog({ id, stripePriceId: `price_${id}` })
  );
  const resolved = resolveShopCheckout(
    packs.map((pack) => pack.id),
    packs
  );
  assert.equal(resolved.ok, true);
  if (!resolved.ok) return;
  const lines = planShopCheckoutLines(resolved.quote, resolved.packs);
  assert.deepEqual(lines, [
    { kind: "lot", quantity: 1, unitAmountCents: SHOP_LOT_PRICE_CENTS },
  ]);
  const metadata = shopCheckoutMetadata("user_1", resolved.quote);
  assert.equal(metadata.kind, "shop_lot");
  assert.equal(metadata.packIds, packs.map((pack) => pack.id).join(","));
  assert.equal(metadata.packId, undefined);
  assert.equal(metadata.amounts, [250, 250, 250, 250].join(","));
  assert.equal(metadata.amountCents, "1000");
  assert.deepEqual(readShopCheckoutPackIds(metadata), packs.map((pack) => pack.id));
});

test("cinq listes : une ligne de lot et une ligne au prix catalogue", () => {
  const packs = ["a", "b", "c", "d", "e"].map((id) => catalog({ id }));
  const resolved = resolveShopCheckout(
    packs.map((pack) => pack.id),
    packs
  );
  assert.equal(resolved.ok, true);
  if (!resolved.ok) return;
  const lines = planShopCheckoutLines(resolved.quote, resolved.packs);
  assert.equal(lines.length, 2);
  assert.deepEqual(lines[0], { kind: "lot", quantity: 1, unitAmountCents: 1000 });
  assert.equal(lines[1]?.kind, "pack");
  if (lines[1]?.kind === "pack") {
    assert.equal(lines[1].packId, "e");
    assert.equal(lines[1].unitAmountCents, 300);
  }
});

test("un pack seul garde une ligne catalogue et l'ancien champ packId", () => {
  const resolved = resolveShopCheckout(["pack-eng-01"], [catalog({ id: "pack-eng-01" })]);
  assert.equal(resolved.ok, true);
  if (!resolved.ok) return;
  const lines = planShopCheckoutLines(resolved.quote, resolved.packs);
  assert.equal(lines.length, 1);
  assert.equal(lines[0]?.kind, "pack");
  const metadata = shopCheckoutMetadata("user_1", resolved.quote);
  assert.equal(metadata.kind, "shop_pack");
  assert.equal(metadata.packId, "pack-eng-01");
});

test("les metadata d'un lot de 16 identifiants longs font l'aller-retour", () => {
  const ids = Array.from({ length: 16 }, (_, index) => `pack-${"a".repeat(32)}-${index}`);
  const quote = quoteShopSelection(ids.map((id) => ({ id, price: 300, language: "eng" })));
  const metadata = shopCheckoutMetadata("user_1", quote);
  for (const value of Object.values(metadata)) {
    assert.ok(value.length <= 500);
  }
  assert.deepEqual(readShopCheckoutPackIds(metadata), ids);
  assert.equal(quote.totalCents, 4 * SHOP_LOT_PRICE_CENTS);
});

test("le webhook payé d'un lot prépare 4 achats, un par pack", () => {
  const plan = planShopFulfillment({
    id: "cs_test",
    mode: "payment",
    paymentStatus: "paid",
    amountTotal: 1000,
    paymentIntentId: "pi_test",
    metadata: {
      userId: "user_1",
      kind: "shop_lot",
      packIds: "pack-eng-01,pack-eng-02,pack-eng-03,pack-eng-04",
      amounts: "250,250,250,250",
      amountCents: "1000",
    },
  });
  assert.equal(plan.action, "grant");
  if (plan.action !== "grant") return;
  assert.equal(plan.grants.length, 4);
  assert.deepEqual(
    plan.grants.map((grant) => grant.amountCents),
    [SHOP_LOT_PACK_SHARE_CENTS, SHOP_LOT_PACK_SHARE_CENTS, SHOP_LOT_PACK_SHARE_CENTS, SHOP_LOT_PACK_SHARE_CENTS]
  );
  assert.equal(
    plan.grants.reduce((sum, grant) => sum + grant.amountCents, 0),
    plan.amountTotal
  );
});

test("un paiement annulé, impayé ou au mauvais montant n'attribue rien", () => {
  assert.equal(shopCheckoutEventDisposition("checkout.session.expired"), "ignore");
  assert.equal(shopCheckoutEventDisposition("checkout.session.async_payment_failed"), "ignore");
  assert.equal(shopCheckoutEventDisposition("checkout.session.completed"), "fulfill");

  const unpaid = planShopFulfillment({
    id: "cs_unpaid",
    mode: "payment",
    paymentStatus: "unpaid",
    amountTotal: 1000,
    paymentIntentId: null,
    metadata: {
      userId: "user_1",
      packIds: "a,b,c,d",
      amounts: "250,250,250,250",
      amountCents: "1000",
    },
  });
  assert.deepEqual(unpaid, { action: "ignore", reason: "unpaid" });

  const mismatch = planShopFulfillment({
    id: "cs_bad",
    mode: "payment",
    paymentStatus: "paid",
    amountTotal: 1200,
    paymentIntentId: null,
    metadata: {
      userId: "user_1",
      packIds: "a,b,c,d",
      amounts: "250,250,250,250",
      amountCents: "1000",
    },
  });
  assert.equal(mismatch.action, "reject");
});

test("un ancien paiement d'une seule liste sans montants reste attribuable", () => {
  const plan = planShopFulfillment({
    id: "cs_old",
    mode: "payment",
    paymentStatus: "paid",
    amountTotal: 300,
    paymentIntentId: "pi_old",
    metadata: { userId: "user_1", packId: "pack-eng-01" },
  });
  assert.equal(plan.action, "grant");
  if (plan.action !== "grant") return;
  assert.deepEqual(plan.grants, [{ packId: "pack-eng-01", amountCents: 300 }]);
});

test("un lot sans montants n'est pas attribué au hasard", () => {
  const plan = planShopFulfillment({
    id: "cs_nomount",
    mode: "payment",
    paymentStatus: "paid",
    amountTotal: 1000,
    paymentIntentId: null,
    metadata: { userId: "user_1", packIds: "a,b,c,d" },
  });
  assert.equal(plan.action, "reject");
});

test("un webhook rejoué ne réécrit ni l'achat ni les mots", () => {
  assert.deepEqual(
    planShopPackGrant({
      hasPurchase: true,
      hasList: true,
      wordCountOnList: 80,
      expectedWordCount: 80,
    }),
    { action: "ready" }
  );
  assert.deepEqual(
    planShopPackGrant({
      hasPurchase: false,
      hasList: false,
      wordCountOnList: 0,
      expectedWordCount: 80,
    }),
    { action: "apply", insertPurchase: true, createList: true, insertWords: true }
  );
  assert.deepEqual(
    planShopPackGrant({
      hasPurchase: true,
      hasList: false,
      wordCountOnList: 0,
      expectedWordCount: 80,
    }),
    { action: "apply", insertPurchase: false, createList: true, insertWords: true }
  );
  const partial = planShopPackGrant({
    hasPurchase: true,
    hasList: true,
    wordCountOnList: 10,
    expectedWordCount: 80,
  });
  assert.equal(partial.action, "conflict");
});

test("le corps de caisse accepte packIds et l'ancien packId", () => {
  assert.deepEqual(parseShopCheckoutRequest({ packIds: ["pack-eng-01", "pack-eng-02"] }), {
    ok: true,
    packIds: ["pack-eng-01", "pack-eng-02"],
  });
  assert.deepEqual(parseShopCheckoutRequest({ packId: "pack-eng-01" }), {
    ok: true,
    packIds: ["pack-eng-01"],
  });
  const invalid = parseShopCheckoutRequest({ packIds: ["a b"] });
  assert.equal(invalid.ok, false);
});

test("un prix Stripe inactif ou différent est refusé", () => {
  assert.equal(catalogStripePriceError({ active: true, unit_amount: 300 }, 300), null);
  assert.ok(catalogStripePriceError({ active: false, unit_amount: 300 }, 300));
  assert.ok(catalogStripePriceError({ active: true, unit_amount: 400 }, 300));
});

test("le contenu d'un pack invalide n'est pas écrit en silence", () => {
  assert.deepEqual(requireShopPackWords(null), []);
  assert.deepEqual(requireShopPackWords('[{"term":"cat","definition":"chat","isExpression":false}]'), [
    { term: "cat", definition: "chat", isExpression: false },
  ]);
  assert.throws(() => requireShopPackWords("{"), /illisible/);
  assert.throws(() => requireShopPackWords('[{"terme":"cat"}]'), /terme/);
});

test("seul un conflit d'unicité est reconnu comme doublon", () => {
  assert.equal(isSqliteUniqueConstraint(new Error("UNIQUE constraint failed: user_purchases.id")), true);
  assert.equal(isSqliteUniqueConstraint(new Error("SQLITE_CONSTRAINT_PRIMARYKEY")), true);
  assert.equal(isSqliteUniqueConstraint(new Error("NOT NULL constraint failed")), false);
  assert.equal(isSqliteUniqueConstraint(new Error("FOREIGN KEY constraint failed")), false);
});
