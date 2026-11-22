import assert from "node:assert/strict";
import { test } from "node:test";
import { SHOP_LOT_PRICE_CENTS, SHOP_LOT_STRIPE_LOOKUP_KEY } from "./shop-price";
import { clearShopLotStripeCache, syncShopLotToStripe } from "./shop-stripe-sync";

type Price = {
  id: string;
  active: boolean;
  unit_amount: number | null;
  currency: string;
  product: string;
  lookup_key: string;
};

function fakeStripe(initial: Price[] = []) {
  const prices = initial.map((price) => ({ ...price }));
  const products: { id: string; name: string }[] = initial.map((price) => ({
    id: price.product,
    name: "ancien",
  }));
  let listed = 0;
  let createdPrices = 0;
  return {
    listed: () => listed,
    createdPrices: () => createdPrices,
    pricesState: prices,
    productsState: products,
    client: {
      products: {
        create: async (params: { name: string }) => {
          const product = { id: `prod_${products.length + 1}`, name: params.name };
          products.push(product);
          return product;
        },
        update: async (id: string, params: { name: string }) => {
          const product = products.find((row) => row.id === id);
          if (!product) throw new Error(`produit absent ${id}`);
          product.name = params.name;
          return product;
        },
      },
      prices: {
        list: async (params: { lookup_keys: string[] }) => {
          listed += 1;
          return {
            data: prices.filter((price) => params.lookup_keys.includes(price.lookup_key)),
          };
        },
        update: async (id: string, params: { active: boolean }) => {
          const price = prices.find((row) => row.id === id);
          if (!price) throw new Error(`prix absent ${id}`);
          price.active = params.active;
          return price;
        },
        create: async (params: {
          product: string;
          unit_amount: number;
          currency: string;
          lookup_key: string;
          transfer_lookup_key: boolean;
        }) => {
          createdPrices += 1;
          if (params.transfer_lookup_key) {
            for (const price of prices) {
              if (price.lookup_key === params.lookup_key) price.lookup_key = "";
            }
          }
          const price: Price = {
            id: `price_${prices.length + 1}`,
            active: true,
            unit_amount: params.unit_amount,
            currency: params.currency,
            product: params.product,
            lookup_key: params.lookup_key,
          };
          prices.push(price);
          return price;
        },
      },
    },
  };
}

test("le lot crée un prix Stripe à 10 € puis le réutilise", async () => {
  clearShopLotStripeCache();
  const stripe = fakeStripe();
  const created = await syncShopLotToStripe(stripe.client);
  assert.equal(created.unitAmount, SHOP_LOT_PRICE_CENTS);
  assert.equal(stripe.productsState.length, 1);
  assert.equal(stripe.pricesState[0]?.unit_amount, 1000);
  assert.equal(stripe.pricesState[0]?.lookup_key, SHOP_LOT_STRIPE_LOOKUP_KEY);

  clearShopLotStripeCache();
  const again = await syncShopLotToStripe(stripe.client);
  assert.equal(again.stripePriceId, created.stripePriceId);
  assert.equal(stripe.createdPrices(), 1);
  assert.equal(stripe.listed(), 2);
});

test("un ancien prix de lot est archivé quand le montant change", async () => {
  clearShopLotStripeCache();
  const stripe = fakeStripe([
    {
      id: "price_old",
      active: true,
      unit_amount: 1600,
      currency: "eur",
      product: "prod_old",
      lookup_key: SHOP_LOT_STRIPE_LOOKUP_KEY,
    },
  ]);
  const synced = await syncShopLotToStripe(stripe.client);
  assert.equal(synced.unitAmount, 1000);
  assert.notEqual(synced.stripePriceId, "price_old");
  assert.equal(stripe.pricesState.find((price) => price.id === "price_old")?.active, false);
  assert.equal(
    stripe.pricesState.find((price) => price.id === synced.stripePriceId)?.unit_amount,
    SHOP_LOT_PRICE_CENTS
  );
});
