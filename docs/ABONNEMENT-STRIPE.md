# Abonnement Stripe (élèves)

Étape 1 : encaisser l'abonnement. Aucun contenu n'est bloqué pour un compte non abonné.

## Offre

- Mensuel : 4 € / mois
- Annuel : 40 € / an (2 mois offerts)
- Essai : 30 jours, carte bancaire obligatoire, une seule fois (statut `inactive`)
- Un compte `canceled` peut se réabonner, sans nouvel essai
- Un accès déjà `active` ou `trialing` (y compris un code promo) ne redémarre pas un Checkout

## Variables d'environnement

Clés de **test** uniquement. Une clé `sk_live_` ou `rk_live_` est refusée par le serveur.

| Variable | Exemple | Rôle |
|----------|---------|------|
| `STRIPE_SECRET_KEY` | `sk_test_…` | Clé secrète Stripe |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` | Signature du webhook |
| `STRIPE_PRICE_MONTHLY` | `price_…` | Prix récurrent 4 € / mois |
| `STRIPE_PRICE_YEARLY` | `price_…` | Prix récurrent 40 € / an |
| `NEXTAUTH_URL` | `http://localhost:3000` | Origine des URLs de retour |

Les Price ID ne sont pas écrits dans le code. Au moment du Checkout, Lexiva vérifie que le prix Stripe est actif, en euros, et exactement égal à 400 ou 4 000 centimes, avec un intervalle d'un mois ou d'un an. Ne pas poser de période d'essai sur le Price : les 30 jours sont ajoutés par la session Checkout.

## Schéma à pousser

Colonnes ajoutées dans `src/lib/db/schema.ts` uniquement. Le push est à faire à la main (pas de `drizzle-kit push` automatique) :

```sql
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN subscription_current_period_end INTEGER;
ALTER TABLE users ADD COLUMN stripe_status_synced_at INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS users_stripe_customer_id_unique ON users(stripe_customer_id);
```

Tant que ces colonnes ne sont pas en place, la page et Paramètres affichent le même message « pas encore ouvert », sans erreur visible. Le paiement ne démarre qu'après ce SQL.

## Stripe Dashboard (mode test)

1. Créer un produit Lexiva et deux prix récurrents : 4 € / mois et 40 € / an.
2. Copier les Price ID dans `STRIPE_PRICE_MONTHLY` et `STRIPE_PRICE_YEARLY`.
3. Activer le portail client : annulation, mise à jour de la carte, et changement entre ces deux prix.
4. Ajouter l'endpoint webhook `https://<domaine>/api/stripe/webhook` avec les événements :
   - `checkout.session.completed` (déjà utilisé par la boutique)
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

En local : `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

## Parcours élève

1. Menu du compte → Abonnement, ou Paramètres → S'abonner.
2. Choisir Mensuel ou Annuel. La page Stripe s'ouvre en français et demande une carte.
3. Carte de test : `4242 4242 4242 4242`, date future, CVC quelconque.
4. Retour sur `/app/abonnement?checkout=success&session_id=cs_test_…`. La page relit la session Checkout chez Stripe, vérifie qu'elle appartient au compte connecté, puis enregistre le statut (`trialing`) sans attendre le webhook. Un second affichage de la même URL ne crée pas un second abonnement.
5. « Gérer mon abonnement » ouvre le portail (résiliation, carte, factures).

Carte qui échoue au renouvellement : `4000 0000 0000 0341`. Après l'événement `invoice.payment_failed`, le statut devient `past_due`.

## Statuts

| Stripe | Lexiva |
|--------|--------|
| `trialing` | `trialing` |
| `active` | `active` |
| `past_due`, `unpaid` | `past_due` |
| `canceled` | `canceled` (formule remise à `free`) |
| `incomplete`, `incomplete_expired` | `inactive` |
| `paused` | erreur webhook, non appliqué |
| `cancel_at_period_end` alors que le statut reste `active` ou `trialing` | affiché « Résiliation programmée », lu chez Stripe à l'affichage, sans colonne supplémentaire |

Sur la page, avant souscription : l'offre (essai de 30 jours, carte requise). La phrase « Votre carte est enregistrée » n'apparaît qu'une fois l'abonnement en cours.

Sans clé de test ni Price ID, l'élève voit « L'abonnement n'est pas encore ouvert. Vous pouvez continuer à utiliser Lexiva. » sur `/app/abonnement` et dans Paramètres. Aucun bouton de paiement, aucun message d'erreur.

`hasActiveSubscription` reste vrai seulement pour `active` et `trialing`. Cette étape ne s'en sert pas pour bloquer l'accès.
