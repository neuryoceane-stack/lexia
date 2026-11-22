/**
 * Pack 15 — Nature & animaux (langue eng).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  { terme: "mammal", definition: "mammifère", type: "" },
  { terme: "reptile", definition: "reptile", type: "" },
  { terme: "amphibian", definition: "amphibien", type: "" },
  { terme: "insect", definition: "insecte", type: "" },
  { terme: "beetle", definition: "coléoptère", type: "" },
  { terme: "butterfly", definition: "papillon", type: "" },
  { terme: "spider", definition: "araignée", type: "" },
  { terme: "ant", definition: "fourmi", type: "" },
  { terme: "bee", definition: "abeille", type: "" },
  { terme: "wasp", definition: "guêpe", type: "" },
  { terme: "mosquito", definition: "moustique", type: "" },
  { terme: "fox", definition: "renard", type: "" },
  { terme: "deer", definition: "cerf", type: "" },
  { terme: "rabbit", definition: "lapin", type: "" },
  { terme: "squirrel", definition: "écureuil", type: "" },
  { terme: "hedgehog", definition: "hérisson", type: "" },
  { terme: "owl", definition: "hibou", type: "" },
  { terme: "hawk", definition: "faucon", type: "" },
  { terme: "eagle", definition: "aigle", type: "" },
  { terme: "wolf", definition: "loup", type: "" },
  { terme: "bear", definition: "ours", type: "" },
  { terme: "lion", definition: "lion", type: "" },
  { terme: "tiger", definition: "tigre", type: "" },
  { terme: "elephant", definition: "éléphant", type: "" },
  { terme: "giraffe", definition: "girafe", type: "" },
  { terme: "zebra", definition: "zèbre", type: "" },
  { terme: "monkey", definition: "singe", type: "" },
  { terme: "dolphin", definition: "dauphin", type: "" },
  { terme: "whale", definition: "baleine", type: "" },
  { terme: "shark", definition: "requin", type: "" },
  { terme: "turtle", definition: "tortue", type: "" },
  { terme: "snake", definition: "serpent", type: "" },
  { terme: "lizard", definition: "lézard", type: "" },
  { terme: "frog", definition: "grenouille", type: "" },
  { terme: "penguin", definition: "manchot", type: "" },
  { terme: "kangaroo", definition: "kangourou", type: "" },
  { terme: "habitat", definition: "habitat", type: "" },
  { terme: "predator", definition: "prédateur", type: "" },
  { terme: "prey", definition: "proie", type: "" },
  { terme: "paw", definition: "patte", type: "" },
  { terme: "claw", definition: "griffe", type: "" },
  { terme: "fang", definition: "croc", type: "" },
  { terme: "feather", definition: "plume", type: "" },
  { terme: "fur", definition: "fourrure", type: "" },
  { terme: "scale", definition: "écaille", type: "" },
  { terme: "hoof", definition: "sabot", type: "" },
  { terme: "horn", definition: "corne", type: "" },
  { terme: "antler", definition: "bois (cerf)", type: "" },
  { terme: "nest", definition: "nid", type: "" },
  { terme: "den", definition: "tanière", type: "" },
  { terme: "burrow", definition: "terrier", type: "" },
  { terme: "meadow", definition: "prairie", type: "" },
  { terme: "valley", definition: "vallée", type: "" },
  { terme: "cliff", definition: "falaise", type: "" },
  { terme: "waterfall", definition: "cascade", type: "" },
  { terme: "pond", definition: "étang", type: "" },
  { terme: "jungle", definition: "jungle", type: "" },
  { terme: "savanna", definition: "savane", type: "" },
  { terme: "canopy", definition: "canopée", type: "" },
  { terme: "bark", definition: "écorce", type: "" },
  { terme: "fern", definition: "fougère", type: "" },
  { terme: "mushroom", definition: "champignon", type: "" },
  { terme: "cattle", definition: "bovins", type: "" },
  { terme: "shepherd", definition: "berger", type: "" },
  { terme: "barn", definition: "grange", type: "" },
  { terme: "badger", definition: "blaireau", type: "" },
  { terme: "pounce on", definition: "se jeter sur", type: "" },
  { terme: "hunt down", definition: "traquer", type: "" },
  { terme: "chase away", definition: "chasser", type: "" },
  { terme: "curl up", definition: "se blottir", type: "" },
  { terme: "fend off", definition: "repousser", type: "" },
  { terme: "look out for", definition: "surveiller", type: "" },
  { terme: "feed on", definition: "se nourrir de", type: "" },
  { terme: "fly off", definition: "s'envoler", type: "" },
  { terme: "dig out", definition: "creuser", type: "" },
  { terme: "growl at", definition: "grogner", type: "" },
  { terme: "sniff out", definition: "repérer à l'odorat", type: "" },
  { terme: "climb up", definition: "escalader", type: "" },
  { terme: "pair off", definition: "former des couples", type: "" },
  { terme: "lurk about", definition: "rôder", type: "" },
  { terme: "a leopard can't change its spots", definition: "chassez le naturel, il revient au galop", type: "expression" },
  { terme: "like a fish out of water", definition: "comme un poisson hors de l'eau", type: "expression" },
  { terme: "busy as a bee", definition: "très occupé, affairé", type: "expression" },
  { terme: "sly as a fox", definition: "rusé comme un renard", type: "expression" },
  { terme: "as free as a bird", definition: "libre comme l'air", type: "expression" },
  { terme: "in the lion's den", definition: "dans la tanière du lion", type: "expression" },
  { terme: "a wolf in sheep's clothing", definition: "un loup en habit de mouton", type: "expression" },
  { terme: "let sleeping dogs lie", definition: "ne réveille pas le chat qui dort", type: "expression" },
  { terme: "the early bird catches the worm", definition: "l'avenir appartient à ceux qui se lèvent tôt", type: "expression" },
  { terme: "when pigs fly", definition: "quand les poules auront des dents", type: "expression" },
  { terme: "kill two birds with one stone", definition: "faire d'une pierre deux coups", type: "expression" },
  { terme: "hold your horses", definition: "du calme, patience", type: "expression" },
  { terme: "eager beaver", definition: "personne très zélée, travailleur acharné", type: "expression" },
  { terme: "a bird in the hand", definition: "un tiens vaut mieux que deux tu l'auras", type: "expression" },
  { terme: "the lion's share", definition: "la part du lion", type: "expression" },
  { terme: "curiosity killed the cat", definition: "la curiosité est un vilain défaut", type: "expression" },
  { terme: "don't count your chickens", definition: "il ne faut pas vendre la peau de l'ours", type: "expression" },
  { terme: "black sheep", definition: "brebis galeuse", type: "expression" },
  { terme: "a snake in the grass", definition: "un serpent dans l'herbe", type: "expression" },
  { terme: "wild goose chase", definition: "chasse aux chimères", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-15-nature-animaux.xlsx"));