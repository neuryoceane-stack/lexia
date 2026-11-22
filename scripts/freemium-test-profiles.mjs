/**
 * Crée 5 profils élève de test pour le freemium (base locale uniquement).
 *
 * Prérequis :
 *   FREEMIUM_ENABLED=true npm run dev -- --hostname 127.0.0.1 --port 3000
 *   node scripts/freemium-test-profiles.mjs
 *
 * Le script refuse Turso / hors localhost. Ne lancez jamais contre la production.
 * Supprimer après tests : les comptes sont listés à la fin (emails + mot de passe).
 */

const baseUrl = process.env.FREEMIUM_TEST_BASE_URL ?? "http://127.0.0.1:3000";
const password = "FreemiumTest1";

function abort(message) {
  console.error(message);
  process.exit(1);
}

function assertLoopback() {
  let url;
  try {
    url = new URL(baseUrl);
  } catch {
    abort(`Adresse illisible : ${baseUrl}`);
  }
  if (url.hostname !== "127.0.0.1" && url.hostname !== "localhost") {
    abort("Ce script ne s'exécute qu'en local (127.0.0.1 ou localhost).");
  }
  if (process.env.TURSO_DATABASE_URL) {
    abort("Retirez TURSO_DATABASE_URL de l'environnement avant de lancer ce script.");
  }
}

assertLoopback();

const stamp = Date.now().toString(36);

const profiles = [
  {
    key: "gratuit-sous-20",
    email: `freemium-light-${stamp}@example.test`,
    note: "15 mots personnels",
    wordCount: 15,
  },
  {
    key: "gratuit-35",
    email: `freemium-cap-${stamp}@example.test`,
    note: "35 mots → 20 actifs + 15 verrouillés",
    wordCount: 35,
  },
  {
    key: "abonne",
    email: `freemium-sub-${stamp}@example.test`,
    note: "Abonné actif (promo test si TEST_ACCESS_CODE configuré)",
    subscriptionStatus: "active",
    wordCount: 25,
  },
  {
    key: "classe",
    email: `freemium-class-${stamp}@example.test`,
    note: "À accepter dans une classe manuellement après création",
    wordCount: 30,
  },
  {
    key: "liste-shop",
    email: `freemium-shop-${stamp}@example.test`,
    note: "Liste source shop simulée via API (nécessite super-user SQL si pas d'achat)",
    wordCount: 10,
    shopList: true,
  },
];

async function register(email) {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      firstName: "Test",
      lastName: "Freemium",
      birthDate: "2008-01-15",
      role: "etudiant",
      weekly_goal: 10,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? `Inscription ${email} impossible (${res.status})`);
  }
  return data.userId;
}

async function login(email) {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Connexion ${email} impossible`);
  const cookies =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [];
  return cookies.map((c) => c.split(";")[0]).join("; ");
}

async function createList(cookie, name) {
  const res = await fetch(`${baseUrl}/api/listes`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ name, source: "manual", language: "eng" }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Création de liste impossible");
  return data.id;
}

async function bulkWords(cookie, listId, count) {
  const words = Array.from({ length: count }, (_, i) => ({
    term: `mot-${i + 1}`,
    definition: `traduction ${i + 1}`,
  }));
  const res = await fetch(`${baseUrl}/api/listes/${listId}/mots/bulk`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ words }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 402) {
    throw new Error(data.error ?? `Import bulk impossible (${res.status})`);
  }
  return data;
}

async function main() {
  console.log("Création des profils freemium (local)…\n");
  const summary = [];

  for (const profile of profiles) {
    try {
      await register(profile.email);
      const cookie = await login(profile.email);
      const listId = await createList(cookie, `Liste ${profile.key}`);
      const bulk = await bulkWords(cookie, listId, profile.wordCount);
      summary.push({
        ...profile,
        password,
        listId,
        imported: bulk.count ?? profile.wordCount,
        bulkMessage: bulk.message ?? null,
      });
      if (profile.subscriptionStatus === "active") {
        console.warn(
          `  [${profile.key}] Pour simuler l'abonnement : définir subscription_status=active sur ${profile.email} (TEST_ACCESS_CODE à l'inscription ou SQL local).`
        );
      }
      if (profile.shopList) {
        console.warn(
          `  [${profile.key}] Liste shop : passer source=shop sur la liste en SQL local, ou acheter un pack en test.`
        );
      }
      if (profile.key === "classe") {
        console.warn(
          `  [${profile.key}] Joignez une classe avec ce compte et faites accepter le membre.`
        );
      }
    } catch (error) {
      console.error(`Échec ${profile.key}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log("\n--- Comptes créés ---\n");
  for (const row of summary) {
    console.log(`${row.key}`);
    console.log(`  email     : ${row.email}`);
    console.log(`  password  : ${row.password}`);
    console.log(`  liste     : ${row.listId}`);
    console.log(`  mots      : ${row.imported} (${row.note})`);
    if (row.bulkMessage) console.log(`  message   : ${row.bulkMessage}`);
    console.log("");
  }
  console.log(
    "Suppression : effacez les lignes users (cascade) pour ces emails en base locale, ou supprimez le fichier SQLite de dev."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});