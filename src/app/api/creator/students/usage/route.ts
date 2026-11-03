import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { loadUsage, type Queryable } from "@/lib/creator-students-stats";

export const dynamic = "force-dynamic";

/** Usage agrégé des 7 derniers jours. Réservé au rôle créateur. */
export async function GET() {
  const user = await getUser();
  if (!user || user.role !== "creator") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const report = await loadUsage(db as Queryable, new Date());
    return NextResponse.json(report, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[GET /api/creator/students/usage]", error);
    return NextResponse.json({ error: "Impossible de charger l'usage de l'app." }, { status: 500 });
  }
}
