import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { classes, classMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * PATCH /api/classes/[id]/members/[userId]
 * Accepte ou rejette un élève (professeur uniquement).
 * Body: { status: "accepted" | "rejected" }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "professeur") {
    return NextResponse.json({ error: "Réservé aux professeurs" }, { status: 403 });
  }

  const { id: classId, userId } = await params;

  const [cls] = await db
    .select()
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.teacherId, session.user.id)))
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

  await db
    .update(classMembers)
    .set({ status })
    .where(
      and(
        eq(classMembers.classId, classId),
        eq(classMembers.userId, userId)
      )
    );

  return NextResponse.json({ ok: true, status });
}
