import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { PromoCodeError } from "@/lib/promo-codes";
import { updatePromoActive } from "@/lib/promo-codes-server";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (user.role !== "creator") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const active = body && typeof body === "object" ? (body as { active?: unknown }).active : null;
  if (typeof active !== "boolean") {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  try {
    await updatePromoActive(id, active);
    return NextResponse.json({ id, active });
  } catch (error) {
    if (error instanceof PromoCodeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[PATCH /api/creator/promo]", error);
    return NextResponse.json({ error: "Le code n'a pas pu être mis à jour." }, { status: 500 });
  }
}
