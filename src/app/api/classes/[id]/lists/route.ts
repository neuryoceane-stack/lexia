import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { classes, classLists, lists, wordFamilies } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * POST /api/classes/[id]/lists
 * Ajoute une liste à la classe (professeur). Body: { listId: string }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "professeur") {
    return NextResponse.json({ error: "Réservé aux professeurs" }, { status: 403 });
  }

  const { id: classId } = await params;

  const [cls] = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.teacherId, session.user.id)))
    .limit(1);

  if (!cls) {
    return NextResponse.json({ error: "Classe introuvable" }, { status: 404 });
  }

  let body: { listId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const listId = body.listId?.trim();
  if (!listId) {
    return NextResponse.json({ error: "listId requis" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(classLists)
    .where(and(eq(classLists.classId, classId), eq(classLists.listId, listId)))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: "Liste déjà dans la classe" }, { status: 409 });
  }

  const [list] = await db
    .select({ id: lists.id, familyId: lists.familyId })
    .from(lists)
    .where(eq(lists.id, listId))
    .limit(1);

  if (!list) {
    return NextResponse.json({ error: "Liste introuvable" }, { status: 404 });
  }

  const [family] = await db
    .select({ userId: wordFamilies.userId })
    .from(wordFamilies)
    .where(eq(wordFamilies.id, list.familyId))
    .limit(1);

  if (!family || family.userId !== session.user.id) {
    return NextResponse.json({ error: "Liste non accessible" }, { status: 403 });
  }

  const existingLists = await db
    .select({ orderIndex: classLists.orderIndex })
    .from(classLists)
    .where(eq(classLists.classId, classId));

  const maxOrder =
    existingLists.length > 0
      ? Math.max(...existingLists.map((l) => l.orderIndex))
      : -1;
  const orderIndex = maxOrder + 1;

  await db.insert(classLists).values({
    id: nanoid(),
    classId,
    listId,
    isVisible: false,
    orderIndex,
    addedAt: new Date(),
  });

  return NextResponse.json({ ok: true });
}
