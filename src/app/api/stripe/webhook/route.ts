import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { shopPacks, userPurchases, wordFamilies, lists, words } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover" as any,
});

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: "Webhook signature invalid" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.metadata?.userId;
  const packId = session.metadata?.packId;

  if (!userId || !packId) {
    return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
  }

  // Vérifie que le pack existe
  const [pack] = await db
    .select()
    .from(shopPacks)
    .where(eq(shopPacks.id, packId))
    .limit(1);

  if (!pack) return NextResponse.json({ error: "Pack not found" }, { status: 404 });

  // Vérifie que l'achat n'existe pas déjà (idempotence)
  const [existingPurchase] = await db
    .select()
    .from(userPurchases)
    .where(and(eq(userPurchases.userId, userId), eq(userPurchases.packId, packId)))
    .limit(1);

  if (existingPurchase) return NextResponse.json({ received: true });

  // Enregistre l'achat
  await db.insert(userPurchases).values({
    id: crypto.randomUUID(),
    userId,
    packId,
    stripeSessionId: session.id,
    stripePaymentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
    amountPaid: session.amount_total ?? pack.price,
  });

  // Trouve ou crée la wordFamily "Lexi Shop" pour cet utilisateur
  let [shopFamily] = await db
    .select()
    .from(wordFamilies)
    .where(and(eq(wordFamilies.userId, userId), eq(wordFamilies.name, "Lexi Shop")))
    .limit(1);

  if (!shopFamily) {
    const newFamilyId = crypto.randomUUID();
    await db.insert(wordFamilies).values({
      id: newFamilyId,
      userId,
      name: "Lexi Shop",
      orderIndex: 999,
    });
    const [created] = await db
      .select()
      .from(wordFamilies)
      .where(eq(wordFamilies.id, newFamilyId))
      .limit(1);
    shopFamily = created;
  }

  // Crée la liste dans la bibliothèque
  const listId = crypto.randomUUID();
  await db.insert(lists).values({
    id: listId,
    familyId: shopFamily.id,
    name: pack.title,
    source: "shop",
    language: pack.language,
  });

  // Insère les mots du pack
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

// Désactive le bodyParser Next.js pour que Stripe puisse vérifier la signature
export const config = {
  api: {
    bodyParser: false,
  },
};
