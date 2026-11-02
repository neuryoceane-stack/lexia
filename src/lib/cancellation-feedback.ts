import "server-only";

import { and, eq } from "drizzle-orm";
import {
  isCancellationUniqueConflict,
  type CancellationPlan,
  type CancellationReason,
} from "@/lib/cancellation";
import { db } from "@/lib/db";
import { cancellationFeedback } from "@/lib/db/schema";

export type RememberCancellationInput = {
  userId: string;
  reason: CancellationReason | null;
  comment: string | null;
  plan: CancellationPlan;
  subscriptionStartedAt: Date;
  cancelledAt: Date;
};

/**
 * Enregistre un départ, ou complète le motif s'il manquait.
 * N'écrit jamais par-dessus un motif déjà choisi.
 * Toute erreur est avalée : la résiliation Stripe ne doit pas en dépendre.
 */
export async function rememberCancellation(input: RememberCancellationInput): Promise<void> {
  try {
    await writeCancellation(input);
  } catch (error) {
    console.error("[cancellation_feedback] enregistrement non bloquant", error);
  }
}

async function writeCancellation(input: RememberCancellationInput): Promise<void> {
  const existing = await findBySubscriptionStart(input.userId, input.subscriptionStartedAt);
  if (existing) {
    await fillEmptyFields(existing, input);
    return;
  }

  try {
    await db.insert(cancellationFeedback).values({
      id: crypto.randomUUID(),
      userId: input.userId,
      reason: input.reason,
      comment: input.comment,
      plan: input.plan,
      subscriptionStartedAt: input.subscriptionStartedAt,
      cancelledAt: input.cancelledAt,
    });
  } catch (error) {
    if (!isCancellationUniqueConflict(error)) throw error;
    const winner = await findBySubscriptionStart(input.userId, input.subscriptionStartedAt);
    if (winner) await fillEmptyFields(winner, input);
  }
}

async function findBySubscriptionStart(userId: string, startedAt: Date) {
  const [row] = await db
    .select({
      id: cancellationFeedback.id,
      reason: cancellationFeedback.reason,
      comment: cancellationFeedback.comment,
    })
    .from(cancellationFeedback)
    .where(
      and(
        eq(cancellationFeedback.userId, userId),
        eq(cancellationFeedback.subscriptionStartedAt, startedAt),
      ),
    )
    .limit(1);
  return row ?? null;
}

async function fillEmptyFields(
  existing: { id: string; reason: CancellationReason | null; comment: string | null },
  input: RememberCancellationInput,
): Promise<void> {
  const patch: { reason?: CancellationReason; comment?: string } = {};
  if (existing.reason == null && input.reason) patch.reason = input.reason;
  if (existing.comment == null && input.comment) patch.comment = input.comment;
  if (!patch.reason && !patch.comment) return;
  await db.update(cancellationFeedback).set(patch).where(eq(cancellationFeedback.id, existing.id));
}
