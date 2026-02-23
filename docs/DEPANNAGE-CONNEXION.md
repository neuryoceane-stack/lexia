# Dépannage : "Connection failed" / Erreur -102

## Diagnostic rapide

1. **Vérifier que le serveur tourne** (dans le terminal) :
   ```bash
   npm run dev
   ```
   Vous devez voir : `✓ Ready` et `Local: http://localhost:3000`

2. **Tester depuis le terminal** :
   ```bash
   curl http://localhost:3000
   ```
   Si vous voyez du HTML → le serveur répond. Le problème vient du navigateur.

3. **Tester l’API santé** :
   ```bash
   curl http://localhost:3000/api/health
   ```
   Réponse attendue : `{"ok":true,"db":"...","message":"Connexion OK"}`

---

## Si le navigateur ne se connecte pas

### Essayer ces URLs
- http://localhost:3000
- http://127.0.0.1:3000
- http://[::1]:3000

### Vérifications
- **VPN** : désactiver temporairement
- **Antivirus / pare-feu** : autoriser Node.js ou le port 3000
- **Autre navigateur** : Chrome, Firefox, Safari
- **Navigation privée** : pour éviter extensions ou cache

### Environnement distant (Cursor, Codespaces, etc.)
Si vous travaillez sur une machine distante, `localhost` dans votre navigateur pointe vers votre PC, pas vers le serveur distant.

**Solution : tunnel ngrok**
```bash
# Installer ngrok : https://ngrok.com/download
npx ngrok http 3000
```
ngrok affiche une URL publique (ex. `https://abc123.ngrok.io`) que vous pouvez ouvrir dans votre navigateur.

---

## Si la base de données échoue

Si `/api/health` renvoie une erreur :

- **Turso** : vérifier `TURSO_DATABASE_URL` et `TURSO_AUTH_TOKEN` dans `.env.local`
- **Dev local** : supprimer ou commenter ces variables pour utiliser `vocab.db` (SQLite local)
