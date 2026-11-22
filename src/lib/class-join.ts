import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { User } from "@/lib/auth";
import { db } from "@/lib/db";
import { classes, classMembers, notifications, users } from "@/lib/db/schema";
import { classCodeCore, normalizeClassCode } from "@/lib/class-code";

export type JoinSuccess = {
  ok: true;
  classId: string;
  classTitle: string;
  status: "pending" | "accepted" | "rejected";
  already: boolean;
  message: string;
};

export type JoinFailure = {
  ok: false;
  httpStatus: 400 | 403 | 404;
  error: string;
};

export type JoinOutcome = JoinSuccess | JoinFailure;

export type ClassInvite = {
  id: string;
  title: string;
  teacherId: string;
  language: string | null;
  schoolLevel: string | null;
  displayCode: string;
};

export async function findClassInvite(rawCode: string): Promise<ClassInvite | null> {
  const display = normalizeClassCode(rawCode);
  if (!display) return null;
  const [cls] = await db
    .select({
      id: classes.id,
      title: classes.title,
      teacherId: classes.teacherId,
      language: classes.language,
      schoolLevel: classes.schoolLevel,
    })
    .from(classes)
    .where(eq(classes.identifier, classCodeCore(display)))
    .limit(1);
  if (!cls) return null;
  return { ...cls, displayCode: display };
}

/**
 * Demande d'entrée dans une classe. Les messages d'élève tutoient.
 * Un professeur ne devient pas élève de sa classe.
 */
export async function joinClassByCode(user: User, rawCode: string): Promise<JoinOutcome> {
  const display = normalizeClassCode(rawCode);
  if (!display) {
    return {
      ok: false,
      httpStatus: 400,
      error: "Le code est incomplet. Il ressemble à LX-XXXXXX.",
    };
  }

  const [cls] = await db
    .select({
      id: classes.id,
      title: classes.title,
      teacherId: classes.teacherId,
    })
    .from(classes)
    .where(eq(classes.identifier, classCodeCore(display)))
    .limit(1);

  if (!cls) {
    return {
      ok: false,
      httpStatus: 404,
      error: "Ce code ne correspond à aucune classe.",
    };
  }

  if (user.id === cls.teacherId || user.role === "professeur") {
    return {
      ok: false,
      httpStatus: 403,
      error:
        user.id === cls.teacherId
          ? "Vous êtes le professeur de cette classe."
          : "Ce lien est réservé aux élèves.",
    };
  }

  if (user.role === "creator") {
    return {
      ok: false,
      httpStatus: 403,
      error: "Ce lien est réservé aux élèves.",
    };
  }

  const [existing] = await db
    .select({ status: classMembers.status })
    .from(classMembers)
    .where(and(eq(classMembers.classId, cls.id), eq(classMembers.userId, user.id)))
    .limit(1);

  if (existing) {
    if (existing.status === "accepted") {
      return {
        ok: true,
        classId: cls.id,
        classTitle: cls.title,
        status: "accepted",
        already: true,
        message: `Tu es déjà dans la classe « ${cls.title} ».`,
      };
    }
    if (existing.status === "rejected") {
      return {
        ok: true,
        classId: cls.id,
        classTitle: cls.title,
        status: "rejected",
        already: true,
        message: `Ton professeur n'a pas accepté ta demande pour « ${cls.title} ».`,
      };
    }
    return {
      ok: true,
      classId: cls.id,
      classTitle: cls.title,
      status: "pending",
      already: true,
      message: `Ta demande pour « ${cls.title} » est en attente.`,
    };
  }

  await db.insert(classMembers).values({
    id: nanoid(),
    classId: cls.id,
    userId: user.id,
    status: "pending",
    joinedAt: new Date(),
  });

  const [studentRow] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  const studentName =
    studentRow?.name?.trim() || user.email?.split("@")[0] || "Un élève";

  await db.insert(notifications).values({
    id: nanoid(),
    userId: cls.teacherId,
    type: "class_join_request",
    message: `${studentName} demande à rejoindre votre classe « ${cls.title} ».`,
    read: false,
    link: `/app/professeur/classes/${cls.id}?tab=eleves`,
    createdAt: new Date(),
  });

  return {
    ok: true,
    classId: cls.id,
    classTitle: cls.title,
    status: "pending",
    already: false,
    message: `Demande envoyée. Tu entreras dans « ${cls.title} » dès que ton professeur l'aura acceptée.`,
  };
}
