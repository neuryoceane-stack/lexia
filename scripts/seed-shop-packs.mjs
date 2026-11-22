/**
 * Seed local / Turso : packs boutique de test (3–4 listes par langue), inactifs par défaut.
 *
 * ATTENTION : le fichier `.env.local` peut pointer vers la base Turso de production.
 * Vérifiez TURSO_DATABASE_URL avant toute exécution.
 *
 * Base locale (fichier) :
 *   node --env-file=.env.local scripts/seed-shop-packs.mjs
 *
 * Turso (base distante — explicite) :
 *   node --env-file=.env.local scripts/seed-shop-packs.mjs --allow-remote
 *
 * Supprimer les seeds :
 *   node --env-file=.env.local scripts/seed-shop-packs.mjs --remove
 *   node --env-file=.env.local scripts/seed-shop-packs.mjs --remove --allow-remote
 *
 * Les ids commencent par « seed-shop- » pour un delete ciblé.
 * Activez les listes depuis le Creator après insertion (`is_active = 0`) :
 * Boutique, cocher les packs, puis « Rendre visible ». Le PATCH existant
 * est appelé un pack à la fois (synchronisation Stripe, puis rollback si échec).
 */

import { createClient } from "@libsql/client";

const SEED_PREFIX = "seed-shop-";
const LANGS = ["eng", "deu", "spa", "ita"];

const THEMES = {
  eng: ["Voyages & transports", "Culture & médias", "Sciences & nature", "Travail & économie"],
  deu: ["Voyages & transports", "Culture & médias", "Sciences & nature", "Ville & société"],
  spa: ["Voyages & transports", "Culture & médias", "Santé & corps", "Sport & loisirs"],
  ita: ["Voyages & transports", "Food & restaurants", "Arts & patrimoine", "École & examens"],
};

function voyagesWords() {
  const vocabulary = [
    ["Airport", "Aéroport"],
    ["Boarding", "Embarquement"],
    ["Connection", "Correspondance"],
    ["Take-off", "Décollage"],
    ["Stopover", "Escale"],
    ["Luggage", "Bagage"],
    ["Passport", "Passeport"],
    ["Customs", "Douane"],
    ["Shuttle", "Navette"],
    ["Seat", "Siège"],
    ["Delay", "Retard"],
    ["Platform", "Quai"],
    ["Ticket", "Billet"],
    ["Subway", "Métro"],
    ["Highway", "Autoroute"],
    ["Detour", "Détour"],
    ["Roundabout", "Rond-point"],
    ["Toll", "Péage"],
    ["Ferry", "Ferry"],
    ["Harbor", "Port"],
    ["Suitcase", "Valise"],
    ["Booking", "Réservation"],
    ["Check-in", "Enregistrement"],
    ["Gate", "Porte d'embarquement"],
    ["Pilot", "Pilote"],
    ["Runway", "Piste"],
    ["Destination", "Destination"],
    ["Departure", "Départ"],
    ["Arrival", "Arrivée"],
    ["Map", "Carte"],
    ["Itinerary", "Itinéraire"],
    ["Border", "Frontière"],
    ["Visa", "Visa"],
    ["Currency", "Devise"],
    ["Exchange", "Change"],
    ["Backpack", "Sac à dos"],
    ["Hostel", "Auberge"],
    ["Reservation", "Réservation"],
    ["Platform change", "Changement de voie"],
    ["Timetable", "Horaires"],
    ["Lost property", "Objets trouvés"],
    ["Compartment", "Compartiment"],
    ["Single ticket", "Ticket aller simple"],
    ["Return ticket", "Aller-retour"],
    ["Window seat", "Place côté fenêtre"],
    ["Aisle seat", "Place côté couloir"],
    ["Boarding pass", "Carte d'embarquement"],
    ["Hand luggage", "Bagage cabine"],
    ["Checked baggage", "Bagage en soute"],
    ["Security check", "Contrôle de sécurité"],
    ["Immigration", "Immigration"],
    ["Layover", "Escale longue"],
    ["Red-eye flight", "Vol de nuit"],
    ["Travel insurance", "Assurance voyage"],
    ["Rental car", "Voiture de location"],
    ["Traffic jam", "Embouteillage"],
    ["Pedestrian", "Piéton"],
    ["One-way street", "Rue sens unique"],
    ["Seat belt", "Ceinture de sécurité"],
    ["Speed limit", "Limitation de vitesse"],
    ["Gas station", "Station-service"],
    ["Parking lot", "Parking"],
    ["GPS", "GPS"],
    ["Compass", "Boussole"],
  ];
  const expressions = [
    ["On time", "À l'heure"],
    ["Running late", "En retard"],
    ["Missed connection", "Correspondance manquée"],
    ["Fasten your seatbelt", "Attachez votre ceinture"],
    ["Boarding now", "Embarquement en cours"],
    ["Final call", "Dernier appel"],
    ["Gate change", "Changement de porte"],
    ["Flight cancelled", "Vol annulé"],
    ["Book in advance", "Réserver à l'avance"],
    ["Travel light", "Voyager léger"],
    ["Off the beaten path", "Hors des sentiers battus"],
    ["Rush hour", "Heure de pointe"],
    ["One-way ticket", "Aller simple"],
    ["Round trip", "Aller-retour"],
    ["Drop off", "Déposer quelqu'un"],
    ["Pick up", "Récupérer quelqu'un"],
    ["Road trip", "Road trip"],
    ["Lay of the land", "Se repérer"],
    ["Home stretch", "Dernière ligne droite"],
    ["Safe travels", "Bon voyage"],
  ];
  return [
    ...vocabulary.map(([term, definition]) => ({ term, definition, isExpression: false })),
    ...expressions.map(([term, definition]) => ({ term, definition, isExpression: true })),
  ];
}

