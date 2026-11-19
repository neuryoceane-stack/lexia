import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lists, shopPacks, userPurchases, wordFamilies } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import { SHOP_ENABLED } from "@/lib/feature-flags";
import { countShopPackContents, shopPackWordsJsonForClient } from "@/lib/shop-pack-preview";

export async function GET() {
  if (!SHOP_ENABLED) {
    return NextResponse.json({ error: "La boutique est désactivée." }, { status: 403 });
  }
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const packs = await db
    .select()
    .from(shopPacks)
    .where(and(eq(shopPacks.isActive, true), eq(shopPacks.type, "thematique")));

  const purchases = await db
    .select()
    .from(userPurchases)
    .where(eq(userPurchases.userId, user.id));

  const purchasedPackIds = new Set(purchases.map((p) => p.packId));

  const shopLists = await db
    .select({
      listId: lists.id,
      name: lists.name,
      language: lists.language,
    })
    .from(lists)
    .innerJoin(wordFamilies, eq(lists.familyId, wordFamilies.id))
    .where(and(eq(wordFamilies.userId, user.id), eq(lists.source, "shop")));

  const listByKey = new Map<string, string>();
  for (const row of shopLists) {
    const key = `${row.language ?? ""}:${row.name}`;
    if (!listByKey.has(key)) listByKey.set(key, row.listId);
  }

  const packsWithOwnership = packs.map((pack) => {
    const counts =
      pack.wordsJson != null
        ? countShopPackContents(pack.wordsJson)
        : { wordCount: pack.wordCount, expressionCount: pack.expressionCount };
    const owned = purchasedPackIds.has(pack.id);
    const listKey = `${pack.language}:${pack.title}`;
    return {
      id: pack.id,
      title: pack.title,
      description: pack.description,
      price: pack.price,
      language: pack.language,
      level: pack.level,
      type: pack.type,
      wordsJson: shopPackWordsJsonForClient(pack.wordsJson, owned),
      wordCount: counts.wordCount || pack.wordCount,
      expressionCount: counts.expressionCount || pack.expressionCount,
      owned,
      listId: owned ? (listByKey.get(listKey) ?? null) : null,
    };
  });

  return NextResponse.json(packsWithOwnership);
}