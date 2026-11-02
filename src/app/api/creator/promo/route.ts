import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { PromoCodeError, parsePromoDraft } from "@/lib/promo-codes";
import { billingHttpError } from "@/lib/stripe-billing";
import { createPromoCode, listPromoCodes } from "@/lib/promo-codes-server";

export async function GET() {
  const denied = await creatorGuard();
  if (denied) return denied;

  try {
    const dashboard = await listPromoCodes();
    return NextResponse.json(dashboard);
  } catch (error) {
    return promoErrorResponse(error, "[GET /api/creator/promo]", "Impossible de charger les codes promo.");
  }
}

export async function POST(req: Request) {
  const denied = await creatorGuard();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = parsePromoDraft(body, new Date());
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.message }, { status: 400 });
  }

  try {
    const created = await createPromoCode(parsed.draft);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return promoErrorResponse(error, "[POST /api/creator/promo]", "Le code n'a pas pu être enregistré.");
  }
}

async function creatorGuard(): Promise<NextResponse | null> {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (user.role !== "creator") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  return null;
}

function promoErrorResponse(error: unknown, label: string, fallback: string): NextResponse {
  if (error instanceof PromoCodeError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  const stripeError = billingHttpError(error);
  if (stripeError) {
    return NextResponse.json({ error: stripeError.message }, { status: stripeError.status });
  }
  console.error(label, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}
