# Lexiva : règles pour les agents

## Projet
Lexiva est une app web de vocabulaire scolaire (élèves du collège à la prépa), créée par Océane, fondatrice solo. Production : lexiva.vercel.app.
Stack : Next.js (App Router), TypeScript strict, Tailwind, Turso/LibSQL, Drizzle ORM (schéma dans src/lib/db/schema.ts), auth maison JWT (cookie auth-token, getUser() dans src/lib/auth.ts), Resend, Stripe.

## Périmètre actuel
Interface élève et Creator Dashboard uniquement. Ne touche pas au mode professeur (src/app/(app)/app/professeur) sauf demande explicite.

## Design system (immuable)
Violet #6C3FC8, or #F5A623, vert #1D9E75, fond #F8F7FF. Police DM Sans uniquement (graisses 400 et 500). Cartes : arrondi 12 à 16 px. Boutons CTA : arrondi 20 px, fond #6C3FC8, texte blanc. Icônes : lucide-react.

## Règles non négociables
- Vérifie avec npx tsc --noEmit après chaque modification TypeScript, et corrige avant de présenter ton travail.
- Schéma de base de données : modifie uniquement src/lib/db/schema.ts. N'exécute jamais drizzle-kit push, ne fais jamais d'ALTER TABLE manuel, et signale dans la pull request que le push du schéma est à faire par Océane.
- N'écris jamais dans la base de production. Ne touche jamais aux fichiers .env*.
- Stripe : clés de test uniquement (sk_test). Jamais de clé live.
- Chaque route API vérifie l'utilisateur avec getUser() (sauf auth, health et webhook Stripe).
- Ne modifie pas package-lock.json sauf si tu ajoutes une dépendance. Ne lance pas npm audit fix.
- Ne déploie pas (pas de vercel --prod), ne pousse jamais sur main.

## Langue
- Interface utilisateur : français, vouvoiement systématique.
- Code (variables, fonctions, composants) : anglais.
- Messages de commit et descriptions de pull request : français.

## Façon de travailler
- Une tâche = une branche = une pull request.
- La description de la pull request indique : ce qui a changé, le résultat de tsc, ce qu'Océane doit tester, et les points non vérifiés.
- En cas de doute sur un choix produit ou de prix, pose la question au lieu de décider.