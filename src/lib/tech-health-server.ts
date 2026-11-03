import "server-only";

import { db } from "@/lib/db";
import { emailEvents, errorEvents, users } from "@/lib/db/schema";
import { isMissingTechHealthTable } from "@/lib/server-error-log";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfYesterdayUtc(): Date {
  const now = new Date();
  const startToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  return new Date(startToday.getTime() - DAY_MS);
}

export async function checkDatabaseOperational(): Promise<boolean> {
  try {
    await db.select({ id: users.id }).from(users).limit(1);
    return true;
  } catch {
    return false;
  }
}

export type TechHealthPayload = {
  tablesReady: boolean;
  database: { operational: boolean; label: string };
  payments: { label: string };
  emailsService: { label: string };
  ai: { label: string };
  kpis: {
    errors24h: number;
    newSinceYesterday: number;
    emailsSent7d: number;
    emailFailures7d: number;
  };
  errors: {
    items: {
      id: string;
      lastSeenAt: string;
      route: string;
      method: string | null;
      message: string;
      occurrences: number;
      reviewStatus: "new" | "to_check" | "fixed";
    }[];
    total: number;
  };
  emailFailures: {
    items: {
      id: string;
      createdAt: string;
      toEmail: string;
      type: string;
      error: string | null;
    }[];
    total: number;
  };
};

function emptyPayload(dbOperational: boolean): TechHealthPayload {
  return {
    tablesReady: false,
    database: {
      operational: dbOperational,
      label: dbOperational ? "Opérationnelle" : "Indisponible",
    },
    payments: { label: "—" },
    emailsService: { label: "—" },
    ai: { label: "—" },
    kpis: {
      errors24h: 0,
      newSinceYesterday: 0,
      emailsSent7d: 0,
      emailFailures7d: 0,
    },
    errors: { items: [], total: 0 },
    emailFailures: { items: [], total: 0 },
  };
}

export async function loadTechHealth(options: {
  errorsLimit: number;
  errorsOffset: number;
  emailLimit: number;
  emailOffset: number;
}): Promise<TechHealthPayload> {
  const dbOperational = await checkDatabaseOperational();
  const since24h = new Date(Date.now() - DAY_MS);
  const since7d = new Date(Date.now() - 7 * DAY_MS);
  const sinceYesterday = startOfYesterdayUtc();

  try {
    const [webhookErrorsRow] = await db
      .select({ total: count() })
      .from(errorEvents)
      .where(
        and(eq(errorEvents.source, "webhook"), gte(errorEvents.lastSeenAt, since24h)),
      );

    const [aiErrorsRow] = await db
      .select({ total: count() })
      .from(errorEvents)
      .where(and(eq(errorEvents.source, "ai"), gte(errorEvents.lastSeenAt, since24h)));

    const [emailFailures7dRow] = await db
      .select({ total: count() })
      .from(emailEvents)
      .where(
        and(eq(emailEvents.status, "failed"), gte(emailEvents.createdAt, since7d)),
      );

    const [emailsSent7dRow] = await db
      .select({ total: count() })
      .from(emailEvents)
      .where(and(eq(emailEvents.status, "sent"), gte(emailEvents.createdAt, since7d)));

    const [errors24hRow] = await db
      .select({
        total: sql<number>`coalesce(sum(${errorEvents.occurrences}), 0)`.as("total"),
      })
      .from(errorEvents)
      .where(gte(errorEvents.lastSeenAt, since24h));

    const [newSinceYesterdayRow] = await db
      .select({ total: count() })
      .from(errorEvents)
      .where(gte(errorEvents.firstSeenAt, sinceYesterday));

    const webhookCount = Number(webhookErrorsRow?.total ?? 0);
    const aiCount = Number(aiErrorsRow?.total ?? 0);
    const emailFailCount = Number(emailFailures7dRow?.total ?? 0);

    const errorRows = await db
      .select({
        id: errorEvents.id,
        lastSeenAt: errorEvents.lastSeenAt,
        route: errorEvents.route,
        method: errorEvents.method,
        message: errorEvents.message,
        occurrences: errorEvents.occurrences,
        reviewStatus: errorEvents.reviewStatus,
      })
      .from(errorEvents)
      .orderBy(desc(errorEvents.occurrences), desc(errorEvents.lastSeenAt))
      .limit(options.errorsLimit)
      .offset(options.errorsOffset);

    const [errorsTotalRow] = await db.select({ total: count() }).from(errorEvents);

    const failedEmails = await db
      .select({
        id: emailEvents.id,
        createdAt: emailEvents.createdAt,
        toEmail: emailEvents.toEmail,
        type: emailEvents.type,
        error: emailEvents.error,
      })
      .from(emailEvents)
      .where(eq(emailEvents.status, "failed"))
      .orderBy(desc(emailEvents.createdAt))
      .limit(options.emailLimit)
      .offset(options.emailOffset);

    const [emailFailuresTotalRow] = await db
      .select({ total: count() })
      .from(emailEvents)
      .where(eq(emailEvents.status, "failed"));

    const paymentsLabel =
      webhookCount === 0
        ? "Aucune erreur récente"
        : `${webhookCount} erreur${webhookCount > 1 ? "s" : ""} (24 h)`;

    const aiLabel =
      aiCount === 0
        ? "Aucune erreur récente"
        : `${aiCount} erreur${aiCount > 1 ? "s" : ""} (24 h)`;

    const emailsLabel =
      emailFailCount === 0
        ? "Aucun échec"
        : `${emailFailCount} échec${emailFailCount > 1 ? "s" : ""} (7 jours)`;

    return {
      tablesReady: true,
      database: {
        operational: dbOperational,
        label: dbOperational ? "Opérationnelle" : "Indisponible",
      },
      payments: { label: paymentsLabel },
      emailsService: { label: emailsLabel },
      ai: { label: aiLabel },
      kpis: {
        errors24h: Number(errors24hRow?.total ?? 0),
        newSinceYesterday: Number(newSinceYesterdayRow?.total ?? 0),
        emailsSent7d: Number(emailsSent7dRow?.total ?? 0),
        emailFailures7d: emailFailCount,
      },
      errors: {
        items: errorRows.map((row) => ({
          id: row.id,
          lastSeenAt: new Date(row.lastSeenAt).toISOString(),
          route: row.route,
          method: row.method,
          message: row.message,
          occurrences: row.occurrences,
          reviewStatus: row.reviewStatus,
        })),
        total: Number(errorsTotalRow?.total ?? 0),
      },
      emailFailures: {
        items: failedEmails.map((row) => ({
          id: row.id,
          createdAt: new Date(row.createdAt).toISOString(),
          toEmail: row.toEmail,
          type: row.type,
          error: row.error,
        })),
        total: Number(emailFailuresTotalRow?.total ?? 0),
      },
    };
  } catch (error) {
    if (isMissingTechHealthTable(error)) {
      return emptyPayload(dbOperational);
    }
    throw error;
  }
}
