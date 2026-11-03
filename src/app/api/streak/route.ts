import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { computeUserStreak } from "@/lib/streak.server";

/**
 * GET /api/streak
 * Retourne la série (streak) de l'utilisateur : nombre de jours consécutifs avec au moins une session de révision.
 */
export async function GET() {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { currentStreak, longestStreak } = await computeUserStreak(user.id);

  return NextResponse.json({
    currentStreak,
    longestStreak,
  });
}
