/**
 * Affichage des prix boutique (shop_packs.price en centimes).
 * Ne pas dupliquer un montant en dur dans l’interface élève.
 */
export function formatShopPriceCents(cents: number): string {
  if (!Number.isFinite(cents) || cents < 0) {
    throw new Error("formatShopPriceCents: montant invalide");
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}