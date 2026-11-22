import "server-only";

import { cache } from "react";
import { NextResponse } from "next/server";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import type { User } from "@/lib/auth";
import { db } from "@/lib/db";
import { classMembers, lists, users, wordFamilies, words } from "@/lib/db/schema";
import { FREEMIUM_PERSONAL_WORD_LIMIT } from "@/lib/offer";
import { isFreemiumEnabled } from "@/lib/freemium";
import { type SubscriptionStatus } from "@/lib/subscription";
import { isPaywallExemptRole } from "@/lib/paywall";
import { buildStudentEntitlement } from "@/lib/student-entitlement.logic";

export {
  buildStudentEntitlement,
  computeFreemiumCounts,
  freemiumBulkImportMessage,
} from "@/lib/student-entitlement.logic";

import type {
  ClientStudentEntitlement,
  StudentEntitlement,
  UnlimitedReason,
} from "@/lib/student-entitlement-types";

export type { ClientStudentEntitlement, StudentEntitlement, UnlimitedReason };
export const FREEMIUM_QUOTA_CODE = "freemium_quota";

/**
 * Pilote 5 profs, à retirer quand l'abonnement prof existera.
 * Élève accepté dans au moins une classe → illimité (listes perso + classe).
 */
export async function isUnlimitedViaAcceptedClassMembership(
  userId: string
): Promise<boolean> {
  const [row] = await db
    .select({ id: classMembers.id })
    .from(classMembers)
    .where(
      and(eq(classMembers.userId, userId), eq(classMembers.status, "accepted"))
    )
    .limit(1);
  return Boolean(row);
}

function resolveUnlimitedReason(
  status: SubscriptionStatus,
  role: User["role"]
): UnlimitedReason {
  if (isPaywallExemptRole(role)) return "role";
  if (status === "active") return "subscription";
  if (status === "trialing") return "trial";
  return null;
}

async function loadPersonalWordTotal(userId: string): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`count(*)`.mapWith(Number),
    })
    .from(words)
    .innerJoin(lists, eq(words.listId, lists.id))
    .innerJoin(wordFamilies, eq(lists.familyId, wordFamilies.id))
    .where(
      and(eq(wordFamilies.userId, userId), ne(lists.source, "shop"))
    );
  return row?.total ?? 0;
}

const loadActiveWordIdsByUser = cache(
  async (userId: string): Promise<string[]> => {
    const rows = await db
      .select({ id: words.id })
      .from(words)
      .innerJoin(lists, eq(words.listId, lists.id))
      .innerJoin(wordFamilies, eq(lists.familyId, wordFamilies.id))
      .where(
        and(eq(wordFamilies.userId, userId), ne(lists.source, "shop"))
      )
      .orderBy(asc(words.createdAt), asc(words.id))
      .limit(FREEMIUM_PERSONAL_WORD_LIMIT);
    return rows.map((r) => r.id);
  }
);

export async function getActivePersonalWordIds(userId: string): Promise<string[]> {
  return loadActiveWordIdsByUser(userId);
}

export async function isPersonalWordActive(
  userId: string,
  wordId: string
): Promise<boolean> {
  const active = await loadActiveWordIdsByUser(userId);
  return active.includes(wordId);
}

const readEntitlementByKey = cache(
  async (
    userId: string,
    role: User["role"],
    subscriptionStatus: SubscriptionStatus
  ): Promise<StudentEntitlement> => {
    const freemiumActive = isFreemiumEnabled();
    const limit = FREEMIUM_PERSONAL_WORD_LIMIT;

    const personalWordTotal = freemiumActive
      ? await loadPersonalWordTotal(userId)
      : 0;

    if (!freemiumActive) {
      return buildStudentEntitlement(
        false,
        true,
        resolveUnlimitedReason(subscriptionStatus, role),
        0
      );
    }

    if (isPaywallExemptRole(role)) {
      return buildStudentEntitlement(true, true, "role", personalWordTotal);
    }
    if (subscriptionStatus === "active") {
      return buildStudentEntitlement(
        true,
        true,
        "subscription",
        personalWordTotal
      );
    }
    if (subscriptionStatus === "trialing") {
      return buildStudentEntitlement(true, true, "trial", personalWordTotal);
    }
    if (await isUnlimitedViaAcceptedClassMembership(userId)) {
      return buildStudentEntitlement(
        true,
        true,
        "class_pilot",
        personalWordTotal
      );
    }

    return buildStudentEntitlement(true, false, null, personalWordTotal);
  }
);

