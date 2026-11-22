/**
 * Pack 12 — Nourriture & cuisine (langue deu).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "das Kochrezept", definition: "recette de cuisine", type: "" },
  { terme: "die Zutat", definition: "ingrédient", type: "" },
  { terme: "der Geschmack", definition: "saveur", type: "" },
  { terme: "das Gewürz", definition: "épice", type: "" },
  { terme: "das Küchenkraut", definition: "herbe aromatique", type: "" },
  { terme: "die Würze", definition: "assaisonnement", type: "" },
  { terme: "die Küche", definition: "cuisine", type: "" },
  { terme: "der Koch", definition: "cuisinier", type: "" },
  { terme: "der Bäcker", definition: "boulanger", type: "" },
  { terme: "der Metzger", definition: "boucher", type: "" },
  { terme: "der Lebensmittelhändler", definition: "épicier", type: "" },
  { terme: "das Restaurant", definition: "restaurant", type: "" },
  { terme: "das Lokal", definition: "bistrot de quartier", type: "" },
  { terme: "die Cafeteria", definition: "cafétéria", type: "" },
  { terme: "das Buffet", definition: "buffet", type: "" },
  { terme: "das Essen zum Mitnehmen", definition: "plat à emporter", type: "" },
  { terme: "die Lieferung", definition: "livraison de repas", type: "" },
  { terme: "die Speisekarte", definition: "carte du restaurant", type: "" },
  { terme: "die Bestellung", definition: "commande", type: "" },
  { terme: "der Kellner", definition: "serveur en salle", type: "" },
  { terme: "das Trinkgeld", definition: "pourboire", type: "" },
  { terme: "die Vorspeise", definition: "hors-d'œuvre", type: "" },
  { terme: "das Hauptgericht", definition: "plat principal", type: "" },
  { terme: "die Beilage", definition: "accompagnement", type: "" },
  { terme: "die Portion", definition: "portion", type: "" },
  { terme: "der Nachtisch", definition: "dessert", type: "" },
  { terme: "das Gebäck", definition: "viennoiserie", type: "" },
  { terme: "die Bäckerei", definition: "boulangerie", type: "" },
  { terme: "die Brühe", definition: "bouillon", type: "" },
  { terme: "der Eintopf", definition: "ragoût", type: "" },
  { terme: "der Bratensaft", definition: "jus de viande", type: "" },
  { terme: "die Marinade", definition: "marinade", type: "" },
  { terme: "die Reste", definition: "restes d'un repas", type: "" },
  { terme: "bio", definition: "issu de l'agriculture biologique", type: "" },
  { terme: "vegan", definition: "végan", type: "" },
  { terme: "glutenfrei", definition: "sans gluten", type: "" },
  { terme: "die Delikatesse", definition: "mets raffiné", type: "" },
  { terme: "die Gastronomie", definition: "gastronomie", type: "" },
  { terme: "die Speisekammer", definition: "garde-manger", type: "" },
  { terme: "das Sieb", definition: "passoire", type: "" },
  { terme: "der Schneebesen", definition: "fouet", type: "" },
  { terme: "die Schöpfkelle", definition: "louche", type: "" },
  { terme: "die Schürze", definition: "tablier", type: "" },
  { terme: "kulinarisch", definition: "culinaire", type: "" },
  { terme: "das Rindfleisch", definition: "bœuf", type: "" },
  { terme: "das Geflügel", definition: "volaille", type: "" },
  { terme: "die Meeresfrüchte", definition: "fruits de mer", type: "" },
  { terme: "die Garnele", definition: "crevette", type: "" },
  { terme: "der Joghurt", definition: "yaourt", type: "" },
  { terme: "das Salz", definition: "sel", type: "" },
  { terme: "der Pfeffer", definition: "poivre", type: "" },
  { terme: "der Zucker", definition: "sucre", type: "" },
  { terme: "das Mehl", definition: "farine", type: "" },
  { terme: "die Butter", definition: "beurre", type: "" },
  { terme: "das Mindesthaltbarkeitsdatum", definition: "date de durabilité minimale (« à consommer de préférence avant »)", type: "" },
  { terme: "der Hunger", definition: "faim", type: "" },
  { terme: "der Durst", definition: "soif", type: "" },
  { terme: "die Semmel", definition: "petit pain", type: "" },
  { terme: "die Brezel", definition: "bretzel", type: "" },
  { terme: "die Wurst", definition: "saucisse", type: "" },
  { terme: "der Käse", definition: "fromage", type: "" },
  { terme: "das Ei", definition: "œuf", type: "" },
  { terme: "die Nudel", definition: "pâtes", type: "" },
  { terme: "die Soße", definition: "sauce", type: "" },
  { terme: "der Herd", definition: "cuisinière", type: "" },
  // —— 15 verbes à particule séparable ——
  { terme: "abschmecken", definition: "rectifier l'assaisonnement", type: "" },
  { terme: "aufkochen", definition: "porter à ébullition", type: "" },
  { terme: "anbraten", definition: "saisir à la poêle", type: "" },
  { terme: "ausbacken", definition: "frire, cuire à la friture", type: "" },
  { terme: "einweichen", definition: "faire tremper", type: "" },
  { terme: "abgießen", definition: "égoutter", type: "" },
  { terme: "umrühren", definition: "remuer", type: "" },
  { terme: "anrichten", definition: "dresser dans l'assiette", type: "" },
  { terme: "vorkosten", definition: "goûter avant de servir", type: "" },
  { terme: "aufessen", definition: "finir son assiette", type: "" },
  { terme: "eingießen", definition: "verser", type: "" },
  { terme: "abkühlen", definition: "laisser refroidir", type: "" },
  { terme: "einfrieren", definition: "congeler", type: "" },
  { terme: "auftischen", definition: "servir à table", type: "" },
  { terme: "mitessen", definition: "manger avec les autres", type: "" },
  // —— 20 expressions ——
  { terme: "ein Klacks sein", definition: "être d'une facilité déconcertante", type: "expression" },
  { terme: "das Salz in der Suppe sein", definition: "donner tout son intérêt à quelque chose", type: "expression" },
  { terme: "das Tüpfelchen auf dem i", definition: "la touche finale", type: "expression" },
  { terme: "weggehen wie warme Semmeln", definition: "se vendre comme des petits pains", type: "expression" },
  { terme: "den Mund zu voll nehmen", definition: "promettre au-delà de ses moyens", type: "expression" },
  { terme: "eine Naschkatze sein", definition: "avoir un faible pour le sucré", type: "expression" },
  { terme: "nicht mein Bier sein", definition: "ce n'est pas mon affaire", type: "expression" },
  { terme: "wie Tag und Nacht", definition: "être aux antipodes l'un de l'autre", type: "expression" },
  { terme: "viele Köche verderben den Brei", definition: "trop d'intervenants gâtent le travail", type: "expression" },
  { terme: "Probieren geht über Studieren", definition: "primauté de l'essai sur la théorie", type: "expression" },
  { terme: "die Suppe auslöffeln", definition: "assumer les conséquences de ses actes", type: "expression" },
  { terme: "überall die Finger drin haben", definition: "mettre son nez dans toutes les affaires", type: "expression" },
  { terme: "pappsatt sein", definition: "être complètement repu", type: "expression" },
  { terme: "zusammen am Tisch sitzen", definition: "partager un repas", type: "expression" },
  { terme: "Stoff zum Nachdenken", definition: "matière à réflexion", type: "expression" },
  { terme: "geschmacklos sein", definition: "manquer de goût, au palais ou dans les manières", type: "expression" },
  { terme: "saure Trauben", definition: "dénigrer ce qu'on n'a pas pu obtenir", type: "expression" },
  { terme: "jemandem Honig um den Bart schmieren", definition: "flatter quelqu'un sans mesure", type: "expression" },
  { terme: "das ist gegessen", definition: "affaire classée, sans y revenir", type: "expression" },
  { terme: "keinen Bissen herunterbringen", definition: "ne rien pouvoir avaler", type: "expression" },
];

function validate(data) {
  if (data.length !== 100) throw new Error(`Expected 100 rows, got ${data.length}`);
  const terms = new Set();
  for (const row of data) {
    if (!row.terme?.trim() || !row.definition?.trim()) throw new Error(`Empty: ${JSON.stringify(row)}`);
    const key = row.terme.trim().toLowerCase();
    if (terms.has(key)) throw new Error(`Duplicate: ${row.terme}`);
    terms.add(key);
  }
  const words = data.filter((r) => r.type !== "expression").length;
  const expressions = data.filter((r) => r.type === "expression").length;
  if (words !== 80 || expressions !== 20) throw new Error(`words=${words} expressions=${expressions}`);
}

validate(rows);
const ws = XLSX.utils.json_to_sheet(rows, { header: ["terme", "definition", "type"] });
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
XLSX.writeFile(wb, join(__dirname, "pack-12-nourriture-cuisine.xlsx"));
