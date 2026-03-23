import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  classes,
  classLists,
  classMembers,
  lists,
  notifications,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * DELETE /api/classes/[id]/lists/[listId]
 * Retire la liste de la classe (désassignation).
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; listId: string }> }
) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const role = user.role;
  if (role !== "professeur") {
    return NextResponse.json({ error: "Réservé aux professeurs" }, { status: 403 });
  }

  const { id: classId, listId } = await params;

  const [cls] = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.teacherId, user.id)))
    .limit(1);

  if (!cls) {
    return NextResponse.json({ error: "Classe introuvable" }, { status: 404 });
  }

  const [link] = await db
    .select({ id: classLists.id })
    .from(classLists)
    .where(
      and(eq(classLists.classId, classId), eq(classLists.listId, listId))
    )
    .limit(1);

  if (!link) {
    return NextResponse.json({ error: "Liste non assignée à cette classe" }, { status: 404 });
  }

  await db
    .delete(classLists)
    .where(
      and(eq(classLists.classId, classId), eq(classLists.listId, listId))
    );

  return NextResponse.json({ ok: true });
}

/**
 * PATCH /api/classes/[id]/lists/[listId]
 * Bascule la visibilité d'une liste (fantôme ↔ visible). Body: { isVisible: boolean }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; listId: string }> }
) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const role = user.role;
  if (role !== "professeur") {
    return NextResponse.json({ error: "Réservé aux professeurs" }, { status: 403 });
  }

  const { id: classId, listId } = await params;

  const [cls] = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.teacherId, user.id)))
    .limit(1);

  if (!cls) {
    return NextResponse.json({ error: "Classe introuvable" }, { status: 404 });
  }

  let body: { isVisible?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const isVisible = body.isVisible === true;

  const [linkRow] = await db
    .select({ isVisible: classLists.isVisible })
    .from(classLists)
    .where(
      and(eq(classLists.classId, classId), eq(classLists.listId, listId))
    )
    .limit(1);

  if (!linkRow) {
    return NextResponse.json(
      { error: "Liste non assignée à cette classe" },
      { status: 404 }
    );
  }

  const wasVisible = linkRow.isVisible === true;

  await db
    .update(classLists)
    .set({ isVisible })
    .where(
      and(
        eq(classLists.classId, classId),
        eq(classLists.listId, listId)
      )
    );

  if (isVisible && !wasVisible) {
    const [listRow] = await db
      .select({ name: lists.name })
      .from(lists)
      .where(eq(lists.id, listId))
      .limit(1);
    const listName = listRow?.name?.trim() || "Liste";

    const acceptedMembers = await db
      .select({ userId: classMembers.userId })
      .from(classMembers)
      .where(
        and(
          eq(classMembers.classId, classId),
          eq(classMembers.status, "accepted")
        )
      );

    const message = `Nouvelle liste disponible dans ta classe : "${listName}". Va réviser dès maintenant !`;

    for (const membre of acceptedMembers) {
      await db.insert(notifications).values({
        id: nanoid(),
        userId: membre.userId,
        type: "new_list_available",
        message,
        read: false,
        link: "/app/familles",
        createdAt: new Date(),
      });
    }
  }

  return NextResponse.json({ ok: true, isVisible });
}
