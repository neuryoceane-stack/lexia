import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { BRAND_NAME } from "@/lib/brand";
import { parisDayStamp } from "@/lib/cancellation";
import { db } from "@/lib/db";
import { parseStudentFilter, parseStudentSearch } from "@/lib/creator-students";
import { loadStudentCsv, type Queryable } from "@/lib/creator-students-stats";

export const dynamic = "force-dynamic";

/** CSV des colonnes du tableau, filtré comme la liste. Réservé au rôle créateur. */
export async function GET(request: Request) {
  const user = await getUser();
  if (!user || user.role !== "creator") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const url = new URL(request.url);
  const filter = parseStudentFilter(url.searchParams.get("filter"));
  const search = parseStudentSearch(url.searchParams.get("q"));
  if (!filter || !search.ok) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  try {
    const csv = await loadStudentCsv(db as Queryable, {
      filter,
      query: search.query,
      now: new Date(),
    });
    const slug = BRAND_NAME.toLowerCase().replace(/\s+/g, "-");
    const filename = `${slug}-eleves-${parisDayStamp(new Date())}.csv`;
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[GET /api/creator/students/export]", error);
    return NextResponse.json({ error: "Impossible d'exporter les élèves." }, { status: 500 });
  }
}
