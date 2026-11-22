import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  classLists,
  classMembers,
  classes,
  revisions,
  revisionSessions,
  userProfiles,
  users,
  words,
} from "@/lib/db/schema";

const DAY_MS = 24 * 60 * 60 * 1000;

export type TeacherPilotRow = {
  teacherId: string;
  name: string;
  email: string;
  schoolName: string | null;
  signedUpAt: string;
  classCount: number;
  enrolledStudents: number;
  /** Élèves ayant révisé au moins un mot d'une liste assignée à une de ses classes. */
  firstClassList: number;
  /** Élèves ayant au moins une révision ou une session, toutes listes confondues. */
  firstRevision: number;
  /** Inscrits depuis au moins 7 jours. */
  eligibleAtDay7: number;
  /** Parmi eux, une activité datée du 7e jour ou après. Aucune relance n'est envoyée. */
  activeAtDay7: number;
};

/**
 * Vue créateur du pilote. `funnel_events` n'existe pas : les comptes viennent
 * de users, class_members, revisions et revision_sessions.
 * Première liste = première révision d'un mot d'une liste de classe.
 */
export async function getTeacherPilotRows(): Promise<TeacherPilotRow[]> {
  const teachers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      schoolName: users.schoolName,
      signedUpAt: users.createdAt,
      appRole: users.role,
      firstName: userProfiles.firstName,
      lastName: userProfiles.lastName,
      profileRole: userProfiles.role,
    })
    .from(users)
    .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(or(eq(userProfiles.role, "professeur"), eq(users.role, "teacher"))!);

  const pilotTeachers = teachers.filter((teacher) => teacher.appRole !== "creator");
  if (pilotTeachers.length === 0) return [];

  const teacherIds = pilotTeachers.map((teacher) => teacher.id);
  const classRows = await db
    .select({
      id: classes.id,
      teacherId: classes.teacherId,
    })
    .from(classes)
    .where(inArray(classes.teacherId, teacherIds));

  const classIds = classRows.map((row) => row.id);
  const classesByTeacher = new Map<string, string[]>();
  for (const row of classRows) {
    const list = classesByTeacher.get(row.teacherId) ?? [];
    list.push(row.id);
    classesByTeacher.set(row.teacherId, list);
  }

  const memberRows =
    classIds.length === 0
      ? []
      : await db
          .select({
            classId: classMembers.classId,
            userId: classMembers.userId,
            signedUpAt: users.createdAt,
          })
          .from(classMembers)
          .innerJoin(users, eq(users.id, classMembers.userId))
          .where(
            and(
              inArray(classMembers.classId, classIds),
              eq(classMembers.status, "accepted")
            )
          );

  const studentsByTeacher = new Map<string, Map<string, Date>>();
  const classToTeacher = new Map(classRows.map((row) => [row.id, row.teacherId]));
  for (const member of memberRows) {
    const teacherId = classToTeacher.get(member.classId);
    if (!teacherId) continue;
    const students = studentsByTeacher.get(teacherId) ?? new Map<string, Date>();
    const previous = students.get(member.userId);
    if (!previous || member.signedUpAt < previous) {
      students.set(member.userId, member.signedUpAt);
    }
    studentsByTeacher.set(teacherId, students);
  }

  const assignmentRows =
    classIds.length === 0
      ? []
      : await db
          .select({
            classId: classLists.classId,
            listId: classLists.listId,
          })
          .from(classLists)
          .where(inArray(classLists.classId, classIds));

  const listIds = [...new Set(assignmentRows.map((row) => row.listId))];
  const wordRows =
    listIds.length === 0
      ? []
      : await db
          .select({ id: words.id, listId: words.listId })
          .from(words)
          .where(inArray(words.listId, listIds));

  const wordsByList = new Map<string, string[]>();
  for (const word of wordRows) {
    const list = wordsByList.get(word.listId) ?? [];
    list.push(word.id);
    wordsByList.set(word.listId, list);
  }

  const classWordIdsByTeacher = new Map<string, Set<string>>();
  for (const assignment of assignmentRows) {
    const teacherId = classToTeacher.get(assignment.classId);
    if (!teacherId) continue;
    const set = classWordIdsByTeacher.get(teacherId) ?? new Set<string>();
    for (const wordId of wordsByList.get(assignment.listId) ?? []) set.add(wordId);
    classWordIdsByTeacher.set(teacherId, set);
  }

  const studentIds = [
    ...new Set(memberRows.map((member) => member.userId)),
  ];

  const revisionRows =
    studentIds.length === 0
      ? []
      : await db
          .select({
            userId: revisions.userId,
            wordId: revisions.wordId,
            createdAt: revisions.createdAt,
          })
          .from(revisions)
          .where(inArray(revisions.userId, studentIds));

  const sessionRows =
    studentIds.length === 0
      ? []
      : await db
          .select({
            userId: revisionSessions.userId,
            startedAt: revisionSessions.startedAt,
          })
          .from(revisionSessions)
          .where(inArray(revisionSessions.userId, studentIds));

  const revisionsByStudent = new Map<string, { wordId: string; createdAt: Date }[]>();
  for (const row of revisionRows) {
    const list = revisionsByStudent.get(row.userId) ?? [];
    list.push({ wordId: row.wordId, createdAt: row.createdAt });
    revisionsByStudent.set(row.userId, list);
  }
  const sessionStartsByStudent = new Map<string, Date[]>();
  for (const row of sessionRows) {
    const list = sessionStartsByStudent.get(row.userId) ?? [];
    list.push(row.startedAt);
    sessionStartsByStudent.set(row.userId, list);
  }

  const now = Date.now();
  const rows: TeacherPilotRow[] = pilotTeachers.map((teacher) => {
    const students = studentsByTeacher.get(teacher.id) ?? new Map<string, Date>();
    const classWords = classWordIdsByTeacher.get(teacher.id) ?? new Set<string>();
    let firstClassList = 0;
    let firstRevision = 0;
    let eligibleAtDay7 = 0;
    let activeAtDay7 = 0;

    for (const [studentId, signedUpAt] of students) {
      const studentRevisions = revisionsByStudent.get(studentId) ?? [];
      const sessionStarts = sessionStartsByStudent.get(studentId) ?? [];
      if (studentRevisions.some((revision) => classWords.has(revision.wordId))) {
        firstClassList += 1;
      }
      if (studentRevisions.length > 0 || sessionStarts.length > 0) {
        firstRevision += 1;
      }
      const day7 = signedUpAt.getTime() + 7 * DAY_MS;
      if (day7 > now) continue;
      eligibleAtDay7 += 1;
      const cameBack =
        studentRevisions.some((revision) => revision.createdAt.getTime() >= day7) ||
        sessionStarts.some((startedAt) => startedAt.getTime() >= day7);
      if (cameBack) activeAtDay7 += 1;
    }

    const name =
      [teacher.firstName, teacher.lastName].filter(Boolean).join(" ").trim() ||
      teacher.name?.trim() ||
      teacher.email;

    return {
      teacherId: teacher.id,
      name,
      email: teacher.email,
      schoolName: teacher.schoolName,
      signedUpAt: teacher.signedUpAt.toISOString(),
      classCount: classesByTeacher.get(teacher.id)?.length ?? 0,
      enrolledStudents: students.size,
      firstClassList,
      firstRevision,
      eligibleAtDay7,
      activeAtDay7,
    };
  });

  rows.sort((a, b) => (a.signedUpAt < b.signedUpAt ? 1 : -1));
  return rows;
}
