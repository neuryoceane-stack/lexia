/**
 * Offre élève officielle.
 * Les Price ID Stripe restent dans STRIPE_PRICE_MONTHLY et STRIPE_PRICE_YEARLY.
 * Le contrôle du montant au Checkout lit ces constantes : un Price ID qui ne
 * correspond pas est refusé, sans autre changement de la logique de paiement.
 */

export const OFFER_TRIAL_DAYS = 30;

/** Chiffres ronds, sans centimes. */
export const OFFER_MONTHLY_EUROS = 5;
export const OFFER_YEARLY_EUROS = 45;

export const OFFER_MONTHLY_LABEL = "Mensuel";
export const OFFER_YEARLY_LABEL = "Annuel";
export const OFFER_MONTHLY_PERIOD = "par mois";
export const OFFER_YEARLY_PERIOD = "par an";
export const OFFER_MONTHLY_DETAIL = "Sans engagement";
export const OFFER_YEARLY_DETAIL = "Facturé une fois par an";
export const OFFER_YEARLY_BADGE = "3 mois offerts";

/**
 * Seul montant avec centimes : équivalent mensuel du tarif annuel,
 * affiché en petit sous le prix de 45 €.
 */
export const OFFER_YEARLY_PER_MONTH_LABEL = "3,75\u00a0€/mois";

export const OFFER_TRIAL_CARD_LABEL = `Essai de ${OFFER_TRIAL_DAYS} jours, carte bancaire requise`;

export const OFFER_MINOR_NOTICE =
  "Si tu es mineur, demande à un parent ou à un tuteur de souscrire.";

export function formatOfferEuros(amount: number): string {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error(`Montant d'offre inattendu : ${amount}`);
  }
  return `${amount}\u00a0€`;
}
