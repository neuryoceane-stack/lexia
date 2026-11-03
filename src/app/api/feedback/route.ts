import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { sanitizeFeedbackPagePath } from "@/lib/feedback-context";
import { validateFeedbackForm } from "@/lib/feedback-form";
import {
  isMissingFeedbackMetaTable,
  parseFeedbackMetaPayload,
} from "@/lib/feedback-meta";
import { db } from "@/lib/db";
import { feedbackMeta, feedbacks, notifications, userProfiles, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * POST /api/feedback
 * Body: { type, description, page?, device?, browser? }
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: {
    type?: unknown;
    description?: unknown;
    page?: unknown;
    device?: unknown;
    browser?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON invalide" },
      { status: 400 }
    );
  }

  const validated = validateFeedbackForm({
    type: body.type,
    description: body.description,
  });
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const { type, description } = validated;
  const pageFromBody = typeof body.page === "string" ? body.page : "";
  const page =
    sanitizeFeedbackPagePath(pageFromBody).slice(0, 500) || null;

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

    const metaPayload = parseFeedbackMetaPayload({ ...body, type, page: page ?? "" });
    if (metaPayload) {
      try {
        await db.insert(feedbackMeta).values({
          id: nanoid(),
          feedbackId,
          type: metaPayload.type,
          page: metaPayload.page,
          device: metaPayload.device,
          browser: metaPayload.browser,
          createdAt: new Date(),
        });
      } catch (metaError) {
        if (!isMissingFeedbackMetaTable(metaError)) {
          console.error("[POST /api/feedback] feedback_meta", metaError);
        }
      }
    }

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
        message: `Nouveau feedback de ${displayName} : ${descSnippet}${descSuffix}`,
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
