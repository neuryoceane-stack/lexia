import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { revisionSessions } from "@/lib/db/schema";
import { and, eq, gte } from "drizzle-orm";

/**
 * GET /api/streak
 * Retourne la série (streak) de l'utilisateur : nombre de jours consécutifs avec au moins une session de révision.
 * - currentStreak : en partant d'aujourd'hui, nombre de jours d'affilée (0 si pas d'activité aujourd'hui).
 * - longestStreak : plus longue série sur les 365 derniers jours (optionnel).
 */
export async function GET() {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = user.id;

  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);
  oneYearAgo.setHours(0, 0, 0, 0);

  const rows = await db
    .select({ startedAt: revisionSessions.startedAt })
    .from(revisionSessions)
    .where(
      and(
        eq(revisionSessions.userId, userId),
        gte(revisionSessions.startedAt, oneYearAgo)
      )
    );

  const dateSet = new Set<string>();
  for (const r of rows) {
    if (r.startedAt) {
      const d = new Date(r.startedAt);
      dateSet.add(d.toISOString().slice(0, 10));
    }
  }
  const sortedDates = Array.from(dateSet).sort();

  const today = new Date().toISOString().slice(0, 10);

  let currentStreak = 0;
  if (dateSet.has(today)) {
    currentStreak = 1;
    const check = new Date(today);
    check.setUTCDate(check.getUTCDate() - 1);
    let prev = check.toISOString().slice(0, 10);
    while (dateSet.has(prev)) {
      currentStreak++;
      check.setUTCDate(check.getUTCDate() - 1);
      prev = check.toISOString().slice(0, 10);
    }
  }

  let longestStreak = 0;
  if (sortedDates.length > 0) {
    let run = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]).getTime();
      const curr = new Date(sortedDates[i]).getTime();
      const oneDay = 24 * 60 * 60 * 1000;
      if (curr - prev === oneDay) {
        run++;
      } else {
        longestStreak = Math.max(longestStreak, run);
        run = 1;
      }
    }
    longestStreak = Math.max(longestStreak, run);
  }

  return NextResponse.json({
    currentStreak,
    longestStreak,
  });
}
