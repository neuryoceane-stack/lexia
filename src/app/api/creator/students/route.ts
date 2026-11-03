import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parsePage, parseStudentFilter, parseStudentSearch } from "@/lib/creator-students";
import { loadStudentList, type Queryable } from "@/lib/creator-students-stats";

export const dynamic = "force-dynamic";

/** Liste paginée des élèves. Réservé au rôle créateur. */
export async function GET(request: Request) {
  const user = await getUser();
  if (!user || user.role !== "creator") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const url = new URL(request.url);
  const filter = parseStudentFilter(url.searchParams.get("filter"));
  const search = parseStudentSearch(url.searchParams.get("q"));
  const page = parsePage(url.searchParams.get("page"));
  if (!filter || !search.ok || page == null) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  try {
    const list = await loadStudentList(db as Queryable, {
      filter,
      query: search.query,
      page,
      now: new Date(),
    });
    return NextResponse.json(list, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[GET /api/creator/students]", error);
    return NextResponse.json({ error: "Impossible de charger les élèves." }, { status: 500 });
  }
}
