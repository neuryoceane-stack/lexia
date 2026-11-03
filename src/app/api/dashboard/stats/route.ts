import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { computeDashboardStats } from "@/lib/dashboard-stats.server";

export async function GET() {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const stats = await computeDashboardStats(user.id);
  return NextResponse.json(stats);
}
