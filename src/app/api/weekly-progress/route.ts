import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { revisionSessions, users } from "@/lib/db/schema";
import { eq, gte, and, sql } from "drizzle-orm";

function getMondayMidnight(): Date {
  const now = new Date();
  const day = now.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export async function GET() {
  const user = await getUser();
  if (!user?.id)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const monday = getMondayMidnight();

  const [userData] = await db
    .select({ weeklyGoal: users.weeklyGoal })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const weeklyGoal = userData?.weeklyGoal ?? 20;

  const rows = await db
    .select({
      language: revisionSessions.language,
      total: sql<number>`coalesce(sum(${revisionSessions.wordsSeen}), 0)`.as(
        "total"
      ),
    })
    .from(revisionSessions)
    .where(
      and(
        eq(revisionSessions.userId, user.id),
        gte(revisionSessions.startedAt, monday)
      )
    )
    .groupBy(revisionSessions.language);

  const totalCount = rows.reduce((sum, r) => sum + Number(r.total), 0);

  return NextResponse.json({
    weeklyGoal,
    totalCount,
    byLanguage: rows.map((r) => ({
      language: r.language,
      count: Number(r.total),
    })),
  });
}

export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user?.id)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: { weeklyGoal?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const raw = body.weeklyGoal;
  if (typeof raw !== "number" || !Number.isInteger(raw)) {
    return NextResponse.json({ error: "Valeur invalide" }, { status: 400 });
  }
  if (raw < 5 || raw > 70 || raw % 5 !== 0) {
    return NextResponse.json({ error: "Valeur invalide" }, { status: 400 });
  }
  const weeklyGoal = raw;

  await db
    .update(users)
    .set({ weeklyGoal })
    .where(eq(users.id, user.id));
  return NextResponse.json({ success: true });
}
