import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shopPacks, userPurchases } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import { getAppBaseUrl, getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
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

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: user.email,
    line_items: [
      stripePriceId
        ? { price: stripePriceId, quantity: 1 }
        : {
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
          },
    ],
    metadata: {
      userId: user.id,
      packId: pack.id,
    },
    success_url: `${base}/app/shop?success=true&pack=${encodeURIComponent(pack.id)}`,
    cancel_url: `${base}/app/shop?canceled=true`,
  });

  return NextResponse.json({ url: session.url });
}