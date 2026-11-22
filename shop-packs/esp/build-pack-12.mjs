/**
 * Pack 12 — Nourriture & cuisine (langue esp).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "la carta", definition: "menu ; le mot veut aussi dire « lettre ». Et non « carte géographique »", type: "" },
  { terme: "el vaso", definition: "verre, et non « vase »", type: "" },
  { terme: "la tarta", definition: "tarte", type: "" },
  { terme: "el pastel", definition: "gâteau", type: "" },
  { terme: "el pan", definition: "pain", type: "" },
  { terme: "la leche", definition: "lait", type: "" },
  { terme: "el huevo", definition: "œuf", type: "" },
  { terme: "la carne", definition: "viande", type: "" },
  { terme: "el pescado", definition: "poisson", type: "" },
  { terme: "la fruta", definition: "fruit", type: "" },
  { terme: "la verdura", definition: "légume", type: "" },
  { terme: "el arroz", definition: "riz", type: "" },
  { terme: "el aceite", definition: "huile", type: "" },
  { terme: "la sal", definition: "sel", type: "" },
  { terme: "el azúcar", definition: "sucre", type: "" },
  { terme: "la harina", definition: "farine", type: "" },
  { terme: "el tomate", definition: "tomate", type: "" },
  { terme: "la cebolla", definition: "oignon", type: "" },
  { terme: "el ajo", definition: "ail", type: "" },
  { terme: "el queso", definition: "fromage", type: "" },
  { terme: "el jamón", definition: "jambon", type: "" },
  { terme: "la tortilla", definition: "omelette espagnole", type: "" },
  { terme: "la paella", definition: "paella", type: "" },
  { terme: "el gazpacho", definition: "gaspacho", type: "" },
  { terme: "el vino", definition: "vin", type: "" },
  { terme: "la cerveza", definition: "bière", type: "" },
  { terme: "el café", definition: "café", type: "" },
  { terme: "el zumo", definition: "jus de fruit", type: "" },
  { terme: "el postre", definition: "dessert", type: "" },
  { terme: "el entrante", definition: "entrée", type: "" },
  { terme: "la cuenta", definition: "addition", type: "" },
  { terme: "el camarero", definition: "serveur, serveuse", type: "" },
  { terme: "la propina", definition: "pourboire", type: "" },
  { terme: "la reserva de mesa", definition: "réservation de table", type: "" },
  { terme: "el sabor", definition: "goût", type: "" },
  { terme: "la receta", definition: "recette de cuisine", type: "" },
  { terme: "el ingrediente", definition: "ingrédient", type: "" },
  { terme: "la ración", definition: "portion", type: "" },
  { terme: "el menú del día", definition: "menu du jour", type: "" },
  { terme: "la tapa", definition: "mise en bouche servie au comptoir", type: "" },
  { terme: "el mercado", definition: "marché alimentaire", type: "" },
  { terme: "la panadería", definition: "boulangerie", type: "" },
  { terme: "la carnicería", definition: "boucherie", type: "" },
  { terme: "el supermercado", definition: "supermarché", type: "" },
  { terme: "la cocina", definition: "cuisine", type: "" },
  { terme: "el cocinero", definition: "cuisinier, cuisinière", type: "" },
  { terme: "el cucharón", definition: "louche", type: "" },
  { terme: "la servilleta", definition: "serviette de table", type: "" },
  { terme: "el mantel", definition: "nappe", type: "" },
  { terme: "la fecha de caducidad", definition: "date limite de consommation", type: "" },
  { terme: "el congelador", definition: "congélateur", type: "" },
  { terme: "la plancha", definition: "plaque de cuisson", type: "" },
  { terme: "el vinagre", definition: "vinaigre", type: "" },
  { terme: "la pimienta", definition: "poivre", type: "" },
  { terme: "el pollo", definition: "poulet", type: "" },
  { terme: "el marisco", definition: "fruits de mer", type: "" },
  { terme: "la ensalada", definition: "salade", type: "" },
  { terme: "la sopa", definition: "soupe", type: "" },
  { terme: "la salsa", definition: "sauce", type: "" },
  { terme: "el helado", definition: "glace", type: "" },
  { terme: "el bocadillo", definition: "sandwich", type: "" },
  { terme: "picante", definition: "épicé", type: "" },
  { terme: "crudo", definition: "cru", type: "" },
  { terme: "el cubierto", definition: "couvert", type: "" },
  { terme: "el aperitivo", definition: "apéritif", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "cocinar", definition: "cuisiner", type: "" },
  { terme: "freír", definition: "frire", type: "" },
  { terme: "hervir", definition: "bouillir", type: "" },
  { terme: "asar", definition: "rôtir", type: "" },
  { terme: "hornear", definition: "cuire au four", type: "" },
  { terme: "cortar", definition: "couper un aliment", type: "" },
  { terme: "mezclar", definition: "mélanger", type: "" },
  { terme: "probar", definition: "goûter pour vérifier le goût", type: "" },
  { terme: "pelar", definition: "éplucher", type: "" },
  { terme: "batir", definition: "battre (des œufs)", type: "" },
  { terme: "servir", definition: "servir un plat", type: "" },
  { terme: "pedir", definition: "commander un plat", type: "" },
  { terme: "brindar", definition: "porter un toast", type: "" },
  { terme: "aliñar", definition: "assaisonner", type: "" },
  { terme: "calentar", definition: "réchauffer", type: "" },
  // —— 20 expressions ——
  { terme: "estar en el ajo", definition: "être dans le secret", type: "expression" },
  { terme: "ser pan comido", definition: "être du tout cuit", type: "expression" },
  { terme: "a falta de pan, buenas son tortas", definition: "se contenter de ce qu'il y a", type: "expression" },
  { terme: "ganarse el pan", definition: "gagner sa vie", type: "expression" },
  { terme: "estar como un flan", definition: "trembler comme une feuille", type: "expression" },
  { terme: "importar un pimiento", definition: "n'en avoir cure", type: "expression" },
  { terme: "ser la guinda del pastel", definition: "être la cerise sur le gâteau", type: "expression" },
  { terme: "a pedir de boca", definition: "arriver à souhait", type: "expression" },
  { terme: "morderse la lengua", definition: "retenir sa langue", type: "expression" },
  { terme: "estar hasta en la sopa", definition: "être présent partout", type: "expression" },
  { terme: "no pedir peras al olmo", definition: "ne pas demander l'impossible", type: "expression" },
  { terme: "estar en su salsa", definition: "être dans son élément", type: "expression" },
  { terme: "cortar el bacalao", definition: "être celui qui décide", type: "expression" },
  { terme: "tragarse el sapo", definition: "ravaler une couleuvre", type: "expression" },
  { terme: "ponerse morado", definition: "se goinfrer", type: "expression" },
  { terme: "con su pan se lo coma", definition: "laisser chacun assumer ses choix", type: "expression" },
  { terme: "más vale pájaro en mano que ciento volando", definition: "préférer un acquis sûr à une promesse", type: "expression" },
  { terme: "ni chicha ni limonada", definition: "n'être ni chair ni poisson", type: "expression" },
  { terme: "echar sal en la herida", definition: "retourner le couteau dans la plaie", type: "expression" },
  { terme: "estar para chuparse los dedos", definition: "être à s'en lécher les doigts", type: "expression" },
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
