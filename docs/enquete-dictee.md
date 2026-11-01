# Enquête B1 — la dictée n’enregistre pas au clic sur « Mot suivant »

Enquête en lecture seule. Aucun correctif n’est appliqué dans cette branche : la correction proposée est seulement citée plus bas.

## Symptôme

Dans Révision, mode Dictée, une bonne réponse affiche « Bonne réponse ! » puis « Mot suivant ». Le clic ne fait pas avancer la session : le compteur « bons » reste à 0 et la barre de progression ne bouge pas.

Le compteur et la barre sont un état local. Ils ne sont pas relus en base. Ils ne changent que si `POST /api/revision` répond 2xx.

## Chemin du clic

1. Le bouton « Mot suivant » appelle `recordDicteeCompletion(3)` au premier essai réussi, ou `2` si l’élève a d’abord cliqué « Réessayer ». « Continuer » après une réponse révélée envoie `0`.
   Fichier : `src/app/(app)/app/revision/revision-client.tsx`, lignes 1763-1768 et 441-488.
2. La fonction envoie `POST /api/revision` avec le corps `{ wordId, rating }`. Le cookie d’auth n’est pas renommé : il s’appelle toujours `auth-token` (`src/lib/auth.ts`).
3. `POST` dans `src/app/api/revision/route.ts` (ligne 162) :
   - `getUser()` ; 401 si absent ;
   - `paywallDenial(user)` (ligne 167) ; 402 si l’élève est bloqué ;
   - `rating` accepté de 0 à 3 (ligne 208) ; la dictée n’envoie pas `lexivaFlash` ;
   - le mot doit appartenir à une famille de cet utilisateur, sinon 404 ;
   - dernière ligne `revisions` lue (`ease_factor`, `interval`, `repetitions`) ;
   - `computeSM2` dans `src/lib/sm2.ts` (ligne 24) : en dessous de 2, répétitions remises à 0 et prochaine révision dans 10 minutes ; à partir de 2, facteur de facilité puis intervalle 1 jour, puis 3 jours, puis intervalle × facteur ;
   - `INSERT` dans `revisions` (ligne 279) : `id`, `word_id`, `user_id`, `success`, `next_review_at`, `ease_factor`, `interval`, `repetitions`, `rating`, `created_at`.
4. Côté client, seulement si `res.ok` : `wordsRetained` passe à +1 (le « bons », ligne 477), le mot quitte la file (ligne 479), la barre recalcule `sessionTotalWords - words.length` (lignes 1330-1338). Sinon la fonction pose la bannière `data.error` ou « Erreur enregistrement » et s’arrête. `sending` repasse à faux. Le même mot reste affiché, phase « Bonne réponse ! ».

Le schéma Drizzle nomme déjà les colonnes en snake_case. Le nom JavaScript `easeFactor` correspond à la colonne `ease_factor` (`src/lib/db/schema.ts`, lignes 94-115). Un insert libSQL de test écrit bien `word_id`, `ease_factor`, `interval`, `repetitions`, `rating`, `created_at`, `next_review_at`. Il n’y a pas de décalage camelCase / snake_case dans le code actuel.

`scripts/turso-init.sql` crée `revisions` sans les colonnes SM-2. Elles sont ajoutées par `drizzle/0005_add_sm2_columns.sql` :

```sql
ALTER TABLE `revisions` ADD COLUMN `ease_factor` real DEFAULT 2.5;
ALTER TABLE `revisions` ADD COLUMN `interval` integer DEFAULT 1;
ALTER TABLE `revisions` ADD COLUMN `repetitions` integer DEFAULT 0;
ALTER TABLE `revisions` ADD COLUMN `rating` integer;
```

`src/lib/db/migrations.ts` aligne au démarrage les tables `users`, `user_profiles` et les classes. Il n’applique pas `0005`. La route de dictée n’appelle pas non plus `ensureClassTables()`.

## Ce que les PR 9 à 13 ont changé sur ce chemin

Comparaison `63b5da5` (main avant la PR 9) → `origin/main` (PR 13 incluse).

| Fichier du chemin | Modifié |
| --- | --- |
| `revision-client.tsx` : `recordDicteeCompletion`, corps `{ wordId, rating }`, compteur, barre | Non. Le diff est visuel (couleurs, classes). |
| `src/app/api/revision/route.ts` | Non |
| `src/lib/sm2.ts` | Non |
| `src/lib/db/schema.ts` | Non |
| `src/lib/auth.ts`, cookie `auth-token` | Non |
| `src/lib/paywall.ts` | Non (en place depuis la PR 3) |