export async function getStudentEntitlement(
  user: Pick<User, "id" | "role">,
  subscriptionStatus?: SubscriptionStatus
): Promise<StudentEntitlement> {
  let status = subscriptionStatus;
  if (status == null) {
    const [row] = await db
      .select({ subscriptionStatus: users.subscriptionStatus })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    if (!row) {
      throw new Error(`Compte introuvable pour l'entitlement : ${user.id}`);
    }
    status = row.subscriptionStatus as SubscriptionStatus;
  }
  return readEntitlementByKey(user.id, user.role, status);
}

export async function getClientStudentEntitlement(
  user: Pick<User, "id" | "role">
): Promise<ClientStudentEntitlement> {
  const entitlement = await getStudentEntitlement(user);
  const activeWordIds =
    entitlement.freemiumActive && !entitlement.unlimited
      ? await loadActiveWordIdsByUser(user.id)
      : [];
  return { ...entitlement, activeWordIds };
}

export function freemiumQuotaResponse(
  remainingSlots: number,
  message: string
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      code: FREEMIUM_QUOTA_CODE,
      remainingSlots,
    },
    { status: 402 }
  );
}

export async function assertCanAddPersonalWords(
  user: Pick<User, "id" | "role">,
  requestedCount: number
): Promise<
  | { ok: true; allowedCount: number; entitlement: StudentEntitlement }
  | { ok: false; response: NextResponse; entitlement: StudentEntitlement }
> {
  const entitlement = await getStudentEntitlement(user);
  if (!entitlement.freemiumActive || entitlement.unlimited) {
    return { ok: true, allowedCount: requestedCount, entitlement };
  }
  if (requestedCount <= 0) {
    return { ok: true, allowedCount: 0, entitlement };
  }
  const allowedCount = Math.min(requestedCount, entitlement.remainingSlots);
  if (allowedCount <= 0) {
    return {
      ok: false,
      entitlement,
      response: freemiumQuotaResponse(
        0,
        `Tu as atteint la limite de ${entitlement.limit} mots gratuits. Passe à l'abonnement pour en ajouter d'autres.`
      ),
    };
  }
  return { ok: true, allowedCount, entitlement };
}

export type RevisionWordRow = {
  id: string;
  ownerUserId: string;
  source: string;
};

export async function filterReadableWordsForFreemiumRevision<
  T extends RevisionWordRow,
>(user: Pick<User, "id" | "role">, wordRows: T[]): Promise<T[]> {
  const entitlement = await getStudentEntitlement(user);
  if (!entitlement.freemiumActive || entitlement.unlimited) {
    return wordRows;
  }
  const activeIds = new Set(await loadActiveWordIdsByUser(user.id));
  return wordRows.filter((w) => {
    if (w.ownerUserId !== user.id) return true;
    if (w.source === "shop") return true;
    return activeIds.has(w.id);
  });
}

export async function canSubmitRevisionForWord(
  user: Pick<User, "id" | "role">,
  wordId: string
): Promise<boolean> {
  const entitlement = await getStudentEntitlement(user);
  if (!entitlement.freemiumActive || entitlement.unlimited) {
    return true;
  }
  const [row] = await db
    .select({
      ownerUserId: wordFamilies.userId,
      source: lists.source,
    })
    .from(words)
    .innerJoin(lists, eq(words.listId, lists.id))
    .innerJoin(wordFamilies, eq(lists.familyId, wordFamilies.id))
    .where(eq(words.id, wordId))
    .limit(1);
  if (!row) return false;
  if (row.ownerUserId !== user.id) return true;
  if (row.source === "shop") return true;
  return isPersonalWordActive(user.id, wordId);
}