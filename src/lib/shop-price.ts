/**
 * Prix boutique.
 * Le prix d'une liste vient de `shop_packs.price` (centimes).
 * Le lot est la seule offre groupée : son prix vit ici, pas dans
 * `shop_packs.bundle_price` (colonne inutilisée, défaut 1600).
 * Ne pas dupliquer un montant en dur dans l'interface ou le paiement.
 */

/** Listes d'une même langue qui forment un lot. */
export const SHOP_LOT_SIZE = 4;

/** Prix d'un lot, en centimes. 10 €. */
export const SHOP_LOT_PRICE_CENTS = 1000;

/** Listes maximum dans une session de paiement. */
export const SHOP_CHECKOUT_MAX_PACKS = 16;

/** Source des listes créées après un achat (unitaire ou lot). Hors quota freemium. */
export const SHOP_LIST_SOURCE = "shop" as const;

/** Identifiants de pack acceptés en caisse et dans les metadata Stripe. */
export const SHOP_PACK_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

if (!Number.isInteger(SHOP_LOT_SIZE) || SHOP_LOT_SIZE < 2) {
  throw new Error("SHOP_LOT_SIZE invalide");
}
if (!Number.isInteger(SHOP_LOT_PRICE_CENTS) || SHOP_LOT_PRICE_CENTS <= 0) {
  throw new Error("SHOP_LOT_PRICE_CENTS invalide");
}
if (SHOP_LOT_PRICE_CENTS % SHOP_LOT_SIZE !== 0) {
  throw new Error("Le prix du lot doit se partager en centimes entiers");
}

/** Part d'un pack à l'intérieur d'un lot. 2,50 €. Dérivé, pas un second prix. */
export const SHOP_LOT_PACK_SHARE_CENTS = SHOP_LOT_PRICE_CENTS / SHOP_LOT_SIZE;

/** Clé Stripe stable du prix de lot. Le montant vient de SHOP_LOT_PRICE_CENTS. */
export const SHOP_LOT_STRIPE_LOOKUP_KEY = `lexia_shop_lot_${SHOP_LOT_SIZE}`;

export function shopLotIsDiscount(unitPriceCents: number): boolean {
  return (
    Number.isInteger(unitPriceCents) &&
    unitPriceCents > 0 &&
    unitPriceCents * SHOP_LOT_SIZE > SHOP_LOT_PRICE_CENTS
  );
}

/** « 4 packs = 10 € » — le montant passe par le formateur, pas par une chaîne en dur. */
export function shopLotOfferLabel(): string {
  return `${SHOP_LOT_SIZE} packs = ${formatShopPriceCents(SHOP_LOT_PRICE_CENTS)}`;
}

/**
 * Les mots d'une liste boutique ne comptent pas dans les 20 mots gratuits.
 * Vrai pour un achat unitaire comme pour chaque liste d'un lot.
 */
export function countsTowardFreemiumPersonalWords(source: string): boolean {
  return source !== SHOP_LIST_SOURCE;
}

export type ShopPackForQuote = {
  id: string;
  price: number;
  language: string;
};

export type ShopQuoteLine = {
  packId: string;
  amountCents: number;
};

export type ShopQuote = {
  packIds: string[];
  language: string;
  count: number;
  lotCount: number;
  remainderCount: number;
  /** Prix catalogue commun, ou null si les listes n'ont pas le même prix. */
  unitPriceCents: number | null;
  listPriceCents: number;
  totalCents: number;
  savingsCents: number;
  lines: ShopQuoteLine[];
};

export type ShopSelectionErrorCode =
  | "empty"
  | "too_many"
  | "duplicate"
  | "invalid_id"
  | "mixed_language"
  | "mixed_price"
  | "invalid_price";

export class ShopSelectionError extends Error {
  readonly code: ShopSelectionErrorCode;

  constructor(code: ShopSelectionErrorCode, message: string) {
    super(message);
    this.name = "ShopSelectionError";
    this.code = code;
  }
}

/**
 * Prix d'une sélection de packs d'une même langue.
 * 1, 2 ou 3 packs : prix catalogue de chacun.
 * Chaque groupe complet de 4, au même prix, et seulement si le lot est moins cher :
 * SHOP_LOT_PRICE_CENTS, partagé en parts égales. Le reste reste au prix catalogue.
 * L'ordre reçu est conservé : les derniers packs sont le reste hors lot.
 */
