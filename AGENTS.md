# Lexiva : règles pour les agents

## Projet
Lexiva est une app web de vocabulaire scolaire (élèves du collège à la prépa), créée par Océane, fondatrice solo. Production : lexiva.vercel.app.
Stack : Next.js (App Router), TypeScript strict, Tailwind, Turso/LibSQL, Drizzle ORM (schéma dans src/lib/db/schema.ts), auth maison JWT (cookie auth-token, getUser() dans src/lib/auth.ts), Resend, Stripe.

## Périmètre actuel
Interface élève et Creator Dashboard uniquement. Ne touche pas au mode professeur (src/app/(app)/app/professeur) sauf demande explicite.

## Offre et abonnement
- Aucune version gratuite.
- Tarifs (source unique : `src/lib/offer.ts` — ne jamais écrire un prix ou une durée en dur ailleurs) : 5 € par mois sans engagement, ou 45 € par an (3,75 €/mois, message « 3 mois offerts »), essai de 15 jours avec carte bancaire requise.
- Paywall : `PAYWALL_ENABLED=true` l’active ; si absent, il est éteint. Un élève sans abonnement actif ni essai voit sa bibliothèque mais est redirigé vers `/app/abonnement` pour toute action d’ajout ou de révision. Les rôles `creator` et `professeur` sont exemptés.

## Design system (immuable)
- Couleurs : violet #6C3FC8, or #F5A623, vert #1D9E75, fond #F8F7FF. Pas de gris ni de couleurs hors palette (pas de slate Tailwind).
- Police DM Sans uniquement, graisses 400 et 500 (pas de 600, 700 ni gras).
- Pas de mode sombre ; ne pas en ajouter.
- Bouton d’action principal : fond #6C3FC8, texte blanc, rayon 20 px. L’or #F5A623 sert aux accents (badges, séries, récompenses), pas aux boutons principaux.
- Cartes : rayon 12 à 16 px.
- Icônes : lucide-react. Icône Mots Sauvages : `PawPrint`, jamais un emoji.
- Zones tactiles d’au moins 44 px.

## Nommage interface
- La section de révision s’appelle « Révision » dans l’interface.

## Règles non négociables
- Vérifie avec `npx tsc --noEmit` après chaque modification TypeScript, et corrige avant de présenter ton travail.
- Schéma de base de données : modifie uniquement `src/lib/db/schema.ts`. N’exécute jamais drizzle-kit push, ne fais jamais d’ALTER TABLE manuel, et signale dans la pull request que le push du schéma est à faire par Océane. Aucune modification de schéma sans accord explicite d’Océane.
- N’écris jamais dans la base de production. Ne touche jamais aux fichiers `.env*`.
- Stripe : clés de test uniquement (`sk_test`). Jamais de clé live.
- Chaque route API vérifie l’utilisateur avec `getUser()` (sauf auth, health et webhook Stripe).
- Ne modifie pas `package-lock.json` sauf si tu ajoutes une dépendance. Ne lance pas `npm audit fix`.
- Ne déploie pas (pas de `vercel --prod`), ne pousse jamais sur main.

## Langue
- Interface élève (landing, inscription, connexion, app, e-mails aux élèves) : français, tutoiement partout.
- Interface professeur et e-mails professeur, pages légales (CGV, mentions légales, confidentialité) : français, vouvoiement.
- Code (variables, fonctions, composants) : anglais.
- Messages de commit et descriptions de pull request : français.

## Façon de travailler
- Une tâche = une branche = une pull request.
- La description de la pull request indique : ce qui a changé, le résultat de tsc, ce qu’Océane doit tester, et les points non vérifiés.
- En cas de doute sur un choix produit ou de prix, pose la question au lieu de décider.
