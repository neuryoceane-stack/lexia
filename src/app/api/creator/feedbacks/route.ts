import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { feedbacks, notifications, users, userProfiles } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export type FeedbackWithUser = {
  id: string;
  userId: string;
  type: "bug" | "idee" | "question";
  description: string;
  page: string | null;
  status: "pending" | "in_progress" | "done";
  createdAt: string;
  firstName: string | null;
  email: string;
};

async function checkCreator() {
  const user = await getUser();
  if (!user || user.role !== "creator") {
    return { error: NextResponse.json({ error: "Non autorisé" }, { status: 403 }), user: null };
  }
  return { error: null, user };
}

/**
 * GET /api/creator/feedbacks
 * Retourne tous les feedbacks avec firstName et email, triés par createdAt DESC.
 */
export async function GET() {
  const { error } = await checkCreator();
  if (error) return error;

  const rows = await db
    .select({
      id: feedbacks.id,
      userId: feedbacks.userId,
      type: feedbacks.type,
      description: feedbacks.description,
      page: feedbacks.page,
      status: feedbacks.status,
      createdAt: feedbacks.createdAt,
      firstName: userProfiles.firstName,
      email: users.email,
    })
    .from(feedbacks)
    .innerJoin(users, eq(feedbacks.userId, users.id))
    .leftJoin(userProfiles, eq(feedbacks.userId, userProfiles.userId))
    .orderBy(desc(feedbacks.createdAt));

  const result: FeedbackWithUser[] = rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    type: r.type,
    description: r.description,
    page: r.page,
    status: (r.status ?? "pending") as "pending" | "in_progress" | "done",
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    firstName: r.firstName,
    email: r.email,
  }));

  return NextResponse.json(result);
}

/**
 * PATCH /api/creator/feedbacks
 * Body: { id: string, status: "pending" | "in_progress" | "done" }
 */
export async function PATCH(request: Request) {
  const { error } = await checkCreator();
  if (error) return error;

  let body: { id?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON invalide" },
      { status: 400 }
    );
  }

  const id = body.id?.trim();
  const statusValues = ["pending", "in_progress", "done"] as const;
  const status = statusValues.includes(body.status as (typeof statusValues)[number])
    ? (body.status as (typeof statusValues)[number])
    : null;

  if (!id || !status) {
    return NextResponse.json(
      { error: "id et status (pending|in_progress|done) requis" },
      { status: 400 }
    );
  }

  try {
    const [existing] = await db
      .select({ userId: feedbacks.userId })
      .from(feedbacks)
      .where(eq(feedbacks.id, id))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Feedback introuvable" }, { status: 404 });
    }

    await db
      .update(feedbacks)
      .set({ status })
      .where(eq(feedbacks.id, id));

    if (status === "done") {
      const [targetUser] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, existing.userId))
        .limit(1);
      const link =
        targetUser?.role === "creator" ? "/app/creator" : "/app";
      await db.insert(notifications).values({
        id: nanoid(),
        userId: existing.userId,
        type: "feedback_resolved",
        message: "✅ Ton retour a été traité ! Es-tu satisfait ?",
        read: false,
        link,
        feedbackId: id,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[PATCH /api/creator/feedbacks]", msg);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
