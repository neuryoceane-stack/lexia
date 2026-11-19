/** Variante visuelle de couverture dérivée de l’id (sans colonne dédiée). */
export type ShopCoverTheme = {
  bandRotateDeg: number;
  bandTopPercent: number;
  subtleLinePercent: number;
  accentShape: 0 | 1 | 2;
  bgLineMixPercent: number;
};

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getShopCoverTheme(packId: string): ShopCoverTheme {
  const hash = hashString(packId);
  return {
    bandRotateDeg: -18 + (hash % 16),
    bandTopPercent: 28 + (hash % 22),
    subtleLinePercent: 12 + (hash % 28),
    accentShape: (hash % 3) as 0 | 1 | 2,
    bgLineMixPercent: 18 + (hash % 22),
  };
}

/** Titre court affiché sur la couverture (premier segment significatif). */
export function shopCoverTitleShort(title: string): string {
  const trimmed = title.trim();
  const segment = trimmed.split(/[&·\-–—]/)[0]?.trim();
  return (segment && segment.length > 0 ? segment : trimmed).slice(0, 24);
}