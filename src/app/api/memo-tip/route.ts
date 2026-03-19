import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { memoTips } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(request: Request) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const wordId = searchParams.get("wordId")?.trim();
  if (!wordId) {
    return NextResponse.json({ error: "wordId requis" }, { status: 400 });
  }

  const [existing] = await db
    .select({ tip: memoTips.tip })
    .from(memoTips)
    .where(and(eq(memoTips.userId, user.id), eq(memoTips.wordId, wordId)))
    .limit(1);

  return NextResponse.json({ tip: existing?.tip ?? null });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: { wordId?: string; tip?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 },
    );
  }

  const wordId = body.wordId?.trim();
  const tip = body.tip?.trim() ?? "";

  if (!wordId) {
    return NextResponse.json({ error: "wordId requis" }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: memoTips.id })
    .from(memoTips)
    .where(and(eq(memoTips.userId, user.id), eq(memoTips.wordId, wordId)))
    .limit(1);

  if (!tip) {
    if (existing) {
      await db
        .delete(memoTips)
        .where(and(eq(memoTips.userId, user.id), eq(memoTips.wordId, wordId)));
    }
    return NextResponse.json({ success: true, tip: null });
  }

  if (existing) {
    await db
      .update(memoTips)
      .set({ tip, updatedAt: new Date() })
      .where(and(eq(memoTips.userId, user.id), eq(memoTips.wordId, wordId)));
  } else {
    await db.insert(memoTips).values({
      id: crypto.randomUUID(),
      wordId,
      userId: user.id,
      tip,
    });
  }

  return NextResponse.json({ success: true, tip });
}
