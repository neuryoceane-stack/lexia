import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { shopPacks, userPurchases, words } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createUserListPair } from "@/lib/user-list";
import { getStripe } from "@/lib/stripe";
import {
  applyInvoicePaymentFailed,
  applyStripeSubscription,
  isSubscriptionCheckout,
  syncSubscriptionCheckout,
} from "@/lib/stripe-billing";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET manquante");
    return NextResponse.json({ error: "Webhook non configuré" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("[stripe webhook] signature invalide", err);
    return NextResponse.json({ error: "Webhook signature invalid" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (isSubscriptionCheckout(session)) {
      try {
        await syncSubscriptionCheckout(session, event.created);
      } catch (error) {
        console.error("[stripe webhook] checkout abonnement", error);
        return NextResponse.json({ error: "Traitement webhook échoué" }, { status: 500 });
      }
      return NextResponse.json({ received: true });
    }
    return handleShopCheckout(session);
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await applyStripeSubscription({
          eventCreated: event.created,
          subscription: event.data.object,
        });
        break;
      case "invoice.payment_failed":
        await applyInvoicePaymentFailed({
          eventCreated: event.created,
          invoice: event.data.object,
        });
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(`[stripe webhook] ${event.type}`, error);
    return NextResponse.json({ error: "Traitement webhook échoué" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleShopCheckout(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const packId = session.metadata?.packId;

  if (!userId || !packId) {
    return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
  }

  const [pack] = await db
    .select()
    .from(shopPacks)
    .where(eq(shopPacks.id, packId))
    .limit(1);

  if (!pack) return NextResponse.json({ error: "Pack not found" }, { status: 404 });

  const [existingPurchase] = await db
    .select()
    .from(userPurchases)
    .where(and(eq(userPurchases.userId, userId), eq(userPurchases.packId, packId)))
    .limit(1);

  if (existingPurchase) return NextResponse.json({ received: true });

  await db.insert(userPurchases).values({
    id: crypto.randomUUID(),
    userId,
    packId,
    stripeSessionId: session.id,
    stripePaymentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
    amountPaid: session.amount_total ?? pack.price,
  });

  const { listId } = await createUserListPair({
    userId,
    name: pack.title,
    source: "shop",
    language: pack.language,
  });

  if (pack.wordsJson) {
    type PackWord = { term: string; definition: string; isExpression?: boolean };
    const packWords: PackWord[] = JSON.parse(pack.wordsJson);
    for (let i = 0; i < packWords.length; i++) {
      await db.insert(words).values({
        id: crypto.randomUUID(),
        listId,
        term: packWords[i].term,
        definition: packWords[i].definition,
        rank: i,
        isExpression: packWords[i].isExpression ?? false,
      });
    }
  }

  return NextResponse.json({ received: true });
}
