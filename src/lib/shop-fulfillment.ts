import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { lists, shopPacks, userPurchases, wordFamilies, words } from "@/lib/db/schema";
import {
  planShopFulfillment,
  planShopPackGrant,
  shopFamilyId,
  shopListId,
  shopPurchaseId,
  shopWordId,
  type ShopFulfillmentPlan,
  type ShopPaymentView,
} from "@/lib/shop-checkout";
import { requireShopPackWords } from "@/lib/shop-pack-preview";
import { SHOP_LIST_SOURCE } from "@/lib/shop-price";
import { isSqliteUniqueConstraint } from "@/lib/sqlite-error";
import { ensureUserListPair } from "@/lib/user-list";

export type ShopFulfillmentResponse =
  | { httpStatus: 200 }
  | { httpStatus: 400 | 500; error: string };

/**
 * Attribue chaque pack payé : une ligne user_purchases et une liste source shop.
 * Un lot de 4 produit donc 4 achats. Un webhook rejoué n'en ajoute pas.
 * Un paiement non payé n'écrit rien.
 * Les listes shop restent hors du quota freemium (source = shop).
 */
export async function fulfillShopCheckout(view: ShopPaymentView): Promise<ShopFulfillmentResponse> {
  const plan = planShopFulfillment(view);
  if (plan.action === "ignore") return { httpStatus: 200 };
  if (plan.action === "reject") return { httpStatus: plan.status, error: plan.error };
  await grantShopPacks(plan);
  return { httpStatus: 200 };
}

async function grantShopPacks(plan: Extract<ShopFulfillmentPlan, { action: "grant" }>): Promise<void> {
  const ids = plan.grants.map((grant) => grant.packId);
  const packs = await db.select().from(shopPacks).where(inArray(shopPacks.id, ids));
  const byId = new Map(packs.map((pack) => [pack.id, pack]));

  for (const grant of plan.grants) {
    const pack = byId.get(grant.packId);
    if (!pack) {
      throw new Error(`Pack boutique introuvable après paiement : ${grant.packId}`);
    }
    await grantShopPack({
      userId: plan.userId,
      pack,
      amountCents: grant.amountCents,
      stripeSessionId: plan.sessionId,
      stripePaymentId: plan.paymentIntentId,
    });
  }
}

type GrantPack = {
  id: string;
  title: string;
  language: string;
  wordsJson: string | null;
};

async function grantShopPack(input: {
  userId: string;
  pack: GrantPack;
  amountCents: number;
  stripeSessionId: string;
  stripePaymentId: string | null;
}): Promise<void> {
  const { userId, pack } = input;
  const purchaseId = shopPurchaseId(userId, pack.id);
  const listId = shopListId(userId, pack.id);
  const familyId = shopFamilyId(userId, pack.id);
  const packWords = requireShopPackWords(pack.wordsJson);

  const purchase = await findPurchase(userId, pack.id);
  const list = await findGrantList({
    userId,
    pack,
    deterministicListId: listId,
    purchaseExists: Boolean(purchase),
  });
  const wordCountOnList = list ? await countWords(list.id) : 0;
  const decision = planShopPackGrant({
    hasPurchase: Boolean(purchase),
    hasList: Boolean(list),
    wordCountOnList,
    expectedWordCount: packWords.length,
  });

  if (decision.action === "conflict") {
    throw new Error(`${decision.error} (${pack.id})`);
  }
  if (decision.action === "ready") return;

  if (decision.insertPurchase) {
    try {
      await db.insert(userPurchases).values({
        id: purchaseId,
        userId,
        packId: pack.id,
        stripeSessionId: input.stripeSessionId,
        stripePaymentId: input.stripePaymentId,
        amountPaid: input.amountCents,
      });
    } catch (error) {
      if (!isSqliteUniqueConstraint(error)) throw error;
      const again = await findPurchase(userId, pack.id);
      if (!again) throw error;
    }
  }

  const targetListId = list?.id ?? listId;
  if (decision.createList) {
    await ensureUserListPair({
      userId,
      name: pack.title,
      source: SHOP_LIST_SOURCE,
      language: pack.language,
      familyId,
      listId,
    });
  }

  if (!decision.insertWords) return;

  const current = await countWords(targetListId);
  if (current === packWords.length) return;
  if (current !== 0) {
    throw new Error(
      `Liste boutique incomplète pour ${pack.id} : ${current} mots en base, ${packWords.length} attendus.`
    );
  }

  try {
    await db.insert(words).values(
      packWords.map((word, index) => ({
        id: shopWordId(userId, pack.id, index),
        listId: targetListId,
        term: word.term,
        definition: word.definition,
        rank: index,
        isExpression: word.isExpression ?? false,
      }))
    );
  } catch (error) {
    if (!isSqliteUniqueConstraint(error)) throw error;
    const after = await countWords(targetListId);
    if (after !== packWords.length) {
      throw new Error(
        `Liste boutique incomplète pour ${pack.id} : ${after} mots en base, ${packWords.length} attendus.`
      );
    }
  }
}

async function findPurchase(userId: string, packId: string): Promise<{ id: string } | null> {
  const [row] = await db
    .select({ id: userPurchases.id })
    .from(userPurchases)
    .where(and(eq(userPurchases.userId, userId), eq(userPurchases.packId, packId)))
    .limit(1);
  return row ?? null;
}

async function findGrantList(input: {
  userId: string;
  pack: Pick<GrantPack, "title" | "language">;
  deterministicListId: string;
  purchaseExists: boolean;
}): Promise<{ id: string } | null> {
  const [byId] = await db
    .select({ id: lists.id })
    .from(lists)
    .where(eq(lists.id, input.deterministicListId))
    .limit(1);
  if (byId) return byId;
  if (!input.purchaseExists) return null;

  const matches = await db
    .select({ id: lists.id })
    .from(lists)
    .innerJoin(wordFamilies, eq(lists.familyId, wordFamilies.id))
    .where(
      and(
        eq(wordFamilies.userId, input.userId),
        eq(lists.source, SHOP_LIST_SOURCE),
        eq(lists.language, input.pack.language),
        eq(lists.name, input.pack.title)
      )
    );
  if (matches.length > 1) {
    throw new Error(`Plusieurs listes boutique « ${input.pack.title} » pour cet élève`);
  }
  return matches[0] ?? null;
}

async function countWords(listId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`count(*)`.mapWith(Number) })
    .from(words)
    .where(eq(words.listId, listId));
  return row?.total ?? 0;
}
