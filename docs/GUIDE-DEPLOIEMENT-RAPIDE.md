# Déployer Lexia sur Vercel – Guide pas à pas

Suis ces étapes dans l’ordre pour mettre Lexia en ligne et le partager à tes amis.

---

## Étape 1 : Pousser le code sur GitHub

1. Si ce n’est pas déjà fait, crée un dépôt sur [github.com](https://github.com) (ex. `lexia`).
2. Dans le dossier de ton projet, ouvre un terminal et exécute :

```bash
cd /chemin/vers/projet-vocab   # ton dossier Lexia
npm install                     # installe @libsql/client
git add -A
git commit -m "Prêt pour Vercel"
git remote add origin https://github.com/TON_USERNAME/lexia.git   # adapte l’URL
git push -u origin main
```

---

## Étape 2 : Créer la base de données Turso (gratuit)

1. Va sur **[turso.tech](https://turso.tech)** → **Sign up** (avec GitHub c’est rapide).
2. Installe le CLI Turso sur ton Mac :

```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

Ferme et rouvre le terminal si besoin.

3. Connecte-toi :

```bash
turso auth login
```

(Ouvre le lien dans le navigateur et valide.)

4. Crée une base :

```bash
turso db create lexia --region fra
```

5. Récupère l’URL et le token (garde-les pour plus tard) :

```bash
turso db show lexia --url
turso db tokens create lexia
```

Tu obtiens par exemple :
- **URL** : `https://lexia-TON_USER.turso.io`
- **Token** : une longue chaîne de caractères

6. Applique le schéma à la base. Lance :

```bash
turso db shell lexia
```

Dans le shell qui s’ouvre, colle **tout** le contenu du fichier **`scripts/turso-init.sql`** (dans ton projet), puis valide. Ensuite tape `.exit` pour quitter.

(Si tu n’as pas ce fichier, utilise les instructions de la section « Migrations » dans `DEPLOIEMENT-VERCEL.md`.)

---

## Étape 3 : Créer le projet sur Vercel

1. Va sur **[vercel.com](https://vercel.com)** → **Sign up** (avec GitHub).
2. **Add New…** → **Project**.
3. Importe le dépôt **lexia** (ou le nom de ton repo).
4. Ne change pas les réglages de build (framework = Next.js, build = `npm run build`).

---

## Étape 4 : Ajouter les variables d’environnement

Avant de lancer le déploiement, dans le projet Vercel :

1. Ouvre **Settings** → **Environment Variables**.
2. Ajoute **chaque** variable ci-dessous (Production et Preview si tu veux que les préviews marchent aussi) :

| Name | Value |
|------|--------|
| `TURSO_DATABASE_URL` | L’URL Turso (ex. `https://lexia-xxx.turso.io`) |
| `TURSO_AUTH_TOKEN` | Le token Turso |
| `AUTH_SECRET` | Une clé secrète : dans le terminal lance `openssl rand -base64 32` et colle le résultat |
| `NEXTAUTH_URL` | L’URL de ton site. Pour le 1er déploiement mets `https://ton-projet.vercel.app` (remplace par le nom réel de ton projet Vercel) |
| `SEED_SECRET` | Un secret de ton choix (ex. une autre chaîne aléatoire). Servira à créer le compte test une fois après le déploiement. |

3. Sauvegarde (Save).

---

## Étape 5 : Déployer

1. Va dans l’onglet **Deployments**.
2. Clique sur **Redeploy** (ou fais un nouveau **Deploy** si c’est la première fois).
3. Attends la fin du build (1–2 min).
4. Clique sur **Visit** pour ouvrir ton site.

---

## Étape 5bis : Créer le compte test (optionnel)

Pour te connecter avec le compte test **test@test.com** / **test1234** sur le site déployé :

1. Avec **curl** (remplace `TON_URL` et `TON_SEED_SECRET`) :
   ```bash
   curl -X POST https://TON_URL/api/seed-test-user \
     -H "Content-Type: application/json" \
     -d '{"secret":"TON_SEED_SECRET"}'
   ```
2. Ou ouvre dans le navigateur une console (F12 → Console) sur ton site et exécute :
   ```javascript
   fetch("/api/seed-test-user", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ secret: "TON_SEED_SECRET" })
   }).then(r => r.json()).then(console.log);
   ```
   (remplace `TON_SEED_SECRET` par la valeur de la variable `SEED_SECRET` dans Vercel.)

3. Si la réponse affiche `ok: true`, le compte test est créé. Tu peux ensuite te connecter avec **test@test.com** et le mot de passe **test1234**.

---

## Étape 6 : Tester et partager

1. Ouvre l’URL (ex. `https://lexia-xxx.vercel.app`).
2. Clique sur **Se connecter**. Tu peux soit **t’inscrire** (créer un nouveau compte), soit utiliser le compte test **test@test.com** / **test1234** si tu as fait l’étape 5bis.
3. Une fois connecté, tu peux créer des familles, des listes, faire des révisions et voir la Synthèse.
4. Envoie simplement le lien à tes amis pour qu’ils puissent s’inscrire et tester.

---

## En résumé

| Étape | Où | Action |
|-------|-----|--------|
| 1 | GitHub | Push du code |
| 2 | Turso | Compte + `turso db create lexia` + URL + token + exécuter le SQL d’init |
| 3 | Vercel | Nouveau projet lié au repo GitHub |
| 4 | Vercel | 5 variables d’environnement (Turso + AUTH_SECRET + NEXTAUTH_URL + SEED_SECRET) |
| 5 | Vercel | Deploy |
| 5bis | Navigateur ou curl | Appel POST /api/seed-test-user avec le secret pour créer le compte test |
| 6 | Navigateur | Connexion (test@test.com / test1234 ou inscription) et partage du lien |

Si une étape bloque, reviens à ce guide ou à `DEPLOIEMENT-VERCEL.md` pour plus de détails.
