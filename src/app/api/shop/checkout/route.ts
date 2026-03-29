import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { shopPacks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

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

  if (!pack || !pack.isActive) {
    return NextResponse.json({ error: "Pack not found" }, { status: 404 });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: pack.price,
          product_data: {
            name: `${pack.emoji} ${pack.title}`,
            description: pack.description,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: user.id,
      packId: pack.id,
    },
    success_url: `${process.env.NEXTAUTH_URL}/app/shop?success=true&pack=${pack.id}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/app/shop?canceled=true`,
  });

  return NextResponse.json({ url: session.url });
}
