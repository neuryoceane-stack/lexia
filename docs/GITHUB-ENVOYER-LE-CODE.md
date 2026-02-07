# Envoyer le projet Lexia sur GitHub

Suis ces étapes **dans l’ordre**. Tout se fait depuis le terminal (ou Cursor) et le site github.com.

---

## Étape 1 : Créer un dépôt sur GitHub

1. Ouvre **[github.com](https://github.com)** et connecte-toi (ou crée un compte).
2. Clique sur le **+** en haut à droite → **New repository**.
3. Remplis :
   - **Repository name** : par exemple `lexia` ou `projet-vocab`.
   - **Public**.
   - Ne coche **pas** "Add a README" (le projet en a déjà un).
4. Clique sur **Create repository**.

Tu arrives sur une page avec une URL du type :  
`https://github.com/TON_USERNAME/lexia.git`  
**Garde cette URL** pour l’étape 3.

---

## Étape 2 : Ouvrir le terminal dans le projet

Ouvre un terminal **dans le dossier du projet** (celui qui contient `package.json`).

Sous Cursor : **Terminal → New Terminal** (le terminal est déjà dans le bon dossier si tu as ouvert le dossier du projet).

---

## Étape 3 : Lier le projet à GitHub et envoyer le code

Copie ces commandes **une par une** en remplaçant par tes infos :

**A. Lier ton projet au dépôt GitHub**  
(Remplace `TON_USERNAME` et `lexia` par ton pseudo GitHub et le nom du repo.)

```bash
git remote add origin https://github.com/TON_USERNAME/lexia.git
```

**B. Envoyer le code sur GitHub**

```bash
git push -u origin main
```

Si Git te demande de te connecter :
- Avec **HTTPS** : GitHub peut demander un **Personal Access Token** au lieu du mot de passe.  
  → Va sur GitHub : **Settings → Developer settings → Personal access tokens**, crée un token et utilise-le comme mot de passe.
- Ou utilise **GitHub en ligne de commande** : [cli.github.com](https://cli.github.com) puis `gh auth login`.

---

## Vérifier que c’est en ligne

Rafraîchis la page de ton dépôt sur github.com. Tu dois voir tous les fichiers du projet (dossier `src`, `docs`, `package.json`, etc.).

---

## En résumé

| Étape | Où | Action |
|-------|-----|--------|
| 1 | github.com | New repository → nom (ex. `lexia`) → Create |
| 2 | Terminal | Être dans le dossier du projet |
| 3 | Terminal | `git remote add origin https://github.com/TON_USERNAME/lexia.git` puis `git push -u origin main` |

Une fois le code sur GitHub, tu pourras connecter Vercel à ce dépôt pour héberger le site (voir `GUIDE-DEPLOIEMENT-RAPIDE.md`).