function shortWords(lang, title) {
  const base = [
    { term: `${title} A`, definition: `Mot clé (${lang})` },
    { term: `${title} B`, definition: `Définition (${lang})` },
    { term: `${title} C`, definition: `Exemple (${lang})` },
    { term: "Expression courante", definition: "Expression utile", isExpression: true },
  ];
  return base;
}

const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
const allowRemote = process.argv.includes("--allow-remote");

if (tursoUrl && !allowRemote) {
  console.error(
    "Refus : TURSO_DATABASE_URL est défini (souvent via .env.local, possiblement la base de production).\n" +
      "Pour une base Turso distante, relancez avec --allow-remote après avoir vérifié l’URL.\n" +
      "Pour une base locale, retirez TURSO_DATABASE_URL et utilisez DATABASE_URL=file:…"
  );
  process.exit(1);
}

function resolveClient() {
  const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (tursoUrl && tursoToken) {
    return createClient({ url: tursoUrl, authToken: tursoToken });
  }
  const file = process.env.DATABASE_URL?.replace(/^file:/, "") ?? "vocab.db";
  return createClient({ url: `file:${file}` });
}

async function removeSeeds(client) {
  await client.execute({
    sql: "DELETE FROM shop_packs WHERE id LIKE ?",
    args: [`${SEED_PREFIX}%`],
  });
  console.log("Packs seed-shop supprimés.");
}

async function insertSeeds(client) {
  for (const lang of LANGS) {
    const titles = THEMES[lang];
    for (let i = 0; i < titles.length; i++) {
      const title = titles[i];
      const id = `${SEED_PREFIX}${lang}-${i}`;
      const words =
        lang === "eng" && title === "Voyages & transports" ? voyagesWords() : shortWords(lang, title);
      const wordCount = words.filter((w) => !w.isExpression).length;
      const expressionCount = words.filter((w) => w.isExpression).length;
      await client.execute({
        sql: `INSERT INTO shop_packs (
          id, title, description, emoji, word_count, expression_count, price,
          bundle_price, type, language, level, is_active, words_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())`,
        args: [
          id,
          title,
          `Liste de démonstration ${lang.toUpperCase()} — ${title}.`,
          "📦",
          wordCount,
          expressionCount,
          400,
          1600,
          "thematique",
          lang,
          "A2 → B2",
          0,
          JSON.stringify(words),
        ],
      });
    }
  }
  console.log("Packs seed insérés (inactifs, préfixe seed-shop-).");
}

const remove = process.argv.includes("--remove");
const client = resolveClient();

try {
  if (remove) {
    await removeSeeds(client);
  } else {
    await removeSeeds(client);
    await insertSeeds(client);
  }
} finally {
  client.close();
}