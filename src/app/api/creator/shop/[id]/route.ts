import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { shopPacks } from "@/lib/db/schema";
import { shopPackContentErrorMessage, shopPackDetailFromRow } from "@/lib/shop-pack-contents";
import { SHOP_PACK_ID_PATTERN } from "@/lib/shop-price";

export const dynamic = "force-dynamic";

/**
 * Contenu d'un seul pack (words_json). Réservé au créateur.
 * La liste GET /api/creator/shop ne l'envoie pas : 64 packs rendraient la page lourde.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user || user.role !== "creator") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!SHOP_PACK_ID_PATTERN.test(id)) {
    return NextResponse.json({ error: "Pack introuvable" }, { status: 404 });
  }

  try {
    const [pack] = await db.select().from(shopPacks).where(eq(shopPacks.id, id)).limit(1);
    if (!pack) {
      return NextResponse.json({ error: "Pack introuvable" }, { status: 404 });
    }
    const detail = shopPackDetailFromRow(pack);
    return NextResponse.json(detail, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[GET /api/creator/shop/:id]", error);
    const contentError = shopPackContentErrorMessage(error);
    if (contentError) {
      return NextResponse.json({ error: contentError }, { status: 422 });
    }
    return NextResponse.json(
      { error: "Le contenu de ce pack n'a pas pu être chargé." },
      { status: 500 },
    );
  }
}
