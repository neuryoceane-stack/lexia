import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shopPacks, userPurchases } from "@/lib/db/schema";
import { eq, desc, count, sum } from "drizzle-orm";
import { getUser } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user || user.role !== "creator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const packs = await db.select().from(shopPacks).orderBy(desc(shopPacks.createdAt));

  const stats = await db
    .select({
      packId: userPurchases.packId,
      sales: count(userPurchases.id),
      revenue: sum(userPurchases.amountPaid),
    })
    .from(userPurchases)
    .groupBy(userPurchases.packId);

  const statsMap = new Map(stats.map((s) => [s.packId, s]));

  const packsWithStats = packs.map((pack) => ({
    ...pack,
    sales: statsMap.get(pack.id)?.sales ?? 0,
    revenue: statsMap.get(pack.id)?.revenue ?? 0,
  }));

  return NextResponse.json(packsWithStats);
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user || user.role !== "creator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, emoji, language, level, price, wordsJson } = body;

  if (!title || !description || !wordsJson) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  await db.insert(shopPacks).values({
    id,
    title,
    description,
    emoji: emoji ?? "📦",
    language: language ?? "fra",
    level: level ?? "",
    price: price ?? 400,
    wordsJson,
    isActive: false,
  });

  const [pack] = await db.select().from(shopPacks).where(eq(shopPacks.id, id)).limit(1);
  return NextResponse.json(pack, { status: 201 });
}

export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user || user.role !== "creator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  await db.update(shopPacks).set(fields).where(eq(shopPacks.id, id));
  const [pack] = await db.select().from(shopPacks).where(eq(shopPacks.id, id)).limit(1);
  return NextResponse.json(pack);
}

export async function DELETE(req: Request) {
  const user = await getUser();
  if (!user || user.role !== "creator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  await db.delete(shopPacks).where(eq(shopPacks.id, id));
  return NextResponse.json({ success: true });
}
