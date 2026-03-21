This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Thème Lexiva (dark mode)

Les couleurs neutres utilisent des variables CSS (`--background`, `--background-card`, `--background-subtle`, `--foreground`, `--foreground-muted`, `--foreground-disabled`, `--border`, `--input-bg`, `--input-border`) définies dans les styles globaux. Les accents violet, or, vert et les états d’erreur restent explicites.

**Routes utiles :** la synthèse / jardin correspond à `src/app/(app)/app/jardin/` ; l’évaluation / révision à `src/app/(app)/app/revision/` (landing, flashcards, dictée, express, `revision-client`).

**Espace professeur :** l’accueil dashboard (`/app/professeur`) est dans `src/app/(app)/app/professeur/page.tsx` (fond `#F8F7FF`, cartes stats + bannière « classe la plus active »). Les agrégations SQL sont dans `src/lib/teacher-dashboard-stats.ts` (`getTeacherDashboardStats`). La bibliothèque de listes reste sur `/app/familles` (pas de route `/app/professeur/bibliotheque`).

**Mes classes :** `src/app/(app)/app/professeur/classes/page.tsx` (Server) + `mes-classes-view.tsx` (Client). La **création de classe** se fait dans une **modale** (`creer-classe-modal.tsx`) : boutons « Créer une classe », état vide, carte « + ». L’ancienne URL `/app/professeur/classes/nouvelle` redirige vers `?creer=1`. Données agrégées : `src/lib/teacher-classes-list-stats.ts`. Colonne optionnelle **`school_level`** sur `classes` : appliquer `scripts/migrations/002_add_class_school_level.sql` si la base existait avant ce champ. La route `/app/professeur/classes/[id]/progression` redirige vers `?tab=eleves`.

**Détail classe (prof)** : `src/app/(app)/app/professeur/classes/[id]/page.tsx` — stats et onglets Lexiva ; agrégations révisions / listes dans `src/lib/class-detail-analytics.ts`. **DELETE** `/api/classes/[id]/lists/[listId]` retire l’assignation d’une liste (bouton « Retirer »). Copie du **code d’accès** : identifiant brut (compatible `POST /api/classes/join`), affichage avec préfixe `LX-`.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
