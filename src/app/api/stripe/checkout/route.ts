import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { parseBillingPlan } from "@/lib/subscription";
import { billingHttpError, createSubscriptionCheckout } from "@/lib/stripe-billing";

/** Démarre un Checkout Stripe en mode abonnement (mensuel ou annuel). */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (user.role === "professeur") {
    return NextResponse.json(
      { error: "L'abonnement élève ne s'applique pas à un compte professeur." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const plan = parseBillingPlan(body);
  if (!plan) {
    return NextResponse.json({ error: "Formule invalide" }, { status: 400 });
  }

  try {
    const url = await createSubscriptionCheckout({
      userId: user.id,
      email: user.email,
      plan,
    });
    return NextResponse.json({ url });
  } catch (error) {
    const httpError = billingHttpError(error);
    if (httpError) {
      return NextResponse.json({ error: httpError.message }, { status: httpError.status });
    }
    console.error("[POST /api/stripe/checkout]", error);
    return NextResponse.json(
      { error: "Impossible de démarrer le paiement." },
      { status: 500 }
    );
  }
}
