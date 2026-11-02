import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { PromoCodeError } from "@/lib/promo-codes";
import { loadIncludesTrial, previewPromoCode } from "@/lib/promo-codes-server";

/** Vérifie un code promo sans le consommer. L'usage est enregistré au webhook. */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (user.role === "professeur") {
    return NextResponse.json(
      { error: "L'abonnement élève ne s'applique pas à un compte professeur." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const code = body && typeof body === "object" ? (body as { code?: unknown }).code : null;
  if (typeof code !== "string") {
    return NextResponse.json({ error: "Saisissez un code." }, { status: 400 });
  }

  try {
    const includesTrial = await loadIncludesTrial(user.id);
    const preview = await previewPromoCode({ userId: user.id, rawCode: code, includesTrial });
    return NextResponse.json(preview);
  } catch (error) {
    if (error instanceof PromoCodeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/promo/validate]", error);
    return NextResponse.json({ error: "Impossible de vérifier ce code." }, { status: 500 });
  }
}
