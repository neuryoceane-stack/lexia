/**
 * Nom du produit, source unique.
 * Le manifeste PWA (`public/manifest.json`) recopie ces valeurs :
 * un JSON statique ne peut pas importer ce module.
 * Ne pas renommer ici le dépôt, les domaines, les cookies ni les clés de stockage.
 */
export const BRAND_NAME = "Kim Study";
export const BRAND_SHORT = "Kim";

/** Partie surlignée du logotype, dérivée du nom complet. */
export const BRAND_MARK = BRAND_NAME.startsWith(`${BRAND_SHORT} `)
  ? BRAND_NAME.slice(BRAND_SHORT.length + 1)
  : BRAND_NAME;
