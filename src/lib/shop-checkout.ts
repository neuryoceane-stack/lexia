/**
 * Caisse boutique : sélection, lignes Stripe, metadata, décision du webhook.
 * Aucun accès base ni réseau. Le montant payé est toujours recalculé ici.
 */

import {
  SHOP_CHECKOUT_MAX_PACKS,
  SHOP_LOT_PRICE_CENTS,
  SHOP_LOT_SIZE,
  SHOP_PACK_ID_PATTERN,
  ShopSelectionError,
  quoteShopSelection,
  type ShopQuote,
} from "@/lib/shop-price";

export type ShopCatalogPack = {
  id: string;
  title: string;
  description: string;
  price: number;
  language: string;
  isActive: boolean;
  type: string;
  stripePriceId: string | null;
  owned: boolean;
};

export type ShopCheckoutResolution =
  | { ok: true; packs: ShopCatalogPack[]; quote: ShopQuote }
  | {
      ok: false;
      status: 400 | 404 | 409;
      code: string;
      error: string;
      ownedPackIds?: string[];
    };

export function parseShopCheckoutRequest(
  body: unknown
): { ok: true; packIds: string[] } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Corps de requête invalide." };
  }
  const record = body as { packId?: unknown; packIds?: unknown };
  let ids: string[];
  if (Array.isArray(record.packIds)) {
    if (!record.packIds.every((id) => typeof id === "string")) {
      return { ok: false, error: "La sélection est invalide." };
    }
    ids = record.packIds;
  } else if (typeof record.packId === "string") {
    ids = [record.packId];
  } else {
    return { ok: false, error: "Sélectionnez au moins une liste." };
  }

  if (ids.length === 0) {
    return { ok: false, error: "Sélectionnez au moins une liste." };
  }
  if (ids.length > SHOP_CHECKOUT_MAX_PACKS) {
    return {
      ok: false,
      error: `Vous pouvez régler ${SHOP_CHECKOUT_MAX_PACKS} listes au maximum en un paiement.`,
    };
  }
  for (const id of ids) {
    if (!SHOP_PACK_ID_PATTERN.test(id)) {
      return { ok: false, error: "Identifiant de liste invalide." };
    }
  }
  return { ok: true, packIds: ids };
}

/** Vérifie la sélection contre le catalogue déjà chargé. Ne fait confiance à aucun total client. */
export function resolveShopCheckout(
  requestedIds: readonly string[],
  catalog: readonly ShopCatalogPack[]
): ShopCheckoutResolution {
  const byId = new Map(catalog.map((pack) => [pack.id, pack]));
  if (requestedIds.some((id) => !byId.has(id))) {
    return {
      ok: false,
      status: 404,
      code: "unknown",
      error: "Une liste de cette sélection est introuvable.",
    };
  }

  const ordered = requestedIds.map((id) => byId.get(id)!);
  if (ordered.some((pack) => !pack.isActive || pack.type !== "thematique")) {
    return {
      ok: false,
      status: 404,
      code: "unavailable",
      error: "Une liste de cette sélection n'est plus en vente.",
    };
  }

  const owned = ordered.filter((pack) => pack.owned);
  if (owned.length > 0) {
    return {
      ok: false,
      status: 409,
      code: "owned",
      error: "Certaines listes sont déjà dans votre bibliothèque.",
      ownedPackIds: owned.map((pack) => pack.id),
    };
  }

  try {
    const quote = quoteShopSelection(
      ordered.map((pack) => ({
        id: pack.id,
        price: pack.price,
        language: pack.language,
      }))
    );
    return { ok: true, packs: ordered, quote };
  } catch (error) {
    if (error instanceof ShopSelectionError) {
      return { ok: false, status: 400, code: error.code, error: error.message };
    }
    throw error;
  }
}

export type ShopCheckoutLine =
  | { kind: "lot"; quantity: number; unitAmountCents: number }
  | {
      kind: "pack";
      packId: string;
      title: string;
      description: string;
      unitAmountCents: number;
      stripePriceId: string | null;
    };

/** Un lot = une ligne au prix du lot. Le reste, une ligne par liste, à son prix catalogue. */
export function planShopCheckoutLines(
  quote: ShopQuote,
  packs: readonly Pick<ShopCatalogPack, "id" | "title" | "description" | "stripePriceId">[]
): ShopCheckoutLine[] {
  const byId = new Map(packs.map((pack) => [pack.id, pack]));
  const lines: ShopCheckoutLine[] = [];
  if (quote.lotCount > 0) {
    lines.push({
      kind: "lot",
      quantity: quote.lotCount,
      unitAmountCents: SHOP_LOT_PRICE_CENTS,
    });
  }
  const remainderIds = quote.packIds.slice(quote.lotCount * SHOP_LOT_SIZE);
  for (const id of remainderIds) {
    const pack = byId.get(id);
    const amount = quote.lines.find((line) => line.packId === id)?.amountCents;
    if (!pack || amount == null) {
      throw new Error(`Ligne de paiement introuvable pour ${id}`);
    }
    lines.push({
      kind: "pack",
      packId: id,
      title: pack.title,
      description: pack.description,
      unitAmountCents: amount,
      stripePriceId: pack.stripePriceId?.trim() || null,
    });
  }
  return lines;
}

