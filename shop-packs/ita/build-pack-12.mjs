/**
 * Pack 12 — Nourriture & cuisine (langue ita).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "la ricetta di cucina", definition: "recette de cuisine", type: "" },
  { terme: "l'ingrediente (m.)", definition: "ingrédient", type: "" },
  { terme: "il sapore", definition: "saveur", type: "" },
  { terme: "la spezia", definition: "épice", type: "" },
  { terme: "l'erba aromatica (f.)", definition: "herbe aromatique", type: "" },
  { terme: "il condimento", definition: "assaisonnement", type: "" },
  { terme: "il cuoco", definition: "cuisinier", type: "" },
  { terme: "il fornaio", definition: "boulanger", type: "" },
  { terme: "il macellaio", definition: "boucher", type: "" },
  { terme: "il fruttivendolo", definition: "marchand de fruits et légumes", type: "" },
  { terme: "il ristorante", definition: "restaurant", type: "" },
  { terme: "la trattoria", definition: "restaurant simple de quartier", type: "" },
  { terme: "il bar", definition: "café-comptoir ; pas une boîte de nuit", type: "" },
  { terme: "la pizzeria", definition: "pizzeria", type: "" },
  { terme: "l'asporto (m.)", definition: "vente à emporter", type: "" },
  { terme: "la consegna a domicilio", definition: "livraison de repas", type: "" },
  { terme: "il menù", definition: "carte du restaurant", type: "" },
  { terme: "la prenotazione al ristorante", definition: "réservation d'une table", type: "" },
  { terme: "il cameriere", definition: "serveur en salle", type: "" },
  { terme: "la mancia", definition: "pourboire", type: "" },
  { terme: "il conto del ristorante", definition: "addition", type: "" },
  { terme: "il coperto", definition: "supplément pour le couvert, dans un restaurant italien", type: "" },
  { terme: "l'antipasto (m.)", definition: "entrée, avant le premier plat", type: "" },
  { terme: "il primo", definition: "premier plat, souvent pâtes, riz ou soupe", type: "" },
  { terme: "il secondo", definition: "plat de résistance", type: "" },
  { terme: "il contorno", definition: "accompagnement", type: "" },
  { terme: "la porzione", definition: "portion", type: "" },
  { terme: "il dolce", definition: "dessert", type: "" },
  { terme: "il panificio", definition: "boulangerie", type: "" },
  { terme: "il brodo", definition: "bouillon", type: "" },
  { terme: "il sugo", definition: "sauce tomate pour les pâtes", type: "" },
  { terme: "la marinata", definition: "marinade", type: "" },
  { terme: "gli avanzi", definition: "restes d'un repas", type: "" },
  { terme: "biologico", definition: "issu de l'agriculture biologique", type: "" },
  { terme: "vegano", definition: "végan", type: "" },
  { terme: "senza glutine", definition: "sans gluten", type: "" },
  { terme: "l'allergene (m.)", definition: "substance qui déclenche une allergie", type: "" },
  { terme: "la data di scadenza", definition: "date limite de consommation", type: "" },
  { terme: "il mercato rionale", definition: "marché de quartier", type: "" },
  { terme: "il mestolo", definition: "louche", type: "" },
  { terme: "la frusta", definition: "fouet de cuisine", type: "" },
  { terme: "il colino", definition: "passoire", type: "" },
  { terme: "il grembiule", definition: "tablier", type: "" },
  { terme: "il tagliere", definition: "planche à découper", type: "" },
  { terme: "il fornello", definition: "brûleur d'une cuisinière", type: "" },
  { terme: "il burro", definition: "beurre", type: "" },
  { terme: "il sale", definition: "sel", type: "" },
  { terme: "il pepe", definition: "poivre", type: "" },
  { terme: "lo zucchero", definition: "sucre", type: "" },
  { terme: "la farina", definition: "farine", type: "" },
  { terme: "l'olio d'oliva (m.)", definition: "huile d'olive", type: "" },
  { terme: "l'aglio (m.)", definition: "ail", type: "" },
  { terme: "la cipolla", definition: "oignon", type: "" },
  { terme: "il formaggio", definition: "fromage", type: "" },
  { terme: "il pane", definition: "pain", type: "" },
  { terme: "la pasta", definition: "pâtes", type: "" },
  { terme: "il riso", definition: "riz ; le rire se dit plutôt la risata", type: "" },
  { terme: "il pomodoro", definition: "tomate", type: "" },
  { terme: "l'uovo (m.)", definition: "œuf ; le pluriel est le uova", type: "" },
  { terme: "il pesce", definition: "poisson", type: "" },
  { terme: "la carne", definition: "viande", type: "" },
  { terme: "il pollo", definition: "poulet", type: "" },
  { terme: "la verdura", definition: "légumes", type: "" },
  { terme: "la frutta", definition: "fruits", type: "" },
  { terme: "il latte", definition: "lait", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "assaggiare", definition: "goûter un plat", type: "" },
  { terme: "bollire", definition: "bouillir", type: "" },
  { terme: "rosolare", definition: "faire revenir", type: "" },
  { terme: "friggere", definition: "frire", type: "" },
  { terme: "ammollare", definition: "faire tremper", type: "" },
  { terme: "scolare", definition: "égoutter", type: "" },
  { terme: "mescolare", definition: "remuer", type: "" },
  { terme: "impiattare", definition: "dresser dans l'assiette", type: "" },
  { terme: "condire", definition: "assaisonner", type: "" },
  { terme: "finire il piatto", definition: "finir son assiette", type: "" },
  { terme: "versare", definition: "verser", type: "" },
  { terme: "raffreddare", definition: "laisser refroidir", type: "" },
  { terme: "congelare", definition: "congeler", type: "" },
  { terme: "servire in tavola", definition: "servir à table", type: "" },
  { terme: "cuocere al dente", definition: "cuire des pâtes pour qu'elles restent fermes", type: "" },
  // —— 20 expressions ——
  { terme: "essere il sale della vita", definition: "donner tout son intérêt à quelque chose", type: "expression" },
  { terme: "la ciliegina sulla torta", definition: "apport ultime qui parfait l'ensemble", type: "expression" },
  { terme: "andare a ruba", definition: "être emporté dès qu'il est proposé", type: "expression" },
  { terme: "avere gli occhi più grandi della pancia", definition: "viser plus qu'on ne peut assumer", type: "expression" },
  { terme: "non sono cavoli miei", definition: "ce n'est pas mon affaire", type: "expression" },
  { terme: "essere come il giorno e la notte", definition: "s'opposer en tout", type: "expression" },
  { terme: "l'appetito vien mangiando", definition: "plus on avance, plus on en veut", type: "expression" },
  { terme: "provare per credere", definition: "se convaincre seulement en essayant", type: "expression" },
  { terme: "pagare lo scotto", definition: "assumer le prix d'une erreur", type: "expression" },
  { terme: "né carne né pesce", definition: "n'appartenir à aucune catégorie claire", type: "expression" },
  { terme: "trovare il pelo nell'uovo", definition: "chercher la petite faute", type: "expression" },
  { terme: "la volpe e l'uva", definition: "dénigrer ce qu'on n'a pas pu obtenir", type: "expression" },
  { terme: "mangiare a quattro palmenti", definition: "manger avec un très gros appétit", type: "expression" },
  { terme: "essere a stecchetto", definition: "vivre avec le strict minimum", type: "expression" },
  { terme: "rendere pan per focaccia", definition: "rendre exactement la pareille", type: "expression" },
  { terme: "a puntino", definition: "réglé avec une précision parfaite", type: "expression" },
  { terme: "non sapere di niente", definition: "manquer de tout goût, ou de tout intérêt", type: "expression" },
  { terme: "avere sale in zucca", definition: "avoir du jugement", type: "expression" },
  { terme: "la goccia che fa traboccare il vaso", definition: "petit fait qui fait céder une situation", type: "expression" },
  { terme: "leccarsi i baffi", definition: "savourer avec un plaisir visible", type: "expression" },
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
