import type { ShopPack } from "@/lib/db/schema";
import {
  SHOP_LOT_PACK_SHARE_CENTS,
  SHOP_LOT_PRICE_CENTS,
  SHOP_LOT_SIZE,
  SHOP_LOT_STRIPE_LOOKUP_KEY,
} from "@/lib/shop-price";
import { getStripe } from "@/lib/stripe";

export type ShopPackStripeIds = {
  stripeProductId: string;
  stripePriceId: string;
};

/**
 * Crée ou met à jour le produit Stripe et le prix actif pour un pack boutique.
 * En cas de changement de prix, archive l’ancien price id Stripe.
 */
export async function syncShopPackToStripe(
  pack: Pick<ShopPack, "id" | "title" | "description" | "price" | "stripeProductId" | "stripePriceId">,
  previousPriceCents: number | null
): Promise<ShopPackStripeIds> {
  const stripe = getStripe();

  let productId = pack.stripeProductId?.trim() || null;
  if (!productId) {
    const product = await stripe.products.create({
      name: pack.title,
      description: pack.description,
      metadata: { packId: pack.id, kind: "shop_pack" },
    });
    productId = product.id;
  } else {
    await stripe.products.update(productId, {
      name: pack.title,
      description: pack.description,
    });
  }

  const priceChanged =
    previousPriceCents !== null &&
    Number.isFinite(previousPriceCents) &&
    previousPriceCents !== pack.price;

  let priceId = pack.stripePriceId?.trim() || null;
  const needsNewPrice = !priceId || priceChanged;

  if (needsNewPrice) {
    if (priceId) {
      await stripe.prices.update(priceId, { active: false });
    }
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: pack.price,
      currency: "eur",
    });
    priceId = price.id;
  }

  if (!priceId) {
    throw new Error("Stripe price id manquant après synchronisation");
  }

  return {
    stripeProductId: productId,
    stripePriceId: priceId,
  };
}

export type ShopLotStripeIds = ShopPackStripeIds & {
  unitAmount: number;
};

type StripeId = string | { id: string };

type ShopLotStripe = {
  products: {
    create: (
      params: {
        name: string;
        description: string;
        metadata: Record<string, string>;
      },
      options?: { idempotencyKey?: string }
    ) => Promise<{ id: string }>;
    update: (
      id: string,
      params: { name: string; description: string; metadata: Record<string, string> }
    ) => Promise<unknown>;
  };
  prices: {
    list: (params: { lookup_keys: string[]; limit: number }) => Promise<{
      data: Array<{
        id: string;
        active: boolean;
        unit_amount: number | null;
        currency: string;
        product: StripeId;
      }>;
    }>;
    update: (id: string, params: { active: boolean }) => Promise<unknown>;
    create: (
      params: {
        product: string;
        unit_amount: number;
        currency: "eur";
        lookup_key: string;
        transfer_lookup_key: boolean;
        metadata: Record<string, string>;
      },
      options?: { idempotencyKey?: string }
    ) => Promise<{ id: string }>;
  };
};

let lotPriceCache: ShopLotStripeIds | null = null;

export function clearShopLotStripeCache(): void {
  lotPriceCache = null;
}

function productIdOf(product: StripeId): string {
  return typeof product === "string" ? product : product.id;
}

/**
 * Produit Stripe du lot (4 packs au choix, même langue).
 * Le prix actif porte SHOP_LOT_STRIPE_LOOKUP_KEY. S'il change, l'ancien est archivé.
 * Même principe que syncShopPackToStripe : pas de price_data à chaque paiement.
 */
export async function syncShopLotToStripe(client?: ShopLotStripe): Promise<ShopLotStripeIds> {
  if (lotPriceCache && lotPriceCache.unitAmount === SHOP_LOT_PRICE_CENTS) {
    return lotPriceCache;
  }

  const stripe = client ?? (getStripe() as unknown as ShopLotStripe);
  const listed = await stripe.prices.list({
    lookup_keys: [SHOP_LOT_STRIPE_LOOKUP_KEY],
    limit: 10,
  });
  const reusable = listed.data.find(
    (price) =>
      price.active && price.currency === "eur" && price.unit_amount === SHOP_LOT_PRICE_CENTS
  );
  if (reusable) {
    const result = {
      stripeProductId: productIdOf(reusable.product),
      stripePriceId: reusable.id,
      unitAmount: SHOP_LOT_PRICE_CENTS,
    };
    lotPriceCache = result;
    return result;
  }

  const current = listed.data.find((price) => price.active) ?? listed.data[0] ?? null;
  let productId = current ? productIdOf(current.product) : null;
  const productName = `Lot de ${SHOP_LOT_SIZE} packs`;
  const productDescription = `${SHOP_LOT_SIZE} packs au choix de la même langue`;
  const metadata = {
    kind: "shop_lot",
    lotSize: String(SHOP_LOT_SIZE),
    shareCents: String(SHOP_LOT_PACK_SHARE_CENTS),
  };

  if (!productId) {
    const product = await stripe.products.create(
      { name: productName, description: productDescription, metadata },
      { idempotencyKey: `lexia-shop-lot-product-${SHOP_LOT_SIZE}` }
    );
    productId = product.id;
  } else {
    await stripe.products.update(productId, {
      name: productName,
      description: productDescription,
      metadata,
    });
  }

  if (current?.active) {
    await stripe.prices.update(current.id, { active: false });
  }

  const price = await stripe.prices.create(
    {
      product: productId,
      unit_amount: SHOP_LOT_PRICE_CENTS,
      currency: "eur",
      lookup_key: SHOP_LOT_STRIPE_LOOKUP_KEY,
      transfer_lookup_key: true,
      metadata,
    },
    { idempotencyKey: `lexia-shop-lot-price-${SHOP_LOT_SIZE}-${SHOP_LOT_PRICE_CENTS}` }
  );

  if (!price.id || !productId) {
    throw new Error("Prix Stripe du lot manquant après synchronisation");
  }

  const result = {
    stripeProductId: productId,
    stripePriceId: price.id,
    unitAmount: SHOP_LOT_PRICE_CENTS,
  };
  lotPriceCache = result;
  return result;
}