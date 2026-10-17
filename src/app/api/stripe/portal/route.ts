import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { billingHttpError, createBillingPortalUrl } from "@/lib/stripe-billing";

/** Ouvre le portail client Stripe (carte, formule, résiliation, factures). */
export async function POST() {
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

  try {
    const url = await createBillingPortalUrl(user.id);
    return NextResponse.json({ url });
  } catch (error) {
    const httpError = billingHttpError(error);
    if (httpError) {
      return NextResponse.json({ error: httpError.message }, { status: httpError.status });
    }
    console.error("[POST /api/stripe/portal]", error);
    return NextResponse.json(
      { error: "Impossible d'ouvrir le portail de gestion." },
      { status: 500 }
    );
  }
}
