import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shopPacks, userPurchases } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const packs = await db
    .select()
    .from(shopPacks)
    .where(eq(shopPacks.isActive, true));

  const purchases = await db
    .select()
    .from(userPurchases)
    .where(eq(userPurchases.userId, user.id));

  const purchasedPackIds = new Set(purchases.map((p) => p.packId));

  const packsWithOwnership = packs.map((pack) => ({
    ...pack,
    owned: purchasedPackIds.has(pack.id),
  }));

  return NextResponse.json(packsWithOwnership);
}
