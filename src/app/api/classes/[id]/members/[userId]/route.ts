import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { classes, classMembers, notifications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * PATCH /api/classes/[id]/members/[userId]
 * Accepte ou rejette un élève (professeur uniquement).
 * Body: { status: "accepted" | "rejected" }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const role = user.role;
  if (role !== "professeur") {
    return NextResponse.json({ error: "Réservé aux professeurs" }, { status: 403 });
  }

  const { id: classId, userId } = await params;

  const [cls] = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.teacherId, user.id)))
    .limit(1);

  if (!cls) {
    return NextResponse.json({ error: "Classe introuvable" }, { status: 404 });
  }

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const status = body.status === "accepted" ? "accepted" : body.status === "rejected" ? "rejected" : null;
  if (!status) {
    return NextResponse.json({ error: "status requis: accepted ou rejected" }, { status: 400 });
  }

  const [member] = await db
    .select({ status: classMembers.status })
    .from(classMembers)
    .where(
      and(eq(classMembers.classId, classId), eq(classMembers.userId, userId))
    )
    .limit(1);

  if (!member) {
    return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
  }

  await db
    .update(classMembers)
    .set({ status })
    .where(
      and(
        eq(classMembers.classId, classId),
        eq(classMembers.userId, userId)
      )
    );

  if (status === "accepted" && member.status !== "accepted") {
    const className = cls.title;
    await db.insert(notifications).values({
      id: nanoid(),
      userId,
      type: "class_accepted",
      message: `Tu as été accepté dans la classe "${className}" ! Retrouve tes listes dans ta bibliothèque.`,
      read: false,
      link: "/app/familles",
      createdAt: new Date(),
    });
  }

  return NextResponse.json({ ok: true, status });
}
