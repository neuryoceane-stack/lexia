import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications, users } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export type NotificationItem = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  link: string | null;
  feedbackId: string | null;
  createdAt: string;
};

/**
 * GET /api/notifications
 * Retourne les notifications non lues de l'utilisateur connecté.
 */
export async function GET() {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  console.log("[GET /api/notifications] userId:", user.id);

  const rows = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)))
    .orderBy(desc(notifications.createdAt));

  console.log("[GET /api/notifications] notifs trouvées:", rows.length);

  const result: NotificationItem[] = rows.map((r) => ({
    id: r.id,
    type: r.type,
    message: r.message,
    read: r.read ?? false,
    link: r.link ?? null,
    feedbackId: r.feedbackId ?? null,
    createdAt:
      r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  }));

  return NextResponse.json(result);
}

/**
 * PATCH /api/notifications
 * Body: { id?: string, markAllRead?: boolean }
 * - id: marque cette notification comme lue
 * - markAllRead: true = marque toutes les notifs de l'user comme lues
 */
export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: { id?: string; markAllRead?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON invalide" },
      { status: 400 }
    );
  }

  try {
    if (body.markAllRead) {
      await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, user.id));
    } else {
      const id = body.id?.trim();
      if (!id) {
        return NextResponse.json({ error: "id requis" }, { status: 400 });
      }
      await db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[PATCH /api/notifications]", msg);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications (creator only)
 * Body: { userId: string, type: string, message: string, link?: string }
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user?.id || user.role !== "creator") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  let body: { userId?: string; type?: string; message?: string; link?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON invalide" },
      { status: 400 }
    );
  }

  const userId = body.userId?.trim();
  const type = (body.type ?? "info").toString().trim().slice(0, 50);
  const message = (body.message ?? "").trim();
  const link = body.link?.trim().slice(0, 500) || null;

  if (!userId || !message) {
    return NextResponse.json(
      { error: "userId et message requis" },
      { status: 400 }
    );
  }

  try {
    await db.insert(notifications).values({
      id: nanoid(),
      userId,
      type,
      message,
      read: false,
      link,
      createdAt: new Date(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/notifications]", msg);
    return NextResponse.json(
      { error: "Erreur lors de la création" },
      { status: 500 }
    );
  }
}
