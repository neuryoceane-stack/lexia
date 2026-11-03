import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { loadBibliothequeForUser, type BibliothequeListRow } from "@/lib/bibliotheque.server";

export type BibliothequeList = BibliothequeListRow;

/**
 * GET /api/bibliotheque
 * Query: lang (ISO 639-3), search (list name or word), sort (alpha | created | updated)
 */
export async function GET(request: Request) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang")?.trim() || undefined;
  const search = searchParams.get("search")?.trim() || undefined;
  const sortParam = searchParams.get("sort") || "alpha";
  const sort =
    sortParam === "created" || sortParam === "updated" ? sortParam : "alpha";

  const { lists, languages } = await loadBibliothequeForUser(user.id, {
    lang,
    search,
    sort,
  });

  return NextResponse.json({ lists, languages });
}
