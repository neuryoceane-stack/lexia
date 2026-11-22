import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { shopPacks, userPurchases } from "@/lib/db/schema";
import { SHOP_ENABLED } from "@/lib/feature-flags";
import {
  catalogStripePriceError,
  parseShopCheckoutRequest,
  planShopCheckoutLines,
  resolveShopCheckout,
  shopCheckoutMetadata,
} from "@/lib/shop-checkout";
import { SHOP_LOT_PRICE_CENTS } from "@/lib/shop-price";
import { syncShopLotToStripe } from "@/lib/shop-stripe-sync";
import { getAppBaseUrl, getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  if (!SHOP_ENABLED) {
    return NextResponse.json({ error: "La boutique est désactivée." }, { status: 403 });
  }
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const parsed = parseShopCheckoutRequest(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const rows = await db.select().from(shopPacks).where(inArray(shopPacks.id, parsed.packIds));
  const purchases = await db
    .select({ packId: userPurchases.packId })
    .from(userPurchases)
    .where(and(eq(userPurchases.userId, user.id), inArray(userPurchases.packId, parsed.packIds)));
  const ownedIds = new Set(purchases.map((purchase) => purchase.packId));

  const resolved = resolveShopCheckout(
    parsed.packIds,
    rows.map((pack) => ({
      id: pack.id,
      title: pack.title,
      description: pack.description,
      price: pack.price,
      language: pack.language,
      isActive: pack.isActive,
      type: pack.type,
      stripePriceId: pack.stripePriceId,
      owned: ownedIds.has(pack.id),
    }))
  );
  if (!resolved.ok) {
    return NextResponse.json(
      {
        error: resolved.error,
        code: resolved.code,
        ownedPackIds: resolved.ownedPackIds,
      },
      { status: resolved.status }
    );
  }

  let linePlans;
  try {
    linePlans = planShopCheckoutLines(resolved.quote, resolved.packs);
  } catch (error) {
    console.error("[POST /api/shop/checkout] lignes", error);
    return NextResponse.json({ error: "La sélection ne peut pas être payée." }, { status: 400 });
  }

  const stripe = getStripe();
  const lineItems: Array<
    | { price: string; quantity: number }
    | {
        price_data: {
          currency: "eur";
          unit_amount: number;
          product_data: { name: string; description: string; metadata: { packId: string } };
        };
        quantity: number;
      }
  > = [];

  for (const line of linePlans) {
    if (line.kind === "lot") {
      let synced;
      try {
        synced = await syncShopLotToStripe();
      } catch (error) {
        console.error("[POST /api/shop/checkout] sync lot", error);
        return NextResponse.json(
          { error: "Le paiement du lot est indisponible pour le moment." },
          { status: 502 }
        );
      }
      if (synced.unitAmount !== SHOP_LOT_PRICE_CENTS || synced.unitAmount !== line.unitAmountCents) {
        console.error("[POST /api/shop/checkout] prix de lot inattendu", synced.unitAmount);
        return NextResponse.json(
          { error: "Le paiement du lot est indisponible pour le moment." },
          { status: 502 }
        );
      }
      lineItems.push({ price: synced.stripePriceId, quantity: line.quantity });
      continue;
    }

    if (line.stripePriceId) {
      const stripePrice = await stripe.prices.retrieve(line.stripePriceId);
      const mismatch = catalogStripePriceError(stripePrice, line.unitAmountCents);
      if (mismatch) {
        return NextResponse.json({ error: mismatch }, { status: 409 });
      }
      lineItems.push({ price: line.stripePriceId, quantity: 1 });
      continue;
    }

    lineItems.push({
      price_data: {
        currency: "eur",
        unit_amount: line.unitAmountCents,
        product_data: {
          name: line.title,
          description: line.description,
          metadata: { packId: line.packId },
        },
      },
      quantity: 1,
    });
  }

  const metadata = shopCheckoutMetadata(user.id, resolved.quote);
  const base = getAppBaseUrl();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: user.email,
    line_items: lineItems,
    metadata,
    success_url: `${base}/app/shop?success=true&packs=${encodeURIComponent(resolved.quote.packIds.join(","))}`,
    cancel_url: `${base}/app/shop?canceled=true`,
  });

  return NextResponse.json({ url: session.url });
}
