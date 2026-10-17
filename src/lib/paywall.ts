import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getUser, type User } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  ABONNEMENT_PATH,
  SUBSCRIPTION_REQUIRED_CODE,
} from "@/lib/abonnement-path";
import { hasActiveSubscription } from "@/lib/subscription";

export { ABONNEMENT_PATH, SUBSCRIPTION_REQUIRED_CODE };

const SUBSCRIPTION_REQUIRED_ERROR =
  "Un abonnement est nécessaire pour cette action.";

/** Le paywall n'agit que si la variable vaut exactement "true". */
export function isPaywallEnabled(): boolean {
  return process.env.PAYWALL_ENABLED === "true";
}

export function isPaywallExemptRole(role: User["role"]): boolean {
  return role === "creator" || role === "professeur";
}

/**
 * Élève sans abonnement actif ni essai, et seulement si le paywall est armé.
 * Creator et professeur ne sont jamais bloqués.
 */
export async function isStudentPaywalled(
  user: Pick<User, "id" | "role">
): Promise<boolean> {
  if (!isPaywallEnabled()) return false;
  if (isPaywallExemptRole(user.role)) return false;

  const [row] = await db
    .select({ subscriptionStatus: users.subscriptionStatus })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!row) {
    throw new Error(`Compte introuvable pour le paywall : ${user.id}`);
  }

  return !hasActiveSubscription(row);
}

export function subscriptionRequiredResponse(): NextResponse {
  return NextResponse.json(
    {
      error: SUBSCRIPTION_REQUIRED_ERROR,
      code: SUBSCRIPTION_REQUIRED_CODE,
    },
    { status: 402 }
  );
}

/** Réponse 402 si cet utilisateur est bloqué, sinon null. */
export async function paywallDenial(
  user: Pick<User, "id" | "role">
): Promise<NextResponse | null> {
  if (await isStudentPaywalled(user)) return subscriptionRequiredResponse();
  return null;
}

/** Redirige vers la page d'abonnement. Ne retourne pas lorsque le paywall s'applique. */
export async function redirectIfStudentPaywalled(): Promise<void> {
  const user = await getUser();
  if (!user) return;
  if (await isStudentPaywalled(user)) {
    redirect(ABONNEMENT_PATH);
  }
}
