# Lexi Shop

La boutique est visible (`SHOP_ENABLED` dans `src/lib/feature-flags.ts`). Les listes en vente sont les packs `type = thematique` et `is_active`.

## Prix

Une liste coûte `shop_packs.price` (centimes). Les 16 packs anglais sont à 300 centimes, soit 3 €.

Le lot n'est pas une ligne du catalogue. Son prix est **uniquement** `SHOP_LOT_PRICE_CENTS` dans `src/lib/shop-price.ts` :

- 4 listes au choix, **même langue**, même prix catalogue, et seulement si c'est moins cher que la somme des prix : **10 €** (1 000 centimes).
- 1, 2 ou 3 listes : le prix catalogue de chacune.
- 8 listes : deux lots, 20 €. Au-delà d'un multiple de 4, le reste reste à 3 €.
- La part enregistrée sur chaque achat du lot est 2,50 €, pour que la somme des `user_purchases.amount_paid` soit le montant réellement payé.

`shop_packs.bundle_price` (défaut 1 600, soit 16 €) et `type = bundle` ne sont pas lus. La colonne reste en base : la supprimer demande l'accord d'Océane, puis `npx drizzle-kit push` lancé par elle. Pas d'ALTER TABLE.

## Paiement

`POST /api/shop/checkout` avec `{ packIds: string[] }`. Une seule session Stripe Checkout :

- lot complet : une ligne sur le produit Stripe « Lot de 4 packs », prix `lexia_shop_lot_4`, créé par `syncShopLotToStripe` (même principe que `syncShopPackToStripe`) ;
- listes hors lot : une ligne par liste, au prix catalogue.

Les metadata portent `userId`, `packIds`, `amounts` (centimes par liste) et `amountCents`. Un lot de 4 n'écrit pas un seul `packId`.

Le webhook `checkout.session.completed` (et `checkout.session.async_payment_succeeded` si le paiement devient payé) crée **une** ligne `user_purchases` et **une** liste `source = shop` par pack. Les identifiants sont stables (`shop:`, `shop-list:`, `shop-word:`), donc un webhook rejoué n'ajoute ni achat ni mot.

`checkout.session.expired`, `checkout.session.async_payment_failed`, ou une session dont `payment_status` n'est pas `paid` : aucune liste attribuée. Un montant qui ne colle pas aux metadata n'attribue rien non plus.

Une liste déjà possédée répond 409 avec `ownedPackIds`. L'interface retire ces listes et recalcule le total. Elle ne relance pas le paiement toute seule.

## Freemium

Chaque liste du lot est créée avec `source = shop`. Le plafond de 20 mots personnels exclut cette source (`countsTowardFreemiumPersonalWords` et les requêtes qui filtrent `lists.source`). Un lot n'entame pas les mots gratuits.

## Espace créateur

Créateur → Boutique range les packs par langue. Le résumé indique, pour chaque langue, le nombre de packs, le nombre de visibles et le nombre de masqués. Les onglets sont Toutes, Anglais, Allemand, Espagnol et Italien (drapeau et code depuis `src/lib/language.ts`). Une autre langue déjà en base s'ajoute après. L'onglet d'une langue affiche « 12 / 16 visibles » : visibles, puis packs de cette langue. Les visibles sont listés avant les masqués.

« Tout sélectionner », « Rendre visible » et « Masquer » ne portent que sur l'onglet affiché. Le PATCH `/api/creator/shop` est inchangé.

## Essai en mode test Stripe

La base pointée par `.env.local` est la production : ne pas y écrire pour un essai local. Stripe : clé `sk_test` uniquement.

1. Activer 4 packs de la même langue (Creator, ou les packs déjà en base) **sur une base qui n'est pas la production**, avec un prix de 300 centimes. L'activation synchronise le prix Stripe du pack ; le prix du lot est créé au premier paiement de lot.
2. `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
3. Compte élève, `/app/shop`. Choisir 4 listes. La barre affiche 12 € barré, 10 €, et « 4 packs = 10 € ». Payer.
4. Carte de test `4242 4242 4242 4242`, date future, CVC quelconque.
5. Vérifier 4 lignes `user_purchases` (250 centimes chacune, même `stripe_session_id`) et 4 listes `source = shop`. Le compteur de mots gratuits ne bouge pas.
6. Annuler le Checkout : revenir avec `?canceled=true`, aucune ligne nouvelle.
7. Renvoyer le même événement depuis le dashboard Stripe : pas de seconde ligne par pack.
