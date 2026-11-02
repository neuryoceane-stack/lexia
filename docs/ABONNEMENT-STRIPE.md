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

Les Price ID ne sont pas écrits dans le code. Au moment du Checkout, Kim Study vérifie que le prix Stripe est actif, en euros, et exactement égal à 500 ou 4 500 centimes, avec un intervalle d'un mois ou d'un an. Ces montants viennent de `src/lib/offer.ts`. Ne pas poser de période d'essai sur le Price : les 15 jours sont ajoutés par la session Checkout (`trial_period_days`).

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

Table `cancellation_feedback` (mission K2) : uniquement dans `src/lib/db/schema.ts`. Avant la fusion, Océane lance `npx drizzle-kit push`. Pas d'ALTER manuel. Tant que la table est absente, la résiliation Stripe aboutit quand même et la section Désabonnements reste vide, sans chiffre inventé.

## Stripe Dashboard (mode test)

1. Créer un produit Kim Study et deux prix récurrents : 5 € / mois et 45 € / an. Pas de période d'essai sur le Price. Les libellés envoyés à Checkout (`Lexiva — formule mensuelle` / `Lexiva — formule annuelle`) sont encore l'ancien nom : le code Stripe n'a pas été modifié dans le renommage.
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
5. « Résilier mon abonnement » ouvre la fenêtre de motif, puis programme la fin à l'échéance. « Gérer la facturation » ouvre le portail (carte, factures). Le portail peut encore résilier : une ligne sans motif est alors créée.

Carte qui échoue au renouvellement : `4000 0000 0000 0341`. Après l'événement `invoice.payment_failed`, le statut devient `past_due`.

## Statuts

| Stripe | Kim Study |
|--------|--------|
| `trialing` | `trialing` |
| `active` | `active` |
| `past_due`, `unpaid` | `past_due` |
| `canceled` | `canceled` (formule remise à `free`) |
| `incomplete`, `incomplete_expired` | `inactive` |
| `paused` | erreur webhook, non appliqué |
| `cancel_at_period_end` alors que le statut reste `active` ou `trialing` | affiché « Résiliation programmée », lu chez Stripe à l'affichage, sans colonne supplémentaire |

Sur la page, avant souscription : l'offre (essai de 15 jours, carte requise) et la ligne « Si tu es mineur, demande à un parent ou à un tuteur de souscrire. » La phrase « Ta carte est enregistrée » n'apparaît qu'une fois l'abonnement en cours.

## Résiliation

La fenêtre (vouvoiement) s'ouvre depuis « Résilier mon abonnement ». Le motif est facultatif : trop cher, examen passé, pas assez utilisé, fonctionnalité manquante, problème technique, autre, plus un mot libre. « Garder mon abonnement » ferme la fenêtre. « Confirmer la résiliation » enregistre le motif puis appelle Stripe avec `cancel_at_period_end`. L'accès dure jusqu'à la fin de période. L'état affiché reste « Résiliation programmée ».

`POST /api/stripe/cancel` vérifie `getUser()`. Un échec d'écriture du motif est journalisé et n'empêche pas l'appel Stripe.

Le webhook, sur `customer.subscription.updated` ou `deleted`, crée une ligne `reason` null si l'abonnement est programmé ou déjà `canceled`, et s'il n'existe pas déjà une ligne pour le même élève et la même date de début (`subscription.start_date`). Un impayé qui aboutit à `canceled` est donc compté. `invoice.payment_failed` seul ne crée pas de ligne : le statut reste `past_due`.

L'espace créateur, section Désabonnements, lit cette table. Le taux du mois est : départs du mois / (abonnés `active`, `trialing` ou `past_due` + départs du mois commencés avant le mois et qui ne sont plus abonnés). Un abonné arrivé dans le mois et encore actif reste dans l'effectif, faute de date de début sur `users`. `GET /api/creator/churn/export` renvoie le CSV.

Sans clé de test ni Price ID, l'élève voit « L'abonnement n'est pas encore ouvert. Tu peux continuer à utiliser Kim Study. » sur `/app/abonnement`. Aucun bouton de paiement, aucun message d'erreur. L'abonnement n'est plus affiché dans Paramètres.

`hasActiveSubscription` reste vrai seulement pour `active` et `trialing`. Le paywall s'en sert lorsque `PAYWALL_ENABLED=true`.

## Codes promo

Les codes se créent dans l'espace créateur (Codes promo) et se saisissent sur `/app/abonnement` avant le paiement. Sans code, la session Checkout reste celle décrite plus haut : essai de 15 jours seulement si le statut est `inactive`, aucun coupon.

| Avantage | Effet Stripe |
|----------|----------------|
| Pourcentage | Coupon `percent_off`, durée `once` : le premier paiement après l'essai. |
| Montant fixe | Coupon `amount_off` en centimes d'euro, durée `once` : le premier paiement après l'essai. |
| Mois offerts | Coupon 100 %, durée `repeating` sur N mois à partir du début de l'abonnement. Sur la formule annuelle, la facture de l'année est offerte si elle tombe dans cette période. |
| Essai prolongé | `trial_period_days` du code remplace les 15 jours. Pas de coupon. Refusé si l'essai n'est plus proposé. |

Une facture d'essai à 0 € ne consomme pas un coupon `once` (Stripe ignore un coupon sur une facture déjà à zéro). La carte reste demandée. Le coupon est créé à la création du code (clé de test uniquement) et son identifiant est mémorisé dans `stripe_coupon_id`. S'il n'a pas pu l'être, il est créé au premier Checkout.

L'usage (`promo_code_redemptions`) est enregistré dans le webhook `checkout.session.completed`, pas au clic sur Appliquer. Le code voyage dans les métadonnées de la session. Un webhook rejoué rencontre l'index unique et ne crée pas une seconde ligne.

Tant que les tables ne sont pas créées, les écrans affichent une erreur sobre et ne plantent pas. Le paiement sans code n'interroge pas ces tables.

SQL à lancer à la main (identique à `src/lib/promo-codes-sql.ts`). Les dates sont des secondes Unix. `active` vaut 1 ou 0.

```sql
CREATE TABLE IF NOT EXISTS promo_codes (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL,
  benefit_type TEXT NOT NULL,
  value INTEGER NOT NULL,
  institution TEXT,
  max_uses INTEGER,
  ends_at INTEGER,
  applies_monthly INTEGER NOT NULL,
  applies_annual INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  stripe_coupon_id TEXT,
  created_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS promo_codes_code_unique ON promo_codes (code);

CREATE TABLE IF NOT EXISTS promo_code_redemptions (
  id TEXT PRIMARY KEY NOT NULL,
  promo_code_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  redeemed_at INTEGER NOT NULL,
  FOREIGN KEY (promo_code_id) REFERENCES promo_codes (id) ON UPDATE NO ACTION ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE NO ACTION ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS promo_code_redemptions_code_user_unique ON promo_code_redemptions (promo_code_id, user_id);
```

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
