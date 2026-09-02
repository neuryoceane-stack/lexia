import "server-only";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import type { UserReferralInfo } from "@/lib/referral-share";

/** Caractères sans ambiguïté (exclut 0/O, 1/I/L). */
const REFERRAL_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

const CODE_LENGTH = 8;
const MAX_GENERATION_ATTEMPTS = 32;

export function generateReferralCodeCandidate(length = CODE_LENGTH): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += REFERRAL_CHARS[Math.floor(Math.random() * REFERRAL_CHARS.length)]!;
  }
  return code;
}

/** Résout le parrain à partir du code saisi à l'inscription (insensible à la casse). */
export async function findReferrerUserIdByCode(code: string): Promise<string | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const [referrer] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.referralCode, normalized))
    .limit(1);

  return referrer?.id ?? null;
}

/** Incrémente atomiquement le compteur de parrainages du parrain. */
export async function incrementReferrerCount(referrerUserId: string): Promise<void> {
  await db
    .update(users)
    .set({ referralCount: sql`${users.referralCount} + 1` })
    .where(eq(users.id, referrerUserId));
}

export async function isReferralCodeTaken(code: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.referralCode, code))
    .limit(1);
  return Boolean(existing);
}

/** Génère un code unique en base (avec retry en cas de collision). */
export async function generateUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const code = generateReferralCodeCandidate();
    if (!(await isReferralCodeTaken(code))) {
      return code;
    }
  }
  throw new Error("Impossible de générer un code de parrainage unique.");
}

/**
 * Retourne le code de parrainage persisté, ou le génère une fois (lazy) pour les comptes existants.
 */
export async function ensureUserReferralCode(userId: string): Promise<UserReferralInfo> {
  const [row] = await db
    .select({
      referralCode: users.referralCode,
      referralCount: users.referralCount,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) {
    throw new Error("Utilisateur introuvable.");
  }

  const referralCount = row.referralCount ?? 0;
  if (row.referralCode) {
    return { referralCode: row.referralCode, referralCount };
  }

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const code = generateReferralCodeCandidate();
    const taken = await isReferralCodeTaken(code);
    if (taken) continue;

    try {
      await db.update(users).set({ referralCode: code }).where(eq(users.id, userId));
    } catch {
      const [afterRace] = await db
        .select({ referralCode: users.referralCode, referralCount: users.referralCount })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (afterRace?.referralCode) {
        return {
          referralCode: afterRace.referralCode,
          referralCount: afterRace.referralCount ?? 0,
        };
      }
      continue;
    }

    const [updated] = await db
      .select({ referralCode: users.referralCode, referralCount: users.referralCount })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (updated?.referralCode) {
      return { referralCode: updated.referralCode, referralCount: updated.referralCount ?? 0 };
    }
  }

  throw new Error("Impossible d'assigner un code de parrainage.");
}
