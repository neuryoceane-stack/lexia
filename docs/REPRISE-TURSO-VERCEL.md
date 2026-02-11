# Où nous en sommes – Lexia (reprise)

Dernière mise à jour : avant la pause.

---

## Ce qui est fait

- **Code** : à jour sur GitHub (neuryoceane-stack/lexia).
- **Site en ligne** : déployé sur Vercel, accessible (URL type `https://lexia-oceanes-projects-5b564416.vercel.app`).
- **Turso** : base **lexia** créée (compte neuryoceane-stack, région AWS EU West).
- **Variables Vercel** : à vérifier/ajouter (voir ci‑dessous).

---

## À faire à la prochaine session (pour que le site marche avec la base et le compte test)

### 1. Schéma SQL sur Turso
- Turso → base **lexia** → **SQL Console**.
- Copier tout le contenu de **`scripts/turso-init.sql`** (dans le projet).
- Coller dans la SQL Console → **Run** / Execute.

### 2. Token Turso
- Sur la page Overview de la base **lexia** : clic sur **+ Create Token**.
- Copier le token et le garder (pour Vercel).

### 3. Variables d’environnement Vercel
- Vercel → projet lexia → **Settings** → **Environment Variables**.
- Vérifier / ajouter :
  - **TURSO_DATABASE_URL** = `https://lexia-neuryoceane-stack.aws-eu-west-1.turso.io`
  - **TURSO_AUTH_TOKEN** = le token créé à l’étape 2
  - **AUTH_SECRET** = une clé secrète (ex. `openssl rand -base64 32`)
  - **NEXTAUTH_URL** = l’URL du site (ex. `https://lexia-oceanes-projects-5b564416.vercel.app`)
  - **SEED_SECRET** = un secret de ton choix (pour créer le compte test)
- Puis **Redeploy** (Deployments → … → Redeploy).

### 4. Créer le compte test
- Une fois le redeploy terminé : ouvrir le site → **F12** → **Console**.
- Exécuter (en remplaçant `TA_VALEUR_SEED_SECRET` par la valeur de SEED_SECRET dans Vercel) :
```javascript
fetch("/api/seed-test-user", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ secret: "TA_VALEUR_SEED_SECRET" })
}).then(r => r.json()).then(console.log);
```
- Si la réponse affiche `ok: true`, se connecter avec **test@test.com** / **test1234**.

---

Quand tu reviendras, dis : « Où en sommes-nous ? » et on reprendra à partir de ce fichier.
