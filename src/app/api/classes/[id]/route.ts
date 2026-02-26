import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  classes,
  classMembers,
  classLists,
  users,
  lists,
  wordFamilies,
  revisionSessions,
} from "@/lib/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";

async function requireProfesseurForClass(classId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Non autorisé" }, { status: 401 }) };
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "professeur") {
    return { error: NextResponse.json({ error: "Réservé aux professeurs" }, { status: 403 }) };
  }

  const [cls] = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.teacherId, session.user.id)))
    .limit(1);

  if (!cls) {
    return { error: NextResponse.json({ error: "Classe introuvable" }, { status: 404 }) };
  }

  return { session, cls };
}

/**
 * GET /api/classes/[id]
 * Détail d'une classe (professeur uniquement) : membres, listes, stats.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const checked = await requireProfesseurForClass(id);
  if ("error" in checked) return checked.error;
  const { cls } = checked;

  const members = await db
    .select({
      id: classMembers.id,
      userId: classMembers.userId,
      status: classMembers.status,
      joinedAt: classMembers.joinedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(classMembers)
    .leftJoin(users, eq(users.id, classMembers.userId))
    .where(eq(classMembers.classId, id));

  const acceptedUserIds = members.filter((m) => m.status === "accepted").map((m) => m.userId!);
  const statsByUser: Record<string, { sessions: number; wordsRetained: number; wordsWritten: number }> = {};
  if (acceptedUserIds.length > 0) {
    const statsRows = await db
      .select({
        userId: revisionSessions.userId,
        sessions: sql<number>`count(*)`.as("sessions"),
        wordsRetained: sql<number>`coalesce(sum(${revisionSessions.wordsRetained}), 0)`.as("words_retained"),
        wordsWritten: sql<number>`coalesce(sum(${revisionSessions.wordsWritten}), 0)`.as("words_written"),
      })
      .from(revisionSessions)
      .where(inArray(revisionSessions.userId, acceptedUserIds))
      .groupBy(revisionSessions.userId);
    for (const row of statsRows) {
      statsByUser[row.userId] = {
        sessions: Number(row.sessions),
        wordsRetained: Number(row.wordsRetained),
        wordsWritten: Number(row.wordsWritten),
      };
    }
  }

  const classListsData = await db
    .select({
      id: classLists.id,
      listId: classLists.listId,
      isVisible: classLists.isVisible,
      orderIndex: classLists.orderIndex,
      listName: lists.name,
      familyName: wordFamilies.name,
    })
    .from(classLists)
    .leftJoin(lists, eq(lists.id, classLists.listId))
    .leftJoin(wordFamilies, eq(wordFamilies.id, lists.familyId))
    .where(eq(classLists.classId, id))
    .orderBy(classLists.orderIndex);

  return NextResponse.json({
    ...cls,
    members: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      status: m.status,
      joinedAt: m.joinedAt,
      name: m.userName || m.userEmail?.split("@")[0] || "Élève",
      email: m.userEmail,
      stats: m.userId ? statsByUser[m.userId] ?? { sessions: 0, wordsRetained: 0, wordsWritten: 0 } : null,
    })),
    lists: classListsData.map((l) => ({
      id: l.id,
      listId: l.listId,
      isVisible: l.isVisible,
      orderIndex: l.orderIndex,
      name: l.listName,
      familyName: l.familyName,
    })),
  });
}

/**
 * PATCH /api/classes/[id]
 * Met à jour le titre ou la langue d'une classe (professeur uniquement).
 * Body: { title?: string; language?: string | null }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const checked = await requireProfesseurForClass(id);
  if ("error" in checked) return checked.error;

  let body: { title?: string; language?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const updates: { title?: string; language?: string | null } = {};
  if (body.title !== undefined) {
    const title = body.title.trim();
    if (!title || title.length < 2) {
      return NextResponse.json(
        { error: "Le titre doit faire au moins 2 caractères" },
        { status: 400 }
      );
    }
    updates.title = title;
  }
  if (body.language !== undefined) {
    const lang = body.language?.trim() || null;
    updates.language = lang;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true });
  }

  await db.update(classes).set(updates).where(eq(classes.id, id));

  const [updated] = await db
    .select()
    .from(classes)
    .where(eq(classes.id, id))
    .limit(1);

  return NextResponse.json(updated);
}

/**
 * DELETE /api/classes/[id]
 * Supprime une classe (et cascades) pour le professeur.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const checked = await requireProfesseurForClass(id);
  if ("error" in checked) return checked.error;

  await db.delete(classes).where(eq(classes.id, id));

  return NextResponse.json({ ok: true });
}

