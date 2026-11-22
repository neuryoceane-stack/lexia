/**
 * Pack 7 — Vie quotidienne (langue eng).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  { terme: "home", definition: "maison, foyer", type: "" },
  { terme: "flat", definition: "appartement", type: "" },
  { terme: "rent", definition: "loyer", type: "" },
  { terme: "bill", definition: "facture", type: "" },
  { terme: "key", definition: "clé", type: "" },
  { terme: "lock", definition: "serrure", type: "" },
  { terme: "door", definition: "porte", type: "" },
  { terme: "bell", definition: "sonnette", type: "" },
  { terme: "stair", definition: "marche (escalier)", type: "" },
  { terme: "lift", definition: "ascenseur", type: "" },
  { terme: "sofa", definition: "canapé", type: "" },
  { terme: "bed", definition: "lit", type: "" },
  { terme: "pillow", definition: "oreiller", type: "" },
  { terme: "sheet", definition: "drap", type: "" },
  { terme: "towel", definition: "serviette", type: "" },
  { terme: "bath", definition: "bain", type: "" },
  { terme: "shower", definition: "douche", type: "" },
  { terme: "tap", definition: "robinet", type: "" },
  { terme: "sink", definition: "évier", type: "" },
  { terme: "soap", definition: "savon", type: "" },
  { terme: "brush", definition: "brosse", type: "" },
  { terme: "mirror", definition: "miroir", type: "" },
  { terme: "bin", definition: "poubelle", type: "" },
  { terme: "shelf", definition: "étagère", type: "" },
  { terme: "drawer", definition: "tiroir", type: "" },
  { terme: "fridge", definition: "réfrigérateur", type: "" },
  { terme: "oven", definition: "four", type: "" },
  { terme: "pan", definition: "poêle", type: "" },
  { terme: "pot", definition: "casserole", type: "" },
  { terme: "plate", definition: "assiette", type: "" },
  { terme: "mug", definition: "mug, grande tasse", type: "" },
  { terme: "fork", definition: "fourchette", type: "" },
  { terme: "knife", definition: "couteau", type: "" },
  { terme: "spoon", definition: "cuillère", type: "" },
  { terme: "breakfast", definition: "petit-déjeuner", type: "" },
  { terme: "lunch", definition: "déjeuner", type: "" },
  { terme: "snack", definition: "goûter, en-cas", type: "" },
  { terme: "supper", definition: "souper", type: "" },
  { terme: "grocery", definition: "courses alimentaires", type: "" },
  { terme: "chore", definition: "tâche ménagère", type: "" },
  { terme: "laundry", definition: "lessive", type: "" },
  { terme: "ironing", definition: "repassage", type: "" },
  { terme: "vacuum", definition: "aspirateur", type: "" },
  { terme: "tidy", definition: "rangé", type: "" },
  { terme: "mess", definition: "désordre", type: "" },
  { terme: "habit", definition: "habitude", type: "" },
  { terme: "routine", definition: "routine", type: "" },
  { terme: "neighbour", definition: "voisin", type: "" },
  { terme: "landlord", definition: "propriétaire", type: "" },
  { terme: "tenant", definition: "locataire", type: "" },
  { terme: "errand", definition: "course", type: "" },
  { terme: "queue", definition: "file d'attente", type: "" },
  { terme: "wallet", definition: "portefeuille", type: "" },
  { terme: "receipt", definition: "ticket de caisse", type: "" },
  { terme: "discount", definition: "réduction", type: "" },
  { terme: "housework", definition: "travaux ménagers", type: "" },
  { terme: "bedtime", definition: "heure du coucher", type: "" },
  { terme: "nap", definition: "sieste", type: "" },
  { terme: "household", definition: "foyer, ménage", type: "" },
  { terme: "microwave", definition: "four à micro-ondes", type: "" },
  { terme: "dishwasher", definition: "lave-vaisselle", type: "" },
  { terme: "washing powder", definition: "lessive en poudre", type: "" },
  { terme: "garbage day", definition: "jour des poubelles", type: "" },
  { terme: "utility bill", definition: "facture d'énergie", type: "" },
  { terme: "roommate", definition: "colocataire", type: "" },
  { terme: "curtain", definition: "rideau", type: "" },
  { terme: "wake up", definition: "se réveiller", type: "" },
  { terme: "get up", definition: "se lever", type: "" },
  { terme: "turn on", definition: "allumer", type: "" },
  { terme: "turn off", definition: "éteindre", type: "" },
  { terme: "put away", definition: "ranger", type: "" },
  { terme: "tidy up", definition: "mettre en ordre", type: "" },
  { terme: "wash up", definition: "faire la vaisselle", type: "" },
  { terme: "hang up", definition: "raccrocher", type: "" },
  { terme: "stock up", definition: "faire des provisions", type: "" },
  { terme: "do without", definition: "se passer de", type: "" },
  { terme: "clear away", definition: "débarrasser la table", type: "" },
  { terme: "cool down", definition: "refroidir", type: "" },
  { terme: "pick out", definition: "choisir", type: "" },
  { terme: "throw out", definition: "jeter à la poubelle", type: "" },
  { terme: "home sweet home", definition: "on n'est jamais mieux que chez soi", type: "expression" },
  { terme: "early bird", definition: "lève-tôt", type: "expression" },
  { terme: "night owl", definition: "couche-tard", type: "expression" },
  { terme: "from time to time", definition: "de temps en temps", type: "expression" },
  { terme: "make yourself at home", definition: "mettez-vous à l'aise", type: "expression" },
  { terme: "call it a night", definition: "arrêter pour la soirée", type: "expression" },
  { terme: "rise and shine", definition: "debout, c'est le jour", type: "expression" },
  { terme: "hit the sack", definition: "aller au lit", type: "expression" },
  { terme: "burn the candle at both ends", definition: "mener une vie épuisante", type: "expression" },
  { terme: "foot the bill", definition: "payer l'addition", type: "expression" },
  { terme: "run errands", definition: "faire des courses", type: "expression" },
  { terme: "change of pace", definition: "changement de rythme", type: "expression" },
  { terme: "on the house", definition: "aux frais de l'entreprise", type: "expression" },
  { terme: "keep house", definition: "tenir la maison", type: "expression" },
  { terme: "once in a blue moon", definition: "très rarement", type: "expression" },
  { terme: "easy does it", definition: "doucement", type: "expression" },
  { terme: "a pat on the back", definition: "une tape sur l'épaule", type: "expression" },
  { terme: "get into the swing of things", definition: "reprendre le rythme", type: "expression" },
  { terme: "throw a party", definition: "organiser une fête", type: "expression" },
  { terme: "spare room", definition: "chambre d'amis", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-07-vie-quotidienne.xlsx"));