/**
 * Pack 12 — Nourriture & cuisine (langue eng).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  { terme: "recipe", definition: "recette", type: "" },
  { terme: "ingredient", definition: "ingrédient", type: "" },
  { terme: "flavour", definition: "saveur", type: "" },
  { terme: "spice", definition: "épice", type: "" },
  { terme: "herb", definition: "herbe aromatique", type: "" },
  { terme: "seasoning", definition: "assaisonnement", type: "" },
  { terme: "cuisine", definition: "cuisine", type: "" },
  { terme: "chef", definition: "chef cuisinier", type: "" },
  { terme: "baker", definition: "boulanger", type: "" },
  { terme: "butcher", definition: "boucher", type: "" },
  { terme: "grocer", definition: "épicier", type: "" },
  { terme: "restaurant", definition: "restaurant", type: "" },
  { terme: "bistro", definition: "bistrot", type: "" },
  { terme: "cafeteria", definition: "salle de restauration libre-service", type: "" },
  { terme: "buffet", definition: "buffet", type: "" },
  { terme: "takeaway", definition: "plat à emporter", type: "" },
  { terme: "delivery", definition: "livraison de repas", type: "" },
  { terme: "menu", definition: "carte", type: "" },
  { terme: "order", definition: "commande", type: "" },
  { terme: "waiter", definition: "garçon de salle", type: "" },
  { terme: "tip", definition: "pourboire", type: "" },
  { terme: "check", definition: "addition", type: "" },
  { terme: "appetizer", definition: "apéritif", type: "" },
  { terme: "starter", definition: "entrée (plat)", type: "" },
  { terme: "main course", definition: "plat principal", type: "" },
  { terme: "side dish", definition: "accompagnement", type: "" },
  { terme: "portion", definition: "portion", type: "" },
  { terme: "brunch", definition: "brunch", type: "" },
  { terme: "dessert", definition: "dessert", type: "" },
  { terme: "pastry", definition: "pâtisserie", type: "" },
  { terme: "bakery", definition: "boulangerie", type: "" },
  { terme: "broth", definition: "bouillon", type: "" },
  { terme: "stew", definition: "ragoût", type: "" },
  { terme: "gravy", definition: "jus de viande", type: "" },
  { terme: "marinade", definition: "marinade", type: "" },
  { terme: "leftover", definition: "reste de plat", type: "" },
  { terme: "organic", definition: "bio", type: "" },
  { terme: "vegan", definition: "végan", type: "" },
  { terme: "gluten-free", definition: "sans gluten", type: "" },
  { terme: "delicacy", definition: "mets raffiné", type: "" },
  { terme: "gastronomy", definition: "gastronomie", type: "" },
  { terme: "pantry", definition: "garde-manger", type: "" },
  { terme: "colander", definition: "passoire", type: "" },
  { terme: "whisk", definition: "fouet", type: "" },
  { terme: "ladle", definition: "louche", type: "" },
  { terme: "apron", definition: "tablier", type: "" },
  { terme: "culinary", definition: "culinaire", type: "" },
  { terme: "beef", definition: "bœuf", type: "" },
  { terme: "poultry", definition: "volaille", type: "" },
  { terme: "seafood", definition: "fruits de mer", type: "" },
  { terme: "shrimp", definition: "crevette", type: "" },
  { terme: "yogurt", definition: "yaourt", type: "" },
  { terme: "simmer", definition: "mijoter", type: "" },
  { terme: "dice", definition: "couper en dés", type: "" },
  { terme: "peel", definition: "éplucher", type: "" },
  { terme: "steam", definition: "cuire à la vapeur", type: "" },
  { terme: "roast", definition: "rôtir", type: "" },
  { terme: "grill", definition: "griller", type: "" },
  { terme: "hungry", definition: "affamé", type: "" },
  { terme: "salt", definition: "sel", type: "" },
  { terme: "pepper", definition: "poivre", type: "" },
  { terme: "sugar", definition: "sucre", type: "" },
  { terme: "flour", definition: "farine", type: "" },
  { terme: "butter", definition: "beurre", type: "" },
  { terme: "expiry date", definition: "date limite de consommation", type: "" },
  { terme: "eat out", definition: "tu manges au restaurant", type: "" },
  { terme: "pig out", definition: "tu te gaves", type: "" },
  { terme: "wolf down", definition: "tu engloutis", type: "" },
  { terme: "whip up", definition: "tu prépares en un rien de temps", type: "" },
  { terme: "boil over", definition: "tu déborde (la casserole)", type: "" },
  { terme: "fill up on", definition: "tu te remplis de", type: "" },
  { terme: "live on", definition: "tu vis de", type: "" },
  { terme: "gobble up", definition: "tu dévores", type: "" },
  { terme: "polish off", definition: "tu finis complètement ton plat", type: "" },
  { terme: "pick at", definition: "tu picores", type: "" },
  { terme: "tuck in", definition: "tu attaques ton repas", type: "" },
  { terme: "rustle up", definition: "tu bricoles un repas", type: "" },
  { terme: "dish out", definition: "tu sers", type: "" },
  { terme: "cut back on", definition: "tu réduis ta consommation de", type: "" },
  { terme: "warm over", definition: "tu réchauffes tes restes", type: "" },
  { terme: "piece of cake", definition: "du gâteau (très facile)", type: "expression" },
  { terme: "bring home the bacon", definition: "tu ramènes l'argent pour vivre", type: "expression" },
  { terme: "cry over spilt milk", definition: "tu cries sur le lait renversé", type: "expression" },
  { terme: "the icing on the cake", definition: "la cerise sur le gâteau", type: "expression" },
  { terme: "sell like hot cakes", definition: "se vendre comme des petits pains", type: "expression" },
  { terme: "bite off more than you can chew", definition: "tu as les yeux plus gros que le ventre", type: "expression" },
  { terme: "have a sweet tooth", definition: "tu as un faible pour le sucré", type: "expression" },
  { terme: "not my cup of tea", definition: "ce n'est pas mon truc", type: "expression" },
  { terme: "chalk and cheese", definition: "le jour et la nuit", type: "expression" },
  { terme: "out of the frying pan into the fire", definition: "passer de Charybde en Scylla", type: "expression" },
  { terme: "too many cooks spoil the broth", definition: "trop de chefs gâchent le plat", type: "expression" },
  { terme: "the proof is in the pudding", definition: "la preuve est dans le goûter", type: "expression" },
  { terme: "eat humble pie", definition: "tu manges ton chapeau", type: "expression" },
  { terme: "finger in every pie", definition: "tu mets les doigts dans tout", type: "expression" },
  { terme: "spill the beans", definition: "tu craches le morceau", type: "expression" },
  { terme: "full as a tick", definition: "tu es repu", type: "expression" },
  { terme: "break bread", definition: "tu partages un repas", type: "expression" },
  { terme: "food for thought", definition: "matière à réflexion", type: "expression" },
  { terme: "in bad taste", definition: "de mauvais goût", type: "expression" },
  { terme: "sour grapes", definition: "rancune du perdant", type: "expression" },
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