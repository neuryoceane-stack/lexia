import { db } from "@/lib/db";
import {
  classLists,
  classMembers,
  classes,
  revisions,
  words,
} from "@/lib/db/schema";
import { and, count, desc, eq, inArray } from "drizzle-orm";

export type TeacherClassListRow = {
  id: string;
  title: string;
  identifier: string;
  /** Niveau scolaire (création de classe) ; badge masqué si absent. */
  schoolLevel: string | null;
  studentCount: number;
  listCount: number;
  /** Pourcentage de révisions réussies (mots des listes assignées, élèves acceptés). 0 si aucune révision. */
  masteryPct: number;
};

/**
 * Agrège pour la page « Mes classes » : effectifs, listes assignées, maîtrise moyenne par classe.
 */
export async function getTeacherClassesListStats(
  teacherId: string
): Promise<{
  rows: TeacherClassListRow[];
  totalDistinctStudents: number;
}> {
  const teacherClasses = await db
    .select({
      id: classes.id,
      title: classes.title,
      identifier: classes.identifier,
      schoolLevel: classes.schoolLevel,
    })
    .from(classes)
    .where(eq(classes.teacherId, teacherId))
    .orderBy(desc(classes.createdAt));

  if (teacherClasses.length === 0) {
    return { rows: [], totalDistinctStudents: 0 };
  }

  const classIds = teacherClasses.map((c) => c.id);

  const memberAgg = await db
    .select({
      classId: classMembers.classId,
      n: count(classMembers.id),
    })
    .from(classMembers)
    .where(
      and(
        inArray(classMembers.classId, classIds),
        eq(classMembers.status, "accepted")
      )
    )
    .groupBy(classMembers.classId);

  const listAgg = await db
    .select({
      classId: classLists.classId,
      n: count(classLists.id),
    })
    .from(classLists)
    .where(inArray(classLists.classId, classIds))
    .groupBy(classLists.classId);

  const memberCountByClass = new Map<string, number>();
  for (const r of memberAgg) {
    memberCountByClass.set(r.classId, r.n);
  }
  const listCountByClass = new Map<string, number>();
  for (const r of listAgg) {
    listCountByClass.set(r.classId, r.n);
  }

  const allMembers = await db
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

  const distinctStudentIds = new Set(allMembers.map((m) => m.userId));

  const listsByClass = await db
    .select({
      classId: classLists.classId,
      listId: classLists.listId,
    })
    .from(classLists)
    .where(inArray(classLists.classId, classIds));

  const listIdsByClass = new Map<string, string[]>();
  for (const row of listsByClass) {
    const arr = listIdsByClass.get(row.classId) ?? [];
    arr.push(row.listId);
    listIdsByClass.set(row.classId, arr);
  }

  const studentsByClass = new Map<string, string[]>();
  for (const m of allMembers) {
    const arr = studentsByClass.get(m.classId) ?? [];
    arr.push(m.userId);
    studentsByClass.set(m.classId, arr);
  }

  const masteryByClass = new Map<string, number>();
  await Promise.all(
    teacherClasses.map(async (c) => {
      const listIds = listIdsByClass.get(c.id) ?? [];
      const userIds = studentsByClass.get(c.id) ?? [];
      if (listIds.length === 0 || userIds.length === 0) {
        masteryByClass.set(c.id, 0);
        return;
      }
      const revRows = await db
        .select({ success: revisions.success })
        .from(revisions)
        .innerJoin(words, eq(words.id, revisions.wordId))
        .where(
          and(
            inArray(revisions.userId, userIds),
            inArray(words.listId, listIds)
          )
        );
      if (revRows.length === 0) {
        masteryByClass.set(c.id, 0);
        return;
      }
      const ok = revRows.filter((r) => r.success).length;
      masteryByClass.set(c.id, Math.round((100 * ok) / revRows.length));
    })
  );

  const rows: TeacherClassListRow[] = teacherClasses.map((c) => ({
    id: c.id,
    title: c.title,
    identifier: c.identifier,
    schoolLevel: c.schoolLevel ?? null,
    studentCount: memberCountByClass.get(c.id) ?? 0,
    listCount: listCountByClass.get(c.id) ?? 0,
    masteryPct: masteryByClass.get(c.id) ?? 0,
  }));

  return {
    rows,
    totalDistinctStudents: distinctStudentIds.size,
  };
}
