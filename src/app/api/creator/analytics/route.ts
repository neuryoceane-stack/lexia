import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  words,
  revisionSessions,
  feedbacks,
} from "@/lib/db/schema";
import { eq, gte, sql } from "drizzle-orm";

export type AnalyticsData = {
  totalUsers: number;
  newUsersThisWeek: number;
  usersByRole: Record<string, number>;
  totalWords: number;
  wordsThisWeek: number;
  totalSessions: number;
  sessionsThisWeek: number;
  pendingFeedbacks: number;
};

/**
 * GET /api/creator/analytics
 * Métriques globales (role creator uniquement).
 */
export async function GET() {
  const user = await getUser();
  if (!user || user.role !== "creator") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsersResult,
    newUsersThisWeekResult,
    usersByRoleRows,
    totalWordsResult,
    wordsThisWeekResult,
    totalSessionsResult,
    sessionsThisWeekResult,
    pendingFeedbacksResult,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(users),
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(users)
      .where(gte(users.createdAt, sevenDaysAgo)),
    db
      .select({
        role: users.role,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(users)
      .groupBy(users.role),
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(words),
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(words)
      .where(gte(words.createdAt, sevenDaysAgo)),
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(revisionSessions),
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(revisionSessions)
      .where(gte(revisionSessions.createdAt, sevenDaysAgo)),
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(feedbacks)
      .where(eq(feedbacks.status, "pending")),
  ]);

  const usersByRole: Record<string, number> = {
    student: 0,
    teacher: 0,
    creator: 0,
  };
  for (const row of usersByRoleRows) {
    const r = (row.role ?? "student") as string;
    usersByRole[r] = row.count;
  }

  const data: AnalyticsData = {
    totalUsers: totalUsersResult[0]?.count ?? 0,
    newUsersThisWeek: newUsersThisWeekResult[0]?.count ?? 0,
    usersByRole,
    totalWords: totalWordsResult[0]?.count ?? 0,
    wordsThisWeek: wordsThisWeekResult[0]?.count ?? 0,
    totalSessions: totalSessionsResult[0]?.count ?? 0,
    sessionsThisWeek: sessionsThisWeekResult[0]?.count ?? 0,
    pendingFeedbacks: pendingFeedbacksResult[0]?.count ?? 0,
  };

  return NextResponse.json(data);
}
