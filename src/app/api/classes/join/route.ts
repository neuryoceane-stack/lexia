import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { classes, classMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * POST /api/classes/join
 * Un élève rejoint une classe par son identifiant. Body: { identifier: string }
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: { identifier?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const identifier = body.identifier?.trim().toUpperCase();
  if (!identifier) {
    return NextResponse.json(
      { error: "Identifiant de classe requis" },
      { status: 400 }
    );
  }

  const [cls] = await db
    .select()
    .from(classes)
    .where(eq(classes.identifier, identifier))
    .limit(1);

  if (!cls) {
    return NextResponse.json(
      { error: "Classe introuvable. Vérifie l'identifiant." },
      { status: 404 }
    );
  }

  const [existing] = await db
    .select()
    .from(classMembers)
    .where(
      and(
        eq(classMembers.classId, cls.id),
        eq(classMembers.userId, session.user.id)
      )
    )
    .limit(1);

  if (existing) {
    return NextResponse.json({
      classId: cls.id,
      status: existing.status,
      message: existing.status === "accepted" ? "Déjà dans la classe" : "En attente de validation",
    });
  }

  const memberId = nanoid();
  await db.insert(classMembers).values({
    id: memberId,
    classId: cls.id,
    userId: session.user.id,
    status: "pending",
    joinedAt: new Date(),
  });

  return NextResponse.json({
    classId: cls.id,
    status: "pending",
    message: "Demande envoyée. En attente de validation par le professeur.",
  });
}