La PR 13 (« Renomme le produit visible en Kim Study ») ne touche pas la révision. `src/lib/brand.ts` dit explicitement de ne pas renommer le dépôt, les domaines, les cookies ni les clés de stockage. `lexivaFlash` est inchangé. Aucun import du chemin dictée n’est cassé.

Le seul changement de comportement autour de l’écran est la barre basse du téléphone, PR 10 : `src/components/app-header.tsx` ligne 555, `fixed … z-30`, hauteur 76 px, masquée dès `md`. La session dictée est `fixed inset-0 z-20` (ligne 1384) et réserve 56 px en bas (ligne 1472), pas 76. Les flashcards restent dans le flux de `<main>`, qui a `pb-40` (160 px) sous `md` (`src/app/(app)/layout.tsx` ligne 42), donc leurs boutons passent au-dessus de la barre.

## Reproduction

Base SQLite locale, schéma Drizzle complet, élève sans paywall (`PAYWALL_ENABLED` absent).

**Schéma complet.** Dictée, « apple » → « pomme » → Valider → clic réel au centre de « Mot suivant ».

- Ordinateur 1280×800 et téléphone 390×844 : le clic touche le bouton (`elementFromPoint` retombe sur le bouton).
- `POST /api/revision` répond 200.
- Le compteur passe de 0 à 1, le mot suivant s’affiche, la barre avance.
- La ligne insérée contient `success=1`, `ease_factor=2.6`, `interval=1`, `repetitions=1`, `rating=3`.
- Sur le téléphone, le bouton est vers y = 248 px. La barre basse commence à y = 768 px. Elle ne le recouvre pas sur cet écran.

**Colonne `ease_factor` retirée**, le reste du schéma identique. Même parcours.

- `POST /api/revision` répond 500, corps vide.
- Journal : `SqliteError: no such column: "ease_factor"`.
- L’écran reste sur « Bonne réponse ! » / « Mot suivant ». Compteur « 0 bons ». Barre toujours « 1 / 2 mots ».
- Une bannière « Erreur enregistrement » apparaît au-dessus de Quitter.
- `GET /api/revision?all=1` répond encore 200 : la session s’ouvre. `GET /api/bibliotheque` répond 500 sur la même colonne, et le sélecteur de listes affiche « Impossible de charger tes listes. »

Ce second cas est le seul qui reproduit le symptôme décrit.

## Cause probable

L’insert SM-2 échoue parce que la table `revisions` en production n’a pas les colonnes de `drizzle/0005_add_sm2_columns.sql`, en particulier `ease_factor`. La route ne rattrape pas l’exception : Next répond 500 sans JSON. Le client refuse alors d’avancer le compteur et la barre, et affiche « Erreur enregistrement ».

Ce n’est pas un renommage des PR 9 à 13. Le chemin d’enregistrement est le même qu’avant la refonte. L’écart de calendrier se comprend ainsi : ces missions sont le moment où la dictée a été retestée ; le code qui écrit `ease_factor` date du commit `ea4ead1` (SM-2), et la migration automatique ne l’a jamais ajouté.

**À confirmer avant d’appliquer quoi que ce soit.** Si le sélecteur de listes de la dictée charge bien les listes, `GET /api/bibliotheque` lit déjà `ease_factor`, donc la colonne est là et cette cause tombe. Dans ce cas, l’onglet Réseau au clic sur « Mot suivant » donne le statut du POST : c’est l’information qui manque pour départager le reste.

## Comment reproduire chez toi

1. Ouvre une dictée, réponds juste, clique « Mot suivant ».
2. Regarde la bannière rouge au-dessus de « Quitter ». « Erreur enregistrement » veut dire que le POST n’est pas 2xx.
3. Dans l’onglet Réseau, note le statut de `POST /api/revision`.
4. Sur Turso, `PRAGMA table_info(revisions);` doit lister `ease_factor`, `interval`, `repetitions` et `rating`. Ne pas lancer cette lecture depuis un agent sur la base de production.

## Hypothèses, par probabilité

