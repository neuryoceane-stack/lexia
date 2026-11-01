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

## Design system
L’identité se pose par étapes. **D1** centralise les couleurs et les polices (variables CSS, thème Tailwind, `next/font`). **D2** applique la charte écran par écran : surligneur, états juste / faux, rayons, boutons en pilule, pastilles de langue. Jusque-là, l’or `#F5A623` et le vert `#1D9E75` historiques restent en place. Ne pas inventer un hex hors de cette charte, ni hors de ces deux restes.

- Fond de page `#F7F9F6` (`--page`). Surface des cartes `#FFFFFF` (`--surface`).
- Encre `#12332B` (`--ink`) : texte, boutons principaux, bordures actives. Bouton principal : fond encre, texte blanc.
- Texte secondaire `#4F615B` (`--muted`). Bordure de carte `#BFCBE3` (`--line`).
- Surligneur `#F3E96B` (`--mark`) : mots-clés, onglet actif, progression, série. Toujours sous un texte foncé, jamais derrière du texte blanc.
- Juste : fond `#E3F3EA` (`--just-bg`), texte `#17603B` (`--just-text`), signe `#1F7A4D` (`--just-sign`). Faux : fond `#FBE9E7` (`--false-bg`), texte `#9C1F18` (`--false-text`), signe `#B3261E` (`--false-sign`). Toujours avec une icône et un mot, jamais la couleur seule.
- Titres : Bricolage Grotesque 700 (`--font-heading`). Texte : DM Sans 400 et 500 (`--font-sans`). Les deux sont chargées dans `src/app/layout.tsx` avec `next/font`.
- Cartes : rayon 14 à 20. Boutons en pilule (rayon égal à la moitié de la hauteur), 44 px minimum. Pastilles de langue : bordure encre 1,5 px, rayon 8. Ces formes se généralisent en D2.
- Pas de mode sombre. Ne pas en ajouter.
- Icônes : lucide-react. Icône Mots Sauvages : `PawPrint`, jamais un emoji.
- Source unique des hex : `src/app/globals.css` et `src/lib/design-tokens.ts` (e-mails et manifeste, mêmes valeurs). Ne pas réécrire un hex de la charte dans un écran.

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
