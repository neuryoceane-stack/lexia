import "server-only";

import { db } from "@/lib/db";
import { errorEvents, type ErrorEventSource } from "@/lib/db/schema";
import {
  buildErrorFingerprint,
  extractErrorMessage,
  isMissingTechHealthTable,
  nextReviewStatusOnRecurrence,
  normalizeMessageForFingerprint,
  routeWithoutQuery,
  sanitizeErrorMessage,
} from "@/lib/error-event-utils";
import { eq, lt } from "drizzle-orm";

export type { ErrorEventSource };
export {
  buildErrorFingerprint,
  extractErrorMessage,
  isMissingTechHealthTable,
  nextReviewStatusOnRecurrence,
  normalizeMessageForFingerprint,
  routeWithoutQuery,
  sanitizeErrorMessage,
};

const RETENTION_DAYS = 90;

function maybeScheduleRetentionCleanup(): void {
  if (Math.random() > 0.02) return;
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  void db
    .delete(errorEvents)
    .where(lt(errorEvents.lastSeenAt, cutoff))
    .catch(() => {});
}

export type LogServerErrorInput = {
  source: ErrorEventSource;
  route: string;
  method?: string | null;
  error: unknown;
  userId?: string | null;
  statusCode?: number | null;
};

export async function recordServerError(input: LogServerErrorInput): Promise<void> {
  try {
    const rawMessage = extractErrorMessage(input.error);
    const message = sanitizeErrorMessage(rawMessage);
    if (!message) return;

    const normalized = normalizeMessageForFingerprint(message);
    const safeRoute = routeWithoutQuery(input.route);
    const fingerprint = buildErrorFingerprint(safeRoute, input.method, normalized);
    const now = new Date();
    const id = crypto.randomUUID();

    const existing = await db
      .select({
        id: errorEvents.id,
        occurrences: errorEvents.occurrences,
        reviewStatus: errorEvents.reviewStatus,
      })
      .from(errorEvents)
      .where(eq(errorEvents.fingerprint, fingerprint))
      .limit(1);

    if (existing[0]) {
      const row = existing[0];
      const nextStatus = nextReviewStatusOnRecurrence(row.reviewStatus);
      await db
        .update(errorEvents)
        .set({
          occurrences: row.occurrences + 1,
          lastSeenAt: now,
          reviewStatus: nextStatus,
          ...(input.userId ? { lastUserId: input.userId } : {}),
          ...(input.statusCode != null ? { statusCode: input.statusCode } : {}),
        })
        .where(eq(errorEvents.id, row.id));
    } else {
      await db.insert(errorEvents).values({
        id,
        fingerprint,
        source: input.source,
        route: safeRoute,
        method: input.method ?? null,
        message,
        statusCode: input.statusCode ?? null,
        occurrences: 1,
        firstSeenAt: now,
        lastSeenAt: now,
        reviewStatus: "new",
        lastUserId: input.userId ?? null,
        createdAt: now,
      });
    }

    maybeScheduleRetentionCleanup();
  } catch (error) {
    if (isMissingTechHealthTable(error)) return;
  }
}

/** Enregistrement non bloquant depuis les routes API. */
export function logServerError(input: LogServerErrorInput): void {
  void recordServerError(input).catch(() => {});
}

export function inferErrorSourceFromPath(path: string): ErrorEventSource {
  const route = routeWithoutQuery(path);
  if (route.includes("/api/stripe/webhook")) return "webhook";
  if (route.includes("/api/extract/")) return "ai";
  if (route.startsWith("/api/")) return "api";
  return "page";
}

type InstrumentationRequest = {
  path: string;
  method: string;
};

type InstrumentationContext = {
  routeType: "render" | "route" | "action" | "proxy";
  routePath: string;
};

export async function recordServerErrorFromInstrumentation(
  error: unknown,
  request: InstrumentationRequest,
  context: InstrumentationContext,
): Promise<void> {
  const route = routeWithoutQuery(request.path);
  let source: ErrorEventSource = "other";
  if (context.routeType === "render") {
    source = "page";
  } else if (route.includes("/api/stripe/webhook")) {
    source = "webhook";
  } else if (route.includes("/api/extract/")) {
    source = "ai";
  } else if (context.routeType === "route") {
    source = "api";
  }

  await recordServerError({
    source,
    route,
    method: request.method,
    error,
  });
}
