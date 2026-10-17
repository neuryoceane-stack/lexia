# Abonnement Stripe (élèves)

Étape 1 : encaisser l'abonnement. Le blocage des actions est optionnel : voir « Paywall ». Sans `PAYWALL_ENABLED=true`, un compte non abonné utilise l'app comme avant.

## Offre

- Mensuel : 5 € / mois, sans engagement
- Annuel : 45 € / an, soit 3,75 € / mois, 3 mois offerts
- Essai : 15 jours, carte bancaire obligatoire, une seule fois (statut `inactive`). Il n'existe pas de version gratuite.
- Un compte `canceled` peut se réabonner, sans nouvel essai
- Un accès déjà `active` ou `trialing` (y compris un code promo) ne redémarre pas un Checkout

## Variables d'environnement

Clés de **test** uniquement. Une clé `sk_live_` ou `rk_live_` est refusée par le serveur.

| Variable | Exemple | Rôle |
|----------|---------|------|
| `STRIPE_SECRET_KEY` | `sk_test_…` | Clé secrète Stripe |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` | Signature du webhook |
| `STRIPE_PRICE_MONTHLY` | `price_…` | Prix récurrent 5 € / mois. **À mettre à jour** avec le Price ID du nouveau tarif. |
| `STRIPE_PRICE_YEARLY` | `price_…` | Prix récurrent 45 € / an. **À mettre à jour** avec le Price ID du nouveau tarif. |
| `NEXTAUTH_URL` | `http://localhost:3000` | Origine des URLs de retour |

Les Price ID ne sont pas écrits dans le code. Au moment du Checkout, Lexiva vérifie que le prix Stripe est actif, en euros, et exactement égal à 500 ou 4 500 centimes, avec un intervalle d'un mois ou d'un an. Ces montants viennent de `src/lib/offer.ts`. Ne pas poser de période d'essai sur le Price : les 15 jours sont ajoutés par la session Checkout (`trial_period_days`).

Variables à mettre à jour après création des deux prix : `STRIPE_PRICE_MONTHLY` (5 € / mois) et `STRIPE_PRICE_YEARLY` (45 € / an). Un ancien Price ID à 4 € ou 40 € est refusé. `PAYWALL_ENABLED` ne change pas.

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

1. Créer un produit Lexiva et deux prix récurrents : 5 € / mois et 45 € / an. Pas de période d'essai sur le Price.
2. Copier les Price ID dans `STRIPE_PRICE_MONTHLY` et `STRIPE_PRICE_YEARLY` (les deux variables sont à mettre à jour).
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

Sur la page, avant souscription : l'offre (essai de 15 jours, carte requise) et la ligne « Si tu es mineur, demande à un parent ou à un tuteur de souscrire. » La phrase « Ta carte est enregistrée » n'apparaît qu'une fois l'abonnement en cours.

Sans clé de test ni Price ID, l'élève voit « L'abonnement n'est pas encore ouvert. Tu peux continuer à utiliser Lexiva. » sur `/app/abonnement` et dans Paramètres. Aucun bouton de paiement, aucun message d'erreur.

`hasActiveSubscription` reste vrai seulement pour `active` et `trialing`. Le paywall s'en sert lorsque `PAYWALL_ENABLED=true`.

## Paywall

Interrupteur : `PAYWALL_ENABLED`. Le paywall n'agit que si la variable vaut exactement `true`. Absente, vide ou toute autre valeur : aucun blocage, parcours d'inscription inchangé (arrivée sur `/app`).

### Activer

Poser la variable dans l'environnement (Vercel ou fichier local, jamais commité) puis relancer ou redéployer :

```
PAYWALL_ENABLED=true
```

Aucune clé Stripe n'est lue ni modifiée par cet interrupteur.

### Qui est bloqué

Un élève (`etudiant`) dont le statut n'est ni `active` ni `trialing` : nouvel inscrit sans carte, essai non converti, abonnement terminé (`canceled`), paiement refusé (`past_due`). Un essai en cours (`trialing`) ou un abonnement `active` (y compris un code promo de test) passe. Une résiliation programmée qui laisse le statut `active` ou `trialing` conserve l'accès jusqu'à la fin de période.

Exemptés : les rôles `creator` et `professeur`. L'espace professeur n'est pas modifié.

### Bloqué

Création de listes et de mots, imports, Mots Sauvages, et toute la révision (express, flashcards, dictée, évaluation).

- Pages : redirection vers `/app/abonnement`. Après l'inscription d'un élève, même redirection.
- API : `402` et `{ "error": "Un abonnement est nécessaire pour cette action.", "code": "subscription_required" }`.

Routes API concernées : `POST /api/familles`, `POST /api/familles/[id]/listes`, `POST /api/listes`, `POST /api/listes/[listId]/mots`, `POST /api/listes/[listId]/mots/bulk`, `POST /api/extract/ocr`, `POST /api/extract/raw`, `POST /api/extract/segment`, `POST /api/extract/pdf`, `POST /api/extract/url`, `POST /api/extract/song`, `POST /api/translate`, `GET` et `POST /api/revision`, `POST /api/revision/session`.

Pages : `/app/familles/mots-sauvages`, `/app/familles/dupliquer`, `/app/familles/[id]/nouvelle-liste`, `/app/revision` (express, flashcards, dictée) et `/app/evaluation`. Les boutons d'ajout ou de révision dans la bibliothèque redirigent aussi, sans ouvrir le formulaire.

Le tutoriel d'accueil ne démarre pas tant que l'élève est bloqué (il ouvre la révision). Il se lance une fois l'accès obtenu, si l'onboarding n'a pas été marqué terminé.

### Toujours autorisé

Tableau de bord, consultation de la bibliothèque (listes personnelles et listes de classe), `/app/abonnement`, paramètres, déconnexion, pages légales. Renommer, modifier ou supprimer une liste ou un mot déjà là reste possible. L'achat d'un pack en boutique n'est pas bloqué : le webhook crée la liste après paiement.

### Non tranché

Un élève rattaché à une classe de professeur n'est pas exempté. Sans abonnement actif ni essai, il voit sa bibliothèque et les listes de classe, mais il ne peut ni ajouter ni réviser. À décider.

### Routes retirées

`POST /api/import`, `POST /api/extract/vision` et `POST /api/synthese/message` ne sont appelées nulle part (espace élève et espace professeur). Elles répondent `410` et n'appellent plus de modèle. `GET /api/synthese` (statistiques) reste en place.
