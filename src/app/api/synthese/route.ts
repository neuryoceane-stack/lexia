import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revisionSessions } from "@/lib/db/schema";
import { and, eq, gte, inArray, lte } from "drizzle-orm";

export type SynthesePeriod = "day" | "week" | "month" | "year" | "all";

function periodBounds(period: SynthesePeriod): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  if (period === "day") {
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (period === "week") {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (period === "month") {
    start.setMonth(start.getMonth() - 1);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (period === "year") {
    start.setFullYear(start.getFullYear() - 1);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  start.setTime(0);
  return { start, end };
}

/**
 * Calcule l'état de l'avatar (1-5) à partir du temps total et de la régularité.
 * État 1 : inactif ; 2 : reprise légère ; 3 : progression normale ; 4 : forte ; 5 : maximal.
 */
function avatarState(
  totalDurationMinutes: number,
  daysWithActivity: number,
  period: SynthesePeriod
): number {
  if (totalDurationMinutes === 0 && daysWithActivity === 0) return 1;
  const maxDays =
    period === "day" ? 1 : period === "week" ? 7 : period === "month" ? 30 : period === "year" ? 365 : 9999;
  const regularity = maxDays > 0 ? daysWithActivity / Math.min(maxDays, 30) : 0;

  if (totalDurationMinutes >= 60 && regularity >= 0.2) return 5;
  if (totalDurationMinutes >= 30 && regularity >= 0.15) return 4;
  if (totalDurationMinutes >= 10 && daysWithActivity >= 2) return 3;
  if (totalDurationMinutes >= 1 || daysWithActivity >= 1) return 2;
  return 1;
}

/**
 * GET /api/synthese
 * Query: period=day|week|month|year|all, languages=eng,fra (optionnel, plusieurs langues séparées par des virgules)
 * Retourne: totalDurationSeconds, wordsRetained, wordsWritten, languagesAvailable, sessionsByDay, avatarState
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") ?? "week") as SynthesePeriod;
  const languagesParam = searchParams.get("languages")?.trim();
  const filterLanguages =
    languagesParam && languagesParam.length > 0
      ? languagesParam.split(",").map((s) => s.trim()).filter(Boolean)
      : null;

  const validPeriods: SynthesePeriod[] = ["day", "week", "month", "year", "all"];
  const periodFilter = validPeriods.includes(period) ? period : "week";
  const { start: periodStart, end: periodEnd } = periodBounds(periodFilter);

  const baseConditions = [eq(revisionSessions.userId, userId)];
  if (periodFilter !== "all") {
    baseConditions.push(gte(revisionSessions.startedAt, periodStart));
    baseConditions.push(lte(revisionSessions.startedAt, periodEnd));
  }
  const dateWhere = and(...baseConditions);
  const conditionsWithLang = [...baseConditions];
  if (filterLanguages && filterLanguages.length > 0) {
    conditionsWithLang.push(inArray(revisionSessions.language, filterLanguages));
  }
  const where = and(...conditionsWithLang);

  const rows = await db
    .select({
      startedAt: revisionSessions.startedAt,
      durationSeconds: revisionSessions.durationSeconds,
      wordsRetained: revisionSessions.wordsRetained,
      wordsWritten: revisionSessions.wordsWritten,
      language: revisionSessions.language,
    })
    .from(revisionSessions)
    .where(where);

  let totalDurationSeconds = 0;
  let wordsRetained = 0;
  let wordsWritten = 0;
  const sessionsByDay: Record<string, { count: number; durationSeconds: number }> = {};
  for (const r of rows) {
    totalDurationSeconds += r.durationSeconds ?? 0;
    wordsRetained += r.wordsRetained ?? 0;
    wordsWritten += r.wordsWritten ?? 0;
    const dayKey = r.startedAt
      ? new Date(r.startedAt).toISOString().slice(0, 10)
      : "";
    if (dayKey) {
      if (!sessionsByDay[dayKey]) {
        sessionsByDay[dayKey] = { count: 0, durationSeconds: 0 };
      }
      sessionsByDay[dayKey].count += 1;
      sessionsByDay[dayKey].durationSeconds += r.durationSeconds ?? 0;
    }
  }

  const daysWithActivity = Object.keys(sessionsByDay).length;
  const totalDurationMinutes = totalDurationSeconds / 60;
  const state = avatarState(totalDurationMinutes, daysWithActivity, periodFilter);

  const languagesAvailable = await getLanguagesForPeriod(
    userId,
    periodFilter,
    periodStart,
    periodEnd
  );

  return NextResponse.json({
    totalDurationSeconds,
    wordsRetained,
    wordsWritten,
    languagesAvailable,
    sessionsByDay,
    avatarState: state,
  });
}

async function getLanguagesForPeriod(
  userId: string,
  period: SynthesePeriod,
  periodStart: Date,
  periodEnd: Date
): Promise<string[]> {
  const baseConditions = [eq(revisionSessions.userId, userId)];
  if (period !== "all") {
    baseConditions.push(gte(revisionSessions.startedAt, periodStart));
    baseConditions.push(lte(revisionSessions.startedAt, periodEnd));
  }
  const allRows = await db
    .select({ language: revisionSessions.language })
    .from(revisionSessions)
    .where(and(...baseConditions));
  const set = new Set<string>();
  for (const r of allRows) {
    if (r.language) set.add(r.language);
  }
  return Array.from(set).sort();
}
