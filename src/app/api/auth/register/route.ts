import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { ensureClassTables } from "@/lib/db/migrations";
import { gardenProgress, notifications, userProfiles, users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { validateEmail, validatePassword } from "@/lib/validation";
import type { SubscriptionStatus } from "@/lib/subscription";

const MILESTONES = [50, 100, 500, 1000] as const;
const BCRYPT_ROUNDS = 12;
const PLAN_VALUES = ["free", "monthly", "annual"] as const;
type PlanValue = (typeof PLAN_VALUES)[number];

/**
 * OUTIL DE TEST DEV UNIQUEMENT — simule un abonnement actif sans Stripe.
 * Désactiver en production : laisser TEST_ACCESS_CODE vide ou retirer ce bypass.
 */
function isTestAccessGranted(promoCode: string): boolean {
  const secret = process.env.TEST_ACCESS_CODE?.trim();
  if (!secret || !promoCode) return false;
  return promoCode === secret;
}

function parsePlan(value: unknown): PlanValue {
  if (typeof value === "string" && (PLAN_VALUES as readonly string[]).includes(value)) {
    return value as PlanValue;
  }
  return "free";
}

function parseWeeklyGoal(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  return undefined;
}

function registerErrorResponse(error: unknown): NextResponse {
  console.error("[POST /api/auth/register]", error);

  const message =
    error instanceof Error ? error.message : String(error ?? "Erreur inconnue");
  const lower = message.toLowerCase();

  if (lower.includes("unique") || lower.includes("already exists")) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet email" },
      { status: 409 }
    );
  }

  return NextResponse.json(
    {
      error:
        "Impossible de créer le compte pour le moment. Réessaie dans quelques instants.",
    },
    { status: 500 }
  );
}

export async function POST(request: Request) {
  let body: {
    email?: string;
    password?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    role?: "etudiant" | "professeur" | "teacher" | "student";
    subject?: string;
    school_name?: string;
    institution_code?: string;
    acquisition_source?: string;
    weekly_goal?: number;
    plan?: string;
    promo_code?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }

  const email = body.email?.trim()?.toLowerCase();
  const password = body.password;
  const firstName = body.firstName?.trim();
  const lastName = body.lastName?.trim();
  const birthDate =
    typeof body.birthDate === "string" ? body.birthDate.trim() || null : null;
  const name =
    [firstName, lastName].filter(Boolean).join(" ") ||
    body.name?.trim() ||
    null;
  const isProfessor =
    body.role === "professeur" || body.role === "teacher";
  const profileRole = isProfessor ? "professeur" : "etudiant";
  const appRole =
    email === "oci@lexiva.app"
      ? "creator"
      : isProfessor
        ? "teacher"
        : "student";
  const subject =
    typeof body.subject === "string" ? body.subject.trim() || null : null;
  const schoolName =
    typeof body.school_name === "string"
      ? body.school_name.trim() || null
      : null;
  const institutionCode =
    typeof body.institution_code === "string"
      ? body.institution_code.trim() || null
      : null;
  const acquisitionSource =
    typeof body.acquisition_source === "string"
      ? body.acquisition_source.trim() || null
      : null;
  const weeklyGoal = !isProfessor ? parseWeeklyGoal(body.weekly_goal) : undefined;
  const promoCode =
    typeof body.promo_code === "string" ? body.promo_code.trim() : "";
  const chosenPlan = !isProfessor ? parsePlan(body.plan) : parsePlan("free");

  let plan: PlanValue = chosenPlan;
  let subscriptionStatus: SubscriptionStatus = "inactive";

  if (!isProfessor && isTestAccessGranted(promoCode)) {
    plan = chosenPlan === "free" ? "annual" : chosenPlan;
    subscriptionStatus = "active";
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email et mot de passe requis" },
      { status: 400 }
    );
  }

  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) {
    return NextResponse.json({ error: emailCheck.error }, { status: 400 });
  }

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
  }

  try {
    await ensureClassTables();

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email" },
        { status: 409 }
      );
    }

    const id = nanoid();
    const passwordHash = await hash(password, BCRYPT_ROUNDS);

    await db.insert(users).values({
      id,
      email,
      passwordHash,
      name: name ?? null,
      role: appRole,
      subject: isProfessor ? subject : null,
      schoolName: isProfessor ? schoolName : null,
      ...(weeklyGoal !== undefined ? { weeklyGoal } : {}),
      plan,
      subscriptionStatus,
    });

    await db.insert(gardenProgress).values({ userId: id });

    await db
      .insert(userProfiles)
      .values({
        userId: id,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        dateOfBirth: birthDate,
        role: profileRole,
        acquisitionSource: !isProfessor ? acquisitionSource : null,
        institutionCode: isProfessor ? institutionCode : null,
        onboardingCompleted: false,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: {
          firstName: firstName ?? null,
          lastName: lastName ?? null,
          dateOfBirth: birthDate,
          role: profileRole,
          acquisitionSource: !isProfessor ? acquisitionSource : null,
          institutionCode: isProfessor ? institutionCode : null,
          onboardingCompleted: false,
          updatedAt: new Date(),
        },
      });

    const [{ count: totalUsers }] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(users);
    if ((MILESTONES as readonly number[]).includes(totalUsers)) {
      const [creator] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, "oci@lexiva.app"))
        .limit(1);
      if (creator) {
        await db.insert(notifications).values({
          id: nanoid(),
          userId: creator.id,
          type: "milestone",
          message: `🎉 Lexiva a atteint ${totalUsers} inscrits !`,
          read: false,
          link: "/app/creator",
          createdAt: new Date(),
        });
      }
    }

    return NextResponse.json({
      ok: true,
      userId: id,
      firstName,
      lastName,
      role: profileRole,
    });
  } catch (error) {
    return registerErrorResponse(error);
  }
}
