import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { isCancellationStorageUnavailable, parisDayStamp } from "@/lib/cancellation";
import { BRAND_NAME } from "@/lib/brand";
import { loadChurnCsv } from "@/lib/cancellation-stats";

/** Export CSV de tous les départs. Mêmes colonnes que le tableau. */
export async function GET() {
  const user = await getUser();
  if (!user || user.role !== "creator") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const csv = await loadChurnCsv();
    const slug = BRAND_NAME.toLowerCase().replace(/\s+/g, "-");
    const filename = `${slug}-desabonnements-${parisDayStamp(new Date())}.csv`;
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (isCancellationStorageUnavailable(error)) {
      console.error("[GET /api/creator/churn/export] table absente", error);
      return NextResponse.json(
        { error: "Les désabonnements ne sont pas encore disponibles." },
        { status: 503 },
      );
    }
    console.error("[GET /api/creator/churn/export]", error);
    return NextResponse.json(
      { error: "Impossible d'exporter les désabonnements." },
      { status: 500 },
    );
  }
}