export function catalogStripePriceError(
  price: { active: boolean; unit_amount: number | null },
  expectedCents: number
): string | null {
  if (!price.active || price.unit_amount !== expectedCents) {
    return "Le prix Stripe ne correspond pas au prix de la liste. Réactivez la liste depuis le Creator pour resynchroniser.";
  }
  return null;
}

const PACK_IDS_VALUE_MAX = 450;

/** Découpe les ids pour rester sous la limite Stripe (500 caractères par valeur). */
export function encodeShopPackIdMetadata(packIds: readonly string[]): Record<string, string> {
  const chunks: string[] = [];
  let current = "";
  for (const id of packIds) {
    const next = current.length === 0 ? id : `${current},${id}`;
    if (next.length > PACK_IDS_VALUE_MAX) {
      if (current.length === 0) {
        throw new Error("Identifiant de liste trop long pour Stripe");
      }
      chunks.push(current);
      current = id;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  if (chunks.length > 8) {
    throw new Error("Trop de listes pour les metadata Stripe");
  }
  const out: Record<string, string> = {};
  chunks.forEach((chunk, index) => {
    out[index === 0 ? "packIds" : `packIds${index + 1}`] = chunk;
  });
  return out;
}

export function shopCheckoutMetadata(userId: string, quote: ShopQuote): Record<string, string> {
  const amounts = quote.lines.map((line) => String(line.amountCents)).join(",");
  if (!userId.trim()) {
    throw new Error("Utilisateur manquant");
  }
  if (amounts.length > 500) {
    throw new Error("Métadonnées de montants trop longues");
  }
  const metadata: Record<string, string> = {
    userId,
    kind: quote.lotCount > 0 ? "shop_lot" : "shop_pack",
    ...encodeShopPackIdMetadata(quote.packIds),
    amounts,
    amountCents: String(quote.totalCents),
  };
  if (quote.packIds.length === 1) {
    metadata.packId = quote.packIds[0]!;
  }
  for (const value of Object.values(metadata)) {
    if (value.length > 500) {
      throw new Error("Métadonnée Stripe trop longue");
    }
  }
  return metadata;
}

function packIdsChunkIndex(key: string): number {
  if (key === "packIds") return 1;
  return Number(key.slice("packIds".length));
}

export function readShopCheckoutPackIds(
  metadata: Readonly<Record<string, string | undefined>> | null | undefined
): string[] | null {
  if (!metadata) return null;
  const keys = Object.keys(metadata)
    .filter((key) => key === "packIds" || /^packIds[2-8]$/.test(key))
    .sort((a, b) => packIdsChunkIndex(a) - packIdsChunkIndex(b));
  if (keys.length > 0) {
    return keys.flatMap((key) =>
      (metadata[key] ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    );
  }
  const single = metadata.packId?.trim();
  if (single) return [single];
  return null;
}

export function shopPurchaseId(userId: string, packId: string): string {
  return `shop:${userId}:${packId}`;
}

export function shopListId(userId: string, packId: string): string {
  return `shop-list:${userId}:${packId}`;
}

export function shopFamilyId(userId: string, packId: string): string {
  return `shop-family:${userId}:${packId}`;
}

export function shopWordId(userId: string, packId: string, index: number): string {
  return `shop-word:${userId}:${packId}:${index}`;
}

/** Événements Checkout qui ne doivent jamais attribuer de liste. */
export function shopCheckoutEventDisposition(
  eventType: string
): "fulfill" | "ignore" | "pass" {
  if (
    eventType === "checkout.session.async_payment_failed" ||
    eventType === "checkout.session.expired"
  ) {
    return "ignore";
  }
  if (
    eventType === "checkout.session.completed" ||
    eventType === "checkout.session.async_payment_succeeded"
  ) {
    return "fulfill";
  }
  return "pass";
}

export type ShopPaymentView = {
  id: string;
  mode: string | null;
  paymentStatus: string | null;
  amountTotal: number | null;
  paymentIntentId: string | null;
  metadata: Readonly<Record<string, string | undefined>> | null;
};

export type ShopFulfillmentPlan =
  | { action: "ignore"; reason: "unpaid" }
  | { action: "reject"; status: 400 | 500; error: string }
  | {
      action: "grant";
      userId: string;
      sessionId: string;
      paymentIntentId: string | null;
      amountTotal: number;
      grants: { packId: string; amountCents: number }[];
    };

/**
 * Décide si le webhook attribue les listes.
 * Un paiement non payé, annulé ou échoué n'attribue rien.
 * Un replay payé redonne les mêmes grants : l'écriture reste idempotente plus loin.
 */
export function planShopFulfillment(view: ShopPaymentView): ShopFulfillmentPlan {
  if (view.mode != null && view.mode !== "payment") {
    return { action: "reject", status: 400, error: "Session qui n'est pas un paiement boutique." };
  }

  const packIds = readShopCheckoutPackIds(view.metadata);
  if (!packIds || packIds.length === 0) {
    return { action: "reject", status: 400, error: "Missing metadata" };
  }
  if (view.paymentStatus !== "paid") {
    return { action: "ignore", reason: "unpaid" };
  }

  const userId = view.metadata?.userId?.trim() ?? "";
  if (!userId) {
    return { action: "reject", status: 400, error: "Missing metadata" };
  }
  if (packIds.length > SHOP_CHECKOUT_MAX_PACKS) {
    return { action: "reject", status: 400, error: "Trop de listes dans le paiement." };
  }
  if (new Set(packIds).size !== packIds.length) {
    return { action: "reject", status: 400, error: "Liste en double dans le paiement." };
  }
  for (const id of packIds) {
    if (!SHOP_PACK_ID_PATTERN.test(id)) {
      return { action: "reject", status: 400, error: "Identifiant de liste invalide." };
    }
  }
  const amountTotal = view.amountTotal;
  if (amountTotal == null || !Number.isInteger(amountTotal) || amountTotal <= 0) {
    return { action: "reject", status: 500, error: "Montant payé absent." };
  }

  const amounts = readPaidAmounts(view.metadata, packIds, amountTotal);
  if (!amounts.ok) {
    return { action: "reject", status: amounts.status, error: amounts.error };
  }

  return {
    action: "grant",
    userId,
    sessionId: view.id,
    paymentIntentId: view.paymentIntentId,
    amountTotal,
    grants: packIds.map((packId, index) => ({
      packId,
      amountCents: amounts.values[index]!,
    })),
  };
}

function readPaidAmounts(
  metadata: ShopPaymentView["metadata"],
  packIds: readonly string[],
  amountTotal: number
): { ok: true; values: number[] } | { ok: false; status: 400 | 500; error: string } {
  const raw = metadata?.amounts?.trim();
  let values: number[];
  if (raw) {
    const parts = raw.split(",").map((part) => part.trim());
    if (parts.length !== packIds.length) {
      return { ok: false, status: 500, error: "Les montants ne correspondent pas aux listes." };
    }
    values = parts.map((part) => Number(part));
    if (values.some((amount) => !Number.isInteger(amount) || amount <= 0)) {
      return { ok: false, status: 500, error: "Montant de liste invalide." };
    }
  } else if (packIds.length === 1) {
    values = [amountTotal];
  } else {
    return { ok: false, status: 500, error: "Montants du lot absents." };
  }

  const sum = values.reduce((total, amount) => total + amount, 0);
  if (sum !== amountTotal) {
    return { ok: false, status: 500, error: "Le montant payé ne correspond pas aux listes." };
  }
  const declared = metadata?.amountCents?.trim();
  if (declared && Number(declared) !== amountTotal) {
    return { ok: false, status: 500, error: "Le montant payé ne correspond pas aux listes." };
  }
  return { ok: true, values };
}

export type ShopPackGrantState = {
  hasPurchase: boolean;
  hasList: boolean;
  wordCountOnList: number;
  expectedWordCount: number;
};

export type ShopPackGrantPlan =
  | { action: "ready" }
  | { action: "apply"; insertPurchase: boolean; createList: boolean; insertWords: boolean }
  | { action: "conflict"; error: string };

/** Ce qu'il reste à écrire pour une liste, sans jamais recréer un achat ou des mots déjà là. */
export function planShopPackGrant(state: ShopPackGrantState): ShopPackGrantPlan {
  const { hasPurchase, hasList, wordCountOnList, expectedWordCount } = state;
  if (
    !Number.isInteger(wordCountOnList) ||
    !Number.isInteger(expectedWordCount) ||
    wordCountOnList < 0 ||
    expectedWordCount < 0
  ) {
    return { action: "conflict", error: "Compte de mots invalide." };
  }
  if (!hasList && wordCountOnList > 0) {
    return { action: "conflict", error: "Mots boutique sans liste." };
  }
  if (hasList && wordCountOnList > 0 && wordCountOnList !== expectedWordCount) {
    return {
      action: "conflict",
      error: `Liste boutique incomplète : ${wordCountOnList} mots en base, ${expectedWordCount} attendus.`,
    };
  }

  const insertPurchase = !hasPurchase;
  const createList = !hasList;
  const insertWords = expectedWordCount > 0 && wordCountOnList === 0;
  if (!insertPurchase && !createList && !insertWords) {
    return { action: "ready" };
  }
  return { action: "apply", insertPurchase, createList, insertWords };
}
