import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";

/**
 * POST /api/extract/song
 * Body: { query: string } — artiste + titre
 * Returns { text: string } — paroles de la chanson.
 * Bientôt disponible.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  let body: { query?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Recherche requise" }, { status: 400 });
  }
  const query = typeof body?.query === "string" ? body.query.trim() : "";
  if (!query) {
    return NextResponse.json({ error: "Artiste + titre requis" }, { status: 400 });
  }
  // TODO: implémenter la recherche de paroles (API externe)
  return NextResponse.json(
    { error: "Recherche de paroles — bientôt disponible" },
    { status: 501 }
  );
}
