import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { loadBibliothequeForUser } from "@/lib/bibliotheque.server";
import { computeDashboardStats } from "@/lib/dashboard-stats.server";
import { computeUserStreak } from "@/lib/streak.server";

export type HomeDashboardPayload = {
  streak: { currentStreak: number; longestStreak: number };
  stats: {
    listsCount: number;
    wordsCount: number;
    dueWordsCount: number;
    masteredWordsCount: number;
  };
  firstName: string | null;
  lists: Array<{
    id: string;
    familyId: string;
    name: string;
    language: string | null;
    wordCount: number;
    progressPercent: number;
    dueTodayCount: number;
  }>;
};

export async function loadHomeDashboard(
  userId: string
): Promise<HomeDashboardPayload> {
  const [streak, stats, profileRow, bibliotheque] = await Promise.all([
    computeUserStreak(userId),
    computeDashboardStats(userId),
    db
      .select({ firstName: userProfiles.firstName })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1),
    loadBibliothequeForUser(userId, { sort: "created" }),
  ]);

  const firstName =
    typeof profileRow[0]?.firstName === "string"
      ? profileRow[0].firstName.trim()
      : null;

  const lists = bibliotheque.lists.slice(0, 3).map((row) => ({
    id: row.id,
    familyId: row.familyId,
    name: row.name,
    language: row.language,
    wordCount: row.wordCount,
    progressPercent: row.progressPercent,
    dueTodayCount: row.dueTodayCount,
  }));

  return { streak, stats, firstName, lists };
}
