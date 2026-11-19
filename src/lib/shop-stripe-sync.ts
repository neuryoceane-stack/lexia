import type { ShopPack } from "@/lib/db/schema";
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