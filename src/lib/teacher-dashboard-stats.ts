import { db } from "@/lib/db";
import {
  classLists,
  classMembers,
  classes,
  revisions,
  users,
  userProfiles,
} from "@/lib/db/schema";
import { and, eq, gte, inArray } from "drizzle-orm";

export type TeacherDashboardStats = {
  firstName: string | null;
  activeClassesCount: number;
  activeStudentsThisWeek: number;
  assignedListsCount: number;
  /** Bannière : null si aucune classe */
  topClassBanner: null | {
    classId: string;
    title: string;
    masteryPct: number;
    masteryDeltaPct: number;
    hasRevisionData: boolean;
  };
};

/**
 * Agrège les métriques du tableau de bord professeur (classes, élèves, révisions).
 */
export async function getTeacherDashboardStats(
  teacherId: string
): Promise<TeacherDashboardStats> {
  const [profile] = await db
    .select({ firstName: userProfiles.firstName })
    .from(userProfiles)
    .where(eq(userProfiles.userId, teacherId))
    .limit(1);

  const [userRow] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, teacherId))
    .limit(1);

  const teacherClasses = await db
    .select({ id: classes.id, title: classes.title })
    .from(classes)
    .where(eq(classes.teacherId, teacherId));

  const activeClassesCount = teacherClasses.length;

  const displayFirst =
    profile?.firstName?.trim() ||
    userRow?.name?.trim()?.split(/\s+/)[0] ||
    null;

  if (activeClassesCount === 0) {
    return {
      firstName: displayFirst,
      activeClassesCount: 0,
      activeStudentsThisWeek: 0,
      assignedListsCount: 0,
      topClassBanner: null,
    };
  }

  const classIds = teacherClasses.map((c) => c.id);

  const members = await db
    .select({
      classId: classMembers.classId,
      userId: classMembers.userId,
    })
    .from(classMembers)
    .where(
      and(
        inArray(classMembers.classId, classIds),
        eq(classMembers.status, "accepted")
      )
    );

  const studentUserIds = [...new Set(members.map((m) => m.userId))];

  const classToStudents = new Map<string, Set<string>>();
  for (const m of members) {
    if (!classToStudents.has(m.classId)) {
      classToStudents.set(m.classId, new Set());
    }
    classToStudents.get(m.classId)!.add(m.userId);
  }

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  let activeStudentsThisWeek = 0;
  if (studentUserIds.length > 0) {
    const activeRows = await db
      .select({ userId: revisions.userId })
      .from(revisions)
      .where(
        and(
          gte(revisions.createdAt, weekStart),
          inArray(revisions.userId, studentUserIds)
        )
      );
    activeStudentsThisWeek = new Set(activeRows.map((r) => r.userId)).size;
  }

  const assignedRows = await db
    .select({ listId: classLists.listId })
    .from(classLists)
    .where(inArray(classLists.classId, classIds));
  const assignedListsCount = new Set(assignedRows.map((r) => r.listId)).size;

  /** Révisions des 14 derniers jours pour élèves des classes du prof. */
  let recentRevisions: { userId: string; success: boolean; createdAt: Date }[] =
    [];
  if (studentUserIds.length > 0) {
    recentRevisions = await db
      .select({
        userId: revisions.userId,
        success: revisions.success,
        createdAt: revisions.createdAt,
      })
      .from(revisions)
      .where(
        and(
          gte(revisions.createdAt, prevWeekStart),
          inArray(revisions.userId, studentUserIds)
        )
      );
  }

  function masteryInRange(
    classId: string,
    from: Date,
    to: Date
  ): { pct: number; n: number } {
    const studs = classToStudents.get(classId);
    if (!studs || studs.size === 0) return { pct: 0, n: 0 };
    let total = 0;
    let ok = 0;
    for (const r of recentRevisions) {
      if (!studs.has(r.userId)) continue;
      if (r.createdAt < from || r.createdAt >= to) continue;
      total += 1;
      if (r.success) ok += 1;
    }
    if (total === 0) return { pct: 0, n: 0 };
    return { pct: Math.round((100 * ok) / total), n: total };
  }

  let bestClassId: string | null = null;
  let bestActivity = -1;

  for (const c of teacherClasses) {
    let activity = 0;
    const studs = classToStudents.get(c.id);
    if (studs) {
      for (const r of recentRevisions) {
        if (!studs.has(r.userId)) continue;
        if (r.createdAt >= weekStart && r.createdAt <= now) activity += 1;
      }
    }
    if (activity > bestActivity) {
      bestActivity = activity;
      bestClassId = c.id;
    }
  }

  if (!bestClassId && teacherClasses[0]) {
    bestClassId = teacherClasses[0].id;
  }

  const top = teacherClasses.find((c) => c.id === bestClassId) ?? teacherClasses[0];

  const thisWeek = masteryInRange(top.id, weekStart, now);
  const prevWeek = masteryInRange(top.id, prevWeekStart, weekStart);
  const masteryDeltaPct = thisWeek.pct - prevWeek.pct;

  return {
    firstName: displayFirst,
    activeClassesCount,
    activeStudentsThisWeek,
    assignedListsCount,
    topClassBanner: {
      classId: top.id,
      title: top.title,
      masteryPct: thisWeek.pct,
      masteryDeltaPct,
      hasRevisionData: thisWeek.n > 0,
    },
  };
}
