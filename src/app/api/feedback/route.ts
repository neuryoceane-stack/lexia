import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { feedbacks, notifications, userProfiles, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * POST /api/feedback
 * Body: { type: "bug"|"idee"|"question", description: string, page?: string }
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: { type?: string; description?: string; page?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON invalide" },
      { status: 400 }
    );
  }

  const description = (body.description ?? "").trim();
  if (!description) {
    return NextResponse.json(
      { error: "La description est requise" },
      { status: 400 }
    );
  }

  const typeValues = ["bug", "idee", "question"] as const;
  const type = typeValues.includes(body.type as (typeof typeValues)[number])
    ? (body.type as (typeof typeValues)[number])
    : "question";

  const page = (body.page ?? "").trim().slice(0, 500) || null;

  try {
    const feedbackId = nanoid();
    await db.insert(feedbacks).values({
      id: feedbackId,
      userId: user.id,
      type,
      description,
      page,
      status: "pending",
      createdAt: new Date(),
    });

    const [profile] = await db
      .select({ firstName: userProfiles.firstName })
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1);
    const [creator] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, "oci@lexiva.app"))
      .limit(1);
    if (creator) {
      const displayName = profile?.firstName?.trim() || "Un utilisateur";
      const descSnippet = description.slice(0, 60);
      const descSuffix = description.length > 60 ? "..." : "";
      await db.insert(notifications).values({
        id: nanoid(),
        userId: creator.id,
        type: "new_feedback",
        message: `💬 Nouveau feedback de ${displayName} : ${descSnippet}${descSuffix}`,
        read: false,
        link: "/app/creator",
        createdAt: new Date(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/feedback]", msg);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement" },
      { status: 500 }
    );
  }
}
