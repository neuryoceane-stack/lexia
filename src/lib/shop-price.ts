/**
 * Affichage des prix boutique (shop_packs.price en centimes).
 * Ne pas dupliquer un montant en dur dans l’interface élève.
 */
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