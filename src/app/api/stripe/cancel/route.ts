import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import {
  normalizeCancellationComment,
  parseCancellationReason,
} from "@/lib/cancellation";
import { billingHttpError, scheduleSubscriptionCancellation } from "@/lib/stripe-billing";

/** Programme la résiliation en fin de période et conserve le motif, s'il est donné. */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (user.role === "professeur") {
    return NextResponse.json(
      { error: "L'abonnement élève ne s'applique pas à un compte professeur." },
      { status: 403 },
    );
  }

  let body: unknown = {};
  const raw = await req.text();
  if (raw.trim()) {
    try {
      body = JSON.parse(raw) as unknown;
    } catch {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }
  }

  const record = body && typeof body === "object" ? (body as { reason?: unknown; comment?: unknown }) : null;
  if (!record) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const reason = parseCancellationReason(record.reason);
  const comment = normalizeCancellationComment(record.comment);
  if (reason === "invalid" || comment === "invalid") {
    return NextResponse.json({ error: "Motif ou message invalide." }, { status: 400 });
  }

  try {
    const subscription = await scheduleSubscriptionCancellation({
      userId: user.id,
      reason,
      comment,
    });
    return NextResponse.json(subscription);
  } catch (error) {
    const httpError = billingHttpError(error);
    if (httpError) {
      return NextResponse.json({ error: httpError.message }, { status: httpError.status });
    }
    console.error("[POST /api/stripe/cancel]", error);
    return NextResponse.json(
      { error: "Impossible de résilier l'abonnement." },
      { status: 500 },
    );
  }
}
