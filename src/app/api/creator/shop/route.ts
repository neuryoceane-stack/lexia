import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shopPacks, userPurchases } from "@/lib/db/schema";
import { eq, desc, count, sum, getTableColumns } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import { countShopPackContents } from "@/lib/shop-pack-preview";
import { syncShopPackToStripe } from "@/lib/shop-stripe-sync";

export async function GET() {
  const user = await getUser();
  if (!user || user.role !== "creator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // words_json reste en base : le panneau le charge via GET /api/creator/shop/[id].
  const { wordsJson: _wordsJson, ...packColumns } = getTableColumns(shopPacks);
  void _wordsJson;
  const packs = await db.select(packColumns).from(shopPacks).orderBy(desc(shopPacks.createdAt));

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

  const { wordCount, expressionCount } = countShopPackContents(wordsJson);

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
    wordCount: wordCount || 60,
    expressionCount: expressionCount || 20,
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
  const { id, ...rawFields } = body;
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const [before] = await db.select().from(shopPacks).where(eq(shopPacks.id, id)).limit(1);
  if (!before) return NextResponse.json({ error: "Pack introuvable" }, { status: 404 });

  const allowedKeys = [
    "title",
    "description",
    "emoji",
    "language",
    "level",
    "price",
    "isActive",
    "wordsJson",
  ] as const;
  const fields: Record<string, unknown> = {};
  for (const key of allowedKeys) {
    if (key in rawFields) fields[key] = rawFields[key];
  }

  if (typeof fields.wordsJson === "string") {
    const counts = countShopPackContents(fields.wordsJson);
    if (counts.wordCount > 0) fields.wordCount = counts.wordCount;
    if (counts.expressionCount > 0) fields.expressionCount = counts.expressionCount;
  }

  if (Object.keys(fields).length > 0) {
    await db.update(shopPacks).set(fields).where(eq(shopPacks.id, id));
  }

  let [pack] = await db.select().from(shopPacks).where(eq(shopPacks.id, id)).limit(1);
  if (!pack) return NextResponse.json({ error: "Pack introuvable" }, { status: 404 });

  const becameActive = pack.isActive && !before.isActive;
  const priceChanged = typeof fields.price === "number" && fields.price !== before.price;
  const metaChanged =
    (typeof fields.title === "string" && fields.title !== before.title) ||
    (typeof fields.description === "string" && fields.description !== before.description);
  const needsStripeSync =
    pack.isActive &&
    (becameActive ||
      priceChanged ||
      metaChanged ||
      !pack.stripeProductId ||
      !pack.stripePriceId);

  if (needsStripeSync) {
    try {
      const synced = await syncShopPackToStripe(pack, before.price);
      await db
        .update(shopPacks)
        .set({
          stripeProductId: synced.stripeProductId,
          stripePriceId: synced.stripePriceId,
        })
        .where(eq(shopPacks.id, id));
      [pack] = await db.select().from(shopPacks).where(eq(shopPacks.id, id)).limit(1);
    } catch (error) {
      console.error("[creator/shop] Stripe sync", error);
      const rollback: { isActive?: boolean; price?: number } = {};
      if (becameActive) rollback.isActive = false;
      if (priceChanged) rollback.price = before.price;
      if (Object.keys(rollback).length > 0) {
        await db.update(shopPacks).set(rollback).where(eq(shopPacks.id, id));
      }
      [pack] = await db.select().from(shopPacks).where(eq(shopPacks.id, id)).limit(1);
      return NextResponse.json(
        { error: "Synchronisation Stripe impossible. Vérifiez la clé de test et réessayez." },
        { status: 502 }
      );
    }
  }

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
