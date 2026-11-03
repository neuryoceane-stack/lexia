import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { isMissingFeedbackMetaTable } from "@/lib/feedback-meta";
import { db } from "@/lib/db";
import {
  feedbackMeta,
  feedbacks,
  notifications,
  users,
  userProfiles,
} from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export type FeedbackWithUser = {
  id: string;
  userId: string;
  type: "bug" | "idee" | "question";
  description: string;
  page: string | null;
  device: "mobile" | "tablette" | "ordinateur" | null;
  browser: string | null;
  hasMeta: boolean;
  status: "pending" | "in_progress" | "done";
  satisfaction: "up" | "down" | null;
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

function mapFeedbackRows(
  rows: {
    id: string;
    userId: string;
    type: "bug" | "idee" | "question";
    description: string;
    page: string | null;
    status: "pending" | "in_progress" | "done" | null;
    satisfaction: "up" | "down" | null;
    createdAt: Date | number;
    firstName: string | null;
    email: string;
    metaId: string | null;
    metaDevice: "mobile" | "tablette" | "ordinateur" | null;
    metaBrowser: string | null;
  }[],
): FeedbackWithUser[] {
  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    type: r.type,
    description: r.description,
    page: r.page,
    device: r.metaDevice,
    browser: r.metaBrowser,
    hasMeta: Boolean(r.metaId),
    status: (r.status ?? "pending") as "pending" | "in_progress" | "done",
    satisfaction:
      r.satisfaction === "up" || r.satisfaction === "down" ? r.satisfaction : null,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    firstName: r.firstName,
    email: r.email,
  }));
}

async function fetchFeedbacksWithMeta(): Promise<FeedbackWithUser[]> {
  const rows = await db
    .select({
      id: feedbacks.id,
      userId: feedbacks.userId,
      type: feedbacks.type,
      description: feedbacks.description,
      page: feedbacks.page,
      status: feedbacks.status,
      satisfaction: feedbacks.satisfaction,
      createdAt: feedbacks.createdAt,
      firstName: userProfiles.firstName,
      email: users.email,
      metaId: feedbackMeta.id,
      metaDevice: feedbackMeta.device,
      metaBrowser: feedbackMeta.browser,
    })
    .from(feedbacks)
    .innerJoin(users, eq(feedbacks.userId, users.id))
    .leftJoin(userProfiles, eq(feedbacks.userId, userProfiles.userId))
    .leftJoin(feedbackMeta, eq(feedbacks.id, feedbackMeta.feedbackId))
    .orderBy(desc(feedbacks.createdAt));

  return mapFeedbackRows(rows);
}

async function fetchFeedbacksWithoutMeta(): Promise<FeedbackWithUser[]> {
  const rows = await db
    .select({
      id: feedbacks.id,
      userId: feedbacks.userId,
      type: feedbacks.type,
      description: feedbacks.description,
      page: feedbacks.page,
      status: feedbacks.status,
      satisfaction: feedbacks.satisfaction,
      createdAt: feedbacks.createdAt,
      firstName: userProfiles.firstName,
      email: users.email,
    })
    .from(feedbacks)
    .innerJoin(users, eq(feedbacks.userId, users.id))
    .leftJoin(userProfiles, eq(feedbacks.userId, userProfiles.userId))
    .orderBy(desc(feedbacks.createdAt));

  return mapFeedbackRows(
    rows.map((r) => ({
      ...r,
      metaId: null,
      metaDevice: null,
      metaBrowser: null,
    })),
  );
}

/**
 * GET /api/creator/feedbacks
 * Retourne tous les feedbacks avec firstName et email, triés par createdAt DESC.
 */
export async function GET() {
  const { error } = await checkCreator();
  if (error) return error;

  try {
    const result = await fetchFeedbacksWithMeta();
    return NextResponse.json(result);
  } catch (err) {
    if (!isMissingFeedbackMetaTable(err)) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[GET /api/creator/feedbacks]", msg);
      return NextResponse.json(
        { error: "Erreur lors du chargement" },
        { status: 500 },
      );
    }
  }

  const result = await fetchFeedbacksWithoutMeta();
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
      .select({ userId: feedbacks.userId, description: feedbacks.description })
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
      const descSnippet = (existing.description ?? "").slice(0, 80);
      const descSuffix = (existing.description ?? "").length > 80 ? "..." : "";
      const message = `✅ Ton retour a été traité ! Es-tu satisfait ?\n"${descSnippet}${descSuffix}"`;
      await db.insert(notifications).values({
        id: nanoid(),
        userId: existing.userId,
        type: "feedback_resolved",
        message,
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
