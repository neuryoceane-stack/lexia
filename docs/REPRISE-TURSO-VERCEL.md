# Où nous en sommes – Lexia (reprise)

Dernière mise à jour : setup production Turso + Vercel **terminé**.

---

## Setup production : terminé

- **Site en ligne :** https://lexia-two.vercel.app
- **Turso :** base **lexia** (neuryoceane-stack, AWS EU West), schéma exécuté, token configuré.
- **Vercel :** variables d’environnement configurées (TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, AUTH_SECRET, NEXTAUTH_URL, SEED_SECRET), redeploy effectué.
- **Compte test créé :** connexion avec **test@test.com** / **test1234** validée.

---

## Référence (pour un autre env ou rappel)

### Variables Vercel utilisées
- **TURSO_DATABASE_URL** = `https://lexia-neuryoceane-stack.aws-eu-west-1.turso.io`
- **TURSO_AUTH_TOKEN** = token Turso (Create Token sur la base lexia)
- **AUTH_SECRET** = `openssl rand -base64 32`
- **NEXTAUTH_URL** = URL du site (ex. `https://lexia-two.vercel.app`)
- **SEED_SECRET** = secret pour protéger la route de création du compte test

### Créer le compte test (une fois par env)
Après redeploy avec SEED_SECRET défini :
```bash
curl -X POST "https://lexia-two.vercel.app/api/seed-test-user" -H "Content-Type: application/json" -d '{"secret":"TA_VALEUR_SEED_SECRET"}'
```
Puis connexion : **test@test.com** / **test1234**.

### Schéma Turso
Script à exécuter dans la SQL Console Turso (base lexia) : **`scripts/turso-init.sql`**.
