import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { loadChurnDashboard } from "@/lib/cancellation-stats";

/** Indicateurs et derniers départs. Réservé au rôle créateur. */
export async function GET() {
  const user = await getUser();
  if (!user || user.role !== "creator") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const dashboard = await loadChurnDashboard();
    return NextResponse.json(dashboard, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[GET /api/creator/churn]", error);
    return NextResponse.json(
      { error: "Impossible de charger les désabonnements." },
      { status: 500 },
    );
  }
}
