import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { classes, classLists } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * PATCH /api/classes/[id]/lists/[listId]
 * Bascule la visibilité d'une liste (fantôme ↔ visible). Body: { isVisible: boolean }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; listId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "professeur") {
    return NextResponse.json({ error: "Réservé aux professeurs" }, { status: 403 });
  }

  const { id: classId, listId } = await params;

  const [cls] = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.teacherId, session.user.id)))
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

  await db
    .update(classLists)
    .set({ isVisible })
    .where(
      and(
        eq(classLists.classId, classId),
        eq(classLists.listId, listId)
      )
    );

  return NextResponse.json({ ok: true, isVisible });
}
