# Déployer Lexia sur Vercel

Sur Vercel, le système de fichiers est éphémère : un SQLite en fichier local ne convient pas. Il faut utiliser **Turso** (SQLite hébergé, gratuit) pour la base de données.

## 1. Créer une base Turso (gratuit)

1. Va sur [turso.tech](https://turso.tech) et crée un compte.
2. Installe le CLI Turso :  
   `curl -sSfL https://get.tur.so/install.sh | bash`
3. Connecte-toi : `turso auth login`
4. Crée une base :  
   `turso db create lexia --region fra` (ou une autre région)
5. Récupère l’URL et le token :  
   `turso db show lexia --url`  
   `turso db tokens create lexia`
6. Applique le schéma sur Turso (migrations) :  
   - Dans ton projet, crée un fichier `.env.local` avec :
     ```
     TURSO_DATABASE_URL=https://lexia-xxx.turso.io
     TURSO_AUTH_TOKEN=ton_token_ici
     ```
   - Puis exécute les migrations (avec Drizzle en dialect Turso, voir ci-dessous) ou exécute à la main le SQL des fichiers dans `drizzle/*.sql` dans la console Turso (`turso db shell lexia`).

## 2. Variables d’environnement sur Vercel

Dans le projet Vercel : **Settings → Environment Variables**, ajoute :

| Variable | Valeur | Environnement |
|----------|--------|---------------|
| `TURSO_DATABASE_URL` | L’URL de ta base Turso | Production, Preview |
| `TURSO_AUTH_TOKEN` | Le token Turso | Production, Preview |
| `AUTH_SECRET` | Une chaîne aléatoire (ex. `openssl rand -base64 32`) | Production, Preview |
| `NEXTAUTH_URL` | L’URL de ton app (ex. `https://lexia.vercel.app`) | Production |

Sans `AUTH_SECRET` et `NEXTAUTH_URL`, NextAuth ne fonctionnera pas correctement en production.

## 3. Déployer le projet

1. Pousse le code sur GitHub (ou GitLab / Bitbucket).
2. Sur [vercel.com](https://vercel.com), **Add New Project** et importe le dépôt.
3. Vercel détecte Next.js ; ne change rien au build (`npm run build`).
4. Ajoute les variables d’environnement ci-dessus, puis **Deploy**.

Après le déploiement, ouvre l’URL fournie (ex. `https://lexia-xxx.vercel.app`). Crée un compte via Inscription pour tester.

## 4. Migrations vers Turso (schéma à jour)

Pour appliquer les migrations SQL existantes sur Turso :

- Soit exécuter le contenu des fichiers `drizzle/0000_*.sql`, `0001_*.sql`, etc. dans `turso db shell lexia`.
- Soit configurer Drizzle pour Turso dans `drizzle.config.ts` (dialect `turso`, `dbCredentials` avec `url` et `authToken`) et lancer `npx drizzle-kit push` en ayant défini `TURSO_DATABASE_URL` et `TURSO_AUTH_TOKEN` dans ton `.env.local`.

En local, sans variables Turso, l’app continue d’utiliser le fichier `vocab.db` (SQLite local).
