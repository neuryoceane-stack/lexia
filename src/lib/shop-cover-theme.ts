/** Les 5 variantes de couverture (charte uniquement). */
export type ShopCoverVariantId = "diagonal" | "vertical" | "lowBand" | "rounded" | "stripes";

export type ShopCoverTheme = {
  variant: ShopCoverVariantId;
  /** Inclinaison ou décalage dérivé de l’id (stable). */
  twist: number;
  bgLineMixPercent: number;
};

const VARIANTS: ShopCoverVariantId[] = ["diagonal", "vertical", "lowBand", "rounded", "stripes"];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function preferredVariantIndex(packId: string): number {
  return hashString(packId) % VARIANTS.length;
}

/**
 * Attribue une variante stable par pack, sans doublon entre voisins dans l’ordre d’affichage.
 */
export function assignShopCoverVariants<T extends { id: string }>(packsInDisplayOrder: T[]): Map<string, ShopCoverVariantId> {
  const assigned = new Map<string, ShopCoverVariantId>();
  let previous: ShopCoverVariantId | null = null;

  for (const pack of packsInDisplayOrder) {
    let index = preferredVariantIndex(pack.id);
    while (previous !== null && VARIANTS[index] === previous) {
      index = (index + 1) % VARIANTS.length;
    }
    const variant = VARIANTS[index]!;
    assigned.set(pack.id, variant);
    previous = variant;
  }
  return assigned;
}

export function getShopCoverTheme(packId: string, variant: ShopCoverVariantId): ShopCoverTheme {
  const hash = hashString(packId);
  return {
    variant,
    twist: -14 + (hash % 28),
    bgLineMixPercent: 16 + (hash % 26),
  };
}

/** Titre court affiché sur la couverture (premier segment significatif). */
export function shopCoverTitleShort(title: string): string {
  const trimmed = title.trim();
  const segment = trimmed.split(/[&·\-–—]/)[0]?.trim();
  return (segment && segment.length > 0 ? segment : trimmed).slice(0, 24);
}

export function shopPackRemainingHint(
  owned: boolean,
  wordCount: number,
  expressionCount: number,
  previewWordCount: number,
  previewExpressionCount: number
): string | null {
  if (owned) return null;
  const extraWords = Math.max(0, wordCount - previewWordCount);
  const extraExpr = Math.max(0, expressionCount - previewExpressionCount);
  if (extraWords === 0 && extraExpr === 0) return null;
  const parts: string[] = [];
  if (extraWords > 0) {
    parts.push(`${extraWords} autre${extraWords > 1 ? "s" : ""} mot${extraWords > 1 ? "s" : ""}`);
  }
  if (extraExpr > 0) {
    parts.push(`${extraExpr} autre${extraExpr > 1 ? "s" : ""} expression${extraExpr > 1 ? "s" : ""}`);
  }
  return `… et ${parts.join(" et ")}, disponibles après achat`;
}