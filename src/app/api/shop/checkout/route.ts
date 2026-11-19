import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shopPacks, userPurchases } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import { SHOP_ENABLED } from "@/lib/feature-flags";
import { getAppBaseUrl, getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  if (!SHOP_ENABLED) {
    return NextResponse.json({ error: "La boutique est désactivée." }, { status: 403 });
  }
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { packId } = await req.json();
  if (!packId) return NextResponse.json({ error: "packId required" }, { status: 400 });

  const [pack] = await db
    .select()
    .from(shopPacks)
    .where(eq(shopPacks.id, packId))
    .limit(1);

  if (!pack || !pack.isActive || pack.type !== "thematique") {
    return NextResponse.json({ error: "Pack not found" }, { status: 404 });
  }

  const [existing] = await db
    .select({ id: userPurchases.id })
    .from(userPurchases)
    .where(and(eq(userPurchases.userId, user.id), eq(userPurchases.packId, pack.id)))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: "Déjà possédé" }, { status: 409 });
  }

  const base = getAppBaseUrl();
  const stripe = getStripe();
  const stripePriceId = pack.stripePriceId?.trim();

  let lineItem:
    | { price: string; quantity: number }
    | {
        price_data: {
          currency: "eur";
          unit_amount: number;
          product_data: { name: string; description: string; metadata: { packId: string } };
        };
        quantity: number;
      };

  if (stripePriceId) {
    const stripePrice = await stripe.prices.retrieve(stripePriceId);
    if (!stripePrice.active || stripePrice.unit_amount !== pack.price) {
      return NextResponse.json(
        {
          error:
            "Le prix Stripe ne correspond pas au prix de la liste. Réactivez la liste depuis le Creator pour resynchroniser.",
        },
        { status: 409 }
      );
    }
    lineItem = { price: stripePriceId, quantity: 1 };
  } else {
    lineItem = {
      price_data: {
        currency: "eur",
        unit_amount: pack.price,
        product_data: {
          name: pack.title,
          description: pack.description,
          metadata: { packId: pack.id },
        },
      },
      quantity: 1,
    };
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: user.email,
    line_items: [lineItem],
    metadata: {
      userId: user.id,
      packId: pack.id,
    },
    success_url: `${base}/app/shop?success=true&pack=${encodeURIComponent(pack.id)}`,
    cancel_url: `${base}/app/shop?canceled=true`,
  });

  return NextResponse.json({ url: session.url });
}