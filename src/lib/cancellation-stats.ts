import "server-only";

import { desc, eq, inArray } from "drizzle-orm";
import {
  CHURN_CSV_HEADERS,
  departureToCsvRow,
  isCancellationPlan,
  isCancellationReason,
  isCancellationStorageUnavailable,
  studentLabel,
  summarizeCancellations,
  tenureDaysBetween,
  toCsv,
  type CancellationReason,
  type CancellationStamp,
  type ChurnDeparture,
  type ChurnResponse,
} from "@/lib/cancellation";
import { db } from "@/lib/db";
import { cancellationFeedback, userProfiles, users } from "@/lib/db/schema";

const OPEN_STATUSES = ["active", "trialing", "past_due"] as const;
const RECENT_LIMIT = 20;

export async function loadChurnDashboard(now = new Date()): Promise<ChurnResponse> {
  try {
    const [stamps, subscribedIds, recent] = await Promise.all([
      loadStamps(),
      loadSubscribedUserIds(),
      listDepartures(RECENT_LIMIT),
    ]);
    return {
      available: true,
      ...summarizeCancellations(stamps, subscribedIds, now),
      recent,
    };
  } catch (error) {
    if (isCancellationStorageUnavailable(error)) {
      console.error("[churn] table cancellation_feedback absente", error);
      return { available: false };
    }
    throw error;
  }
}

export async function loadChurnCsv(): Promise<string> {
  const departures = await listDepartures();
  const rows = departures.map((row) => departureToCsvRow(row));
  return toCsv([[...CHURN_CSV_HEADERS], ...rows]);
}

async function loadStamps(): Promise<CancellationStamp[]> {
  const rows = await db
    .select({
      userId: cancellationFeedback.userId,
      startedAt: cancellationFeedback.subscriptionStartedAt,
      cancelledAt: cancellationFeedback.cancelledAt,
      reason: cancellationFeedback.reason,
    })
    .from(cancellationFeedback);

  return rows.map((row) => ({
    userId: row.userId,
    startedAt: row.startedAt,
    cancelledAt: row.cancelledAt,
    reason: assertReason(row.reason),
  }));
}

async function loadSubscribedUserIds(): Promise<Set<string>> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(inArray(users.subscriptionStatus, [...OPEN_STATUSES]));
  return new Set(rows.map((row) => row.id));
}

export async function listDepartures(limit?: number): Promise<ChurnDeparture[]> {
  const query = db
    .select({
      cancelledAt: cancellationFeedback.cancelledAt,
      startedAt: cancellationFeedback.subscriptionStartedAt,
      plan: cancellationFeedback.plan,
      reason: cancellationFeedback.reason,
      comment: cancellationFeedback.comment,
      email: users.email,
      firstName: userProfiles.firstName,
    })
    .from(cancellationFeedback)
    .innerJoin(users, eq(users.id, cancellationFeedback.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, cancellationFeedback.userId))
    .orderBy(desc(cancellationFeedback.cancelledAt));

  const rows = limit == null ? await query : await query.limit(limit);

  return rows.map((row) => {
    if (!isCancellationPlan(row.plan)) {
      throw new Error(`Formule de résiliation inconnue : ${row.plan}`);
    }
    return {
      cancelledAt: row.cancelledAt.toISOString(),
      student: studentLabel(row.firstName, row.email),
      plan: row.plan,
      tenureDays: tenureDaysBetween(row.startedAt, row.cancelledAt),
      reason: assertReason(row.reason),
      comment: row.comment,
    };
  });
}

function assertReason(value: string | null): CancellationReason | null {
  if (value == null) return null;
  if (isCancellationReason(value)) return value;
  throw new Error(`Motif de résiliation inconnu : ${value}`);
}
