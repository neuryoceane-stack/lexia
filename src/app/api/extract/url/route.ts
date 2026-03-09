import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";

/**
 * POST /api/extract/url
 * Body: { url: string }
 * Returns { text: string } — texte extrait de l'URL (article web).
 * Bientôt disponible.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "URL requise" }, { status: 400 });
  }
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!url) {
    return NextResponse.json({ error: "URL requise" }, { status: 400 });
  }
  // TODO: implémenter l'extraction de texte depuis une URL (fetch + parse HTML)
  return NextResponse.json(
    { error: "Extraction depuis URL — bientôt disponible" },
    { status: 501 }
  );
}
