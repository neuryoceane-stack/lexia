import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { classes, classMembers } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

/**
 * GET /api/mes-classes
 * Classes auxquelles l'utilisateur appartient comme élève (status = accepted).
 * Utilisé côté élève pour afficher les classes dans la Bibliothèque.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = session.user.id;

  const rows = await db
    .select({
      id: classes.id,
      title: classes.title,
      language: classes.language,
    })
    .from(classMembers)
    .innerJoin(classes, eq(classes.id, classMembers.classId))
    .where(
      and(
        eq(classMembers.userId, userId),
        eq(classMembers.status, "accepted")
      )
    )
    .orderBy(asc(classes.createdAt));

  return NextResponse.json({ classes: rows });
}

