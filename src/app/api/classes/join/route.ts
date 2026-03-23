import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { classes, classMembers, notifications, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * POST /api/classes/join
 * Un élève rejoint une classe par son identifiant. Body: { identifier: string }
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: { identifier?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const raw = body.identifier?.trim().toUpperCase() ?? "";
  const identifier = raw.startsWith("LX-") ? raw.slice(3) : raw;
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
        eq(classMembers.userId, user.id)
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
    studentRow?.name?.trim() ||
    user.email?.split("@")[0] ||
    "Un élève";

  await db.insert(notifications).values({
    id: nanoid(),
    userId: cls.teacherId,
    type: "class_join_request",
    message: `${studentName} demande à rejoindre ta classe "${cls.title}".`,
    read: false,
    link: `/app/professeur/classes/${cls.id}?tab=eleves`,
    createdAt: new Date(),
  });

  return NextResponse.json({
    classId: cls.id,
    status: "pending",
    message: "Demande envoyée. En attente de validation par le professeur.",
  });
}