export function quoteShopSelection(packs: readonly ShopPackForQuote[]): ShopQuote {
  if (packs.length === 0) {
    throw new ShopSelectionError("empty", "Sélectionnez au moins une liste.");
  }
  if (packs.length > SHOP_CHECKOUT_MAX_PACKS) {
    throw new ShopSelectionError(
      "too_many",
      `Vous pouvez régler ${SHOP_CHECKOUT_MAX_PACKS} listes au maximum en un paiement.`
    );
  }

  const ids = packs.map((pack) => pack.id);
  if (new Set(ids).size !== ids.length) {
    throw new ShopSelectionError("duplicate", "Cette sélection contient deux fois la même liste.");
  }
  for (const id of ids) {
    if (!SHOP_PACK_ID_PATTERN.test(id)) {
      throw new ShopSelectionError("invalid_id", "Identifiant de liste invalide.");
    }
  }

  const language = packs[0]?.language ?? "";
  if (!language || packs.some((pack) => pack.language !== language)) {
    throw new ShopSelectionError("mixed_language", "Un lot réunit des listes de la même langue.");
  }

  for (const pack of packs) {
    if (!Number.isInteger(pack.price) || pack.price <= 0) {
      throw new ShopSelectionError("invalid_price", "Une liste de cette sélection n'a pas de prix valide.");
    }
  }

  const distinctPrices = new Set(packs.map((pack) => pack.price));
  const uniform = distinctPrices.size === 1;
  const unitPriceCents = uniform ? packs[0].price : null;
  const listPriceCents = packs.reduce((sum, pack) => sum + pack.price, 0);
  const potentialLots = Math.floor(packs.length / SHOP_LOT_SIZE);

  if (potentialLots > 0 && !uniform) {
    throw new ShopSelectionError("mixed_price", "Un lot réunit des listes au même prix.");
  }

  const applyLot = potentialLots > 0 && unitPriceCents != null && shopLotIsDiscount(unitPriceCents);
  const lotCount = applyLot ? potentialLots : 0;
  const lines: ShopQuoteLine[] = packs.map((pack, index) => ({
    packId: pack.id,
    amountCents: index < lotCount * SHOP_LOT_SIZE ? SHOP_LOT_PACK_SHARE_CENTS : pack.price,
  }));
  const totalCents = lines.reduce((sum, line) => sum + line.amountCents, 0);

  return {
    packIds: ids,
    language,
    count: packs.length,
    lotCount,
    remainderCount: packs.length - lotCount * SHOP_LOT_SIZE,
    unitPriceCents,
    listPriceCents,
    totalCents,
    savingsCents: listPriceCents - totalCents,
    lines,
  };
}

export type ShopSelectionCopy = {
  /** Présent dès qu'au moins un lot s'applique. */
  lotMessage: string | null;
  totalLabel: string;
  /** Prix catalogue barré quand le lot réduit la note. */
  listTotalLabel: string | null;
  hint: string | null;
  countLabel: string;
};

export function shopSelectionCopy(
  quote: ShopQuote,
  options?: { lotReachable?: boolean }
): ShopSelectionCopy {
  const lotReachable = options?.lotReachable !== false;
  const lotMessage = quote.lotCount > 0 ? shopLotOfferLabel() : null;
  let hint: string | null = null;
  if (
    lotReachable &&
    quote.lotCount === 0 &&
    quote.unitPriceCents != null &&
    shopLotIsDiscount(quote.unitPriceCents) &&
    quote.count < SHOP_LOT_SIZE
  ) {
    const missing = SHOP_LOT_SIZE - quote.count;
    hint = `Encore ${missing} ${missing > 1 ? "listes" : "liste"} pour ${shopLotOfferLabel()}`;
  } else if (quote.lotCount > 0 && quote.remainderCount > 0 && quote.unitPriceCents != null) {
    hint = `${shopLotOfferLabel()}, puis ${formatShopPriceCents(quote.unitPriceCents)} la liste`;
  } else if (quote.lotCount > 1 && quote.remainderCount === 0) {
    hint = `${quote.lotCount} lots · ${formatShopPriceCents(quote.totalCents)}`;
  }

  return {
    lotMessage,
    totalLabel: formatShopPriceCents(quote.totalCents),
    listTotalLabel: quote.savingsCents > 0 ? formatShopPriceCents(quote.listPriceCents) : null,
    hint,
    countLabel: `${quote.count} ${quote.count > 1 ? "listes" : "liste"}`,
  };
}

export function formatShopPriceCents(cents: number): string {
  if (!Number.isFinite(cents) || cents < 0) {
    throw new Error("formatShopPriceCents: montant invalide");
  }
  if (cents % 100 === 0) {
    const euros = cents / 100;
    return `${euros.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`;
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}