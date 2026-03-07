import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { feedbacks, notifications } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * PATCH /api/feedback/satisfaction
 * Body: { feedbackId: string, satisfaction: "up"|"down", notificationId: string }
 * Met à jour feedbacks.satisfaction et marque la notification comme lue.
 */
export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: { feedbackId?: string; satisfaction?: string; notificationId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON invalide" },
      { status: 400 }
    );
  }

  const feedbackId = body.feedbackId?.trim();
  const notificationId = body.notificationId?.trim();
  const satisfaction = body.satisfaction === "up" || body.satisfaction === "down"
    ? body.satisfaction
    : null;

  if (!feedbackId || !satisfaction || !notificationId) {
    return NextResponse.json(
      { error: "feedbackId, satisfaction (up|down) et notificationId requis" },
      { status: 400 }
    );
  }

  try {
    const [fb] = await db
      .select({ userId: feedbacks.userId })
      .from(feedbacks)
      .where(eq(feedbacks.id, feedbackId))
      .limit(1);
    if (!fb || fb.userId !== user.id) {
      return NextResponse.json({ error: "Feedback introuvable" }, { status: 404 });
    }

    await db
      .update(feedbacks)
      .set({ satisfaction })
      .where(eq(feedbacks.id, feedbackId));

    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, user.id)
        )
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[PATCH /api/feedback/satisfaction]", msg);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
