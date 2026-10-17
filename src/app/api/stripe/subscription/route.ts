import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { billingHttpError, loadSubscriptionView } from "@/lib/stripe-billing";

/** État d'abonnement de l'élève connecté. Ne bloque aucun contenu. */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (user.role === "professeur") {
    return NextResponse.json({ showBilling: false });
  }

  try {
    const subscription = await loadSubscriptionView(user.id);
    if (!subscription) {
      return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
    }
    return NextResponse.json(subscription);
  } catch (error) {
    const httpError = billingHttpError(error);
    if (httpError) {
      return NextResponse.json({ error: httpError.message }, { status: httpError.status });
    }
    console.error("[GET /api/stripe/subscription]", error);
    return NextResponse.json(
      { error: "Impossible de lire l'abonnement." },
      { status: 500 }
    );
  }
}