1. **Haute — colonnes SM-2 absentes, POST 500.** Reproduit. Symptôme identique, bannière comprise. Contre-indication : le sélecteur de listes casse aussi, via `GET /api/bibliotheque`.
2. **Moyenne — autre réponse non 2xx du même POST** (401, 402, 404), même effet visuel, autre texte de bannière. Le paywall est peu probable : `src/app/(app)/app/revision/layout.tsx` redirige vers l’abonnement avec le même `isStudentPaywalled` avant d’afficher la session. Le 404 l’est aussi : le GET qui charge les mots et le POST vérifient la même appartenance `word_families.user_id`.
3. **Basse — la barre basse mange le clic.** Réel pour un bloc qui descend dans les 76 px du bas (paysage, très petit écran). Mesuré faux sur 390×844 et sur ordinateur : le bouton est en haut et le clic part. Les PR 9 à 13 n’ont pas déplacé le bouton vers le bas.
4. **Basse — « Rejoue tes mots ratés ».** Session bac à sable : le premier succès ne touche pas `wordsRetained` et la barre compte les mots maîtrisés deux fois de suite (`applySandboxOutcome`). Le libellé devient « maîtrisés », pas « N / N mots ». Code antérieur à la refonte.
5. **Écartée — cookie, clé de stockage, champ JSON, import, `lexivaFlash`.** Aucun de ces noms n’a changé entre la PR 8 et la PR 13 sur ce chemin.

## Correction proposée, non appliquée

D’abord le schéma, par Océane, si `PRAGMA table_info(revisions)` ne montre pas les quatre colonnes. C’est le contenu de `drizzle/0005_add_sm2_columns.sql`. Ne pas le relancer si les colonnes existent déjà : SQLite refusera l’`ALTER`.

```sql
ALTER TABLE `revisions` ADD COLUMN `ease_factor` real DEFAULT 2.5;
ALTER TABLE `revisions` ADD COLUMN `interval` integer DEFAULT 1;
ALTER TABLE `revisions` ADD COLUMN `repetitions` integer DEFAULT 0;
ALTER TABLE `revisions` ADD COLUMN `rating` integer;
```

Ensuite, pour que les bases déjà ouvertes rattrapent le même écart que `users` aujourd’hui, sans pousser un nouveau schéma Drizzle. À valider par Océane : ça exécute des `ALTER TABLE`. Fichier `src/lib/db/migrations.ts`, dans `ensureClassTables`, après `ensureUserProfilesTable()` :

```diff
 export async function ensureClassTables() {
   await ensureUsersTable();
   await ensureUserProfilesTable();
+  await ensureRevisionSm2Columns();

   await runRawSql(`
     CREATE TABLE IF NOT EXISTS classes (
```

Et la fonction, à côté de `ensureUserProfilesTable` :

```diff
+/** Colonnes SM-2 de revisions (drizzle/0005_add_sm2_columns.sql). */
+async function ensureRevisionSm2Columns(): Promise<void> {
+  await addColumnIfMissing(
+    "ALTER TABLE revisions ADD COLUMN ease_factor real DEFAULT 2.5"
+  );
+  await addColumnIfMissing(
+    "ALTER TABLE revisions ADD COLUMN interval integer DEFAULT 1"
+  );
+  await addColumnIfMissing(
+    "ALTER TABLE revisions ADD COLUMN repetitions integer DEFAULT 0"
+  );
+  await addColumnIfMissing(
+    "ALTER TABLE revisions ADD COLUMN rating integer"
+  );
+}
```

`addColumnIfMissing` ignore l’erreur « colonne déjà là ». Il faut aussi appeler `ensureRevisionSm2Columns()` au début de `POST /api/revision`, parce que aujourd’hui `ensureClassTables()` ne tourne que sur le profil, l’inscription et la vérification d’e-mail. Sans cet appel, un élève qui ne passe que par la dictée ne déclenche pas le rattrapage.

```diff
   const userId = user.id;
+  await ensureRevisionSm2Columns();

   let body: {
```

Il faudra exporter la fonction, ou l’appeler via `ensureClassTables()` si on accepte d’y embarquer aussi la création des tables de classes.

Aucun changement du bouton « Mot suivant » n’est nécessaire une fois l’insert en 200 : le compteur et la barre suivent déjà.

La barre basse reste un défaut séparé, pas la cause mesurée ici. Si on le corrige plus tard : passer la session dictée au-dessus de `z-30` et réserver au moins 76 px, plus la safe area. Ce n’est pas le diff de cette enquête.

## Points non vérifiés

- La base Turso de production n’a pas été lue. Le `PRAGMA` reste à faire par Océane.
- Pas de `tsc` : aucun fichier TypeScript n’a été modifié.
- Le mode professeur n’a pas été touché.
- Le cas « colonnes présentes et POST quand même en échec » n’a pas été observé en local : avec le schéma complet, le clic enregistre.
