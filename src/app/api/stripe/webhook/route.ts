import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { recordPromoRedemptionFromCheckout } from "@/lib/promo-codes-server";
import {
  applyInvoicePaymentFailed,
  applyStripeSubscription,
  isSubscriptionCheckout,
  syncSubscriptionCheckout,
} from "@/lib/stripe-billing";
import { logServerError } from "@/lib/server-error-log";
import { shopCheckoutEventDisposition, type ShopPaymentView } from "@/lib/shop-checkout";
import { fulfillShopCheckout } from "@/lib/shop-fulfillment";

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

  const shopEvent = shopCheckoutEventDisposition(event.type);
  if (shopEvent === "ignore") {
    return NextResponse.json({ received: true });
  }

  if (shopEvent === "fulfill") {
    // shopCheckoutEventDisposition ne renvoie "fulfill" que pour les sessions Checkout.
    const session = event.data.object as Stripe.Checkout.Session;
    if (isSubscriptionCheckout(session)) {
      if (event.type !== "checkout.session.completed") {
        return NextResponse.json({ received: true });
      }
      try {
        await syncSubscriptionCheckout(session, event.created);
        await recordPromoRedemptionFromCheckout(session.metadata, event.created);
      } catch (error) {
        console.error("[stripe webhook] checkout abonnement", error);
        logServerError({
          source: "webhook",
          route: "/api/stripe/webhook",
          method: "POST",
          error,
          statusCode: 500,
        });
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
    logServerError({
      source: "webhook",
      route: "/api/stripe/webhook",
      method: "POST",
      error,
      statusCode: 500,
    });
    return NextResponse.json({ error: "Traitement webhook échoué" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function toShopPaymentView(session: Stripe.Checkout.Session): ShopPaymentView {
  const paymentIntent = session.payment_intent;
  return {
    id: session.id,
    mode: session.mode ?? null,
    paymentStatus: session.payment_status ?? null,
    amountTotal: session.amount_total,
    paymentIntentId:
      typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id ?? null,
    metadata: session.metadata,
  };
}

async function handleShopCheckout(session: Stripe.Checkout.Session) {
  try {
    const result = await fulfillShopCheckout(toShopPaymentView(session));
    if (result.httpStatus === 200) {
      return NextResponse.json({ received: true });
    }
    console.error("[stripe webhook] checkout boutique", result.error);
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  } catch (error) {
    console.error("[stripe webhook] checkout boutique", error);
    logServerError({
      source: "webhook",
      route: "/api/stripe/webhook",
      method: "POST",
      error,
      statusCode: 500,
    });
    return NextResponse.json({ error: "Traitement webhook échoué" }, { status: 500 });
  }
}
