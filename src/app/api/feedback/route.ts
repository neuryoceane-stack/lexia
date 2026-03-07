import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { feedbacks } from "@/lib/db/schema";
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
    await db.insert(feedbacks).values({
      id: nanoid(),
      userId: user.id,
      type,
      description,
      page,
      status: "pending",
      createdAt: new Date(),
    });
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
