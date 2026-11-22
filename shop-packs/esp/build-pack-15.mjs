/**
 * Pack 15 — Nature & animaux (langue esp).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "la planta", definition: "plante", type: "" },
  { terme: "la rata", definition: "rat ; « un rato » veut dire « un moment »", type: "" },
  { terme: "el ave", definition: "oiseau (nom féminin)", type: "" },
  { terme: "el árbol", definition: "arbre", type: "" },
  { terme: "la flor", definition: "fleur", type: "" },
  { terme: "la hoja", definition: "feuille", type: "" },
  { terme: "la raíz", definition: "racine", type: "" },
  { terme: "el bosque", definition: "forêt", type: "" },
  { terme: "el río", definition: "rivière", type: "" },
  { terme: "el lago", definition: "lac", type: "" },
  { terme: "el mar", definition: "mer", type: "" },
  { terme: "la playa", definition: "plage", type: "" },
  { terme: "la montaña", definition: "montagne", type: "" },
  { terme: "el valle", definition: "vallée", type: "" },
  { terme: "la isla", definition: "île", type: "" },
  { terme: "el desierto", definition: "désert", type: "" },
  { terme: "la selva", definition: "forêt tropicale", type: "" },
  { terme: "el volcán", definition: "volcan", type: "" },
  { terme: "la cueva", definition: "grotte", type: "" },
  { terme: "el paisaje", definition: "paysage", type: "" },
  { terme: "el tiempo atmosférico", definition: "temps qu'il fait", type: "" },
  { terme: "el sol", definition: "soleil", type: "" },
  { terme: "la luna", definition: "lune", type: "" },
  { terme: "la estrella", definition: "étoile", type: "" },
  { terme: "la nube", definition: "nuage", type: "" },
  { terme: "la lluvia", definition: "pluie", type: "" },
  { terme: "la nieve", definition: "neige", type: "" },
  { terme: "el viento", definition: "vent", type: "" },
  { terme: "la tormenta", definition: "orage", type: "" },
  { terme: "el rayo", definition: "éclair", type: "" },
  { terme: "el trueno", definition: "tonnerre", type: "" },
  { terme: "el arcoíris", definition: "arc-en-ciel", type: "" },
  { terme: "el animal", definition: "animal", type: "" },
  { terme: "el perro", definition: "chien", type: "" },
  { terme: "el gato", definition: "chat", type: "" },
  { terme: "el caballo", definition: "cheval", type: "" },
  { terme: "la vaca", definition: "vache", type: "" },
  { terme: "la oveja", definition: "mouton", type: "" },
  { terme: "el pájaro", definition: "petit oiseau", type: "" },
  { terme: "el pez", definition: "poisson (animal vivant)", type: "" },
  { terme: "la abeja", definition: "abeille", type: "" },
  { terme: "la mariposa", definition: "papillon", type: "" },
  { terme: "el insecto", definition: "insecte", type: "" },
  { terme: "la serpiente", definition: "serpent", type: "" },
  { terme: "el lobo", definition: "loup", type: "" },
  { terme: "el oso", definition: "ours", type: "" },
  { terme: "el águila", definition: "aigle (nom féminin)", type: "" },
  { terme: "la rana", definition: "grenouille", type: "" },
  { terme: "el zorro", definition: "renard", type: "" },
  { terme: "el nido", definition: "nid", type: "" },
  { terme: "la semilla", definition: "graine", type: "" },
  { terme: "el musgo", definition: "mousse", type: "" },
  { terme: "el hongo", definition: "champignon", type: "" },
  { terme: "la especie", definition: "espèce", type: "" },
  { terme: "el hábitat", definition: "habitat", type: "" },
  { terme: "el depredador", definition: "prédateur", type: "" },
  { terme: "la presa", definition: "proie", type: "" },
  { terme: "el manantial", definition: "source", type: "" },
  { terme: "la pradera", definition: "prairie", type: "" },
  { terme: "el sendero", definition: "sentier", type: "" },
  { terme: "el tronco", definition: "tronc", type: "" },
  { terme: "el pétalo", definition: "pétale", type: "" },
  { terme: "el rabo", definition: "queue d'un animal", type: "" },
  { terme: "el pelaje", definition: "pelage", type: "" },
  { terme: "la marea", definition: "marée", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "florecer", definition: "fleurir", type: "" },
  { terme: "crecer", definition: "grandir", type: "" },
  { terme: "migrar", definition: "migrer", type: "" },
  { terme: "cazar", definition: "chasser", type: "" },
  { terme: "hibernar", definition: "hiberner", type: "" },
  { terme: "brotar", definition: "germer", type: "" },
  { terme: "marchitarse", definition: "se faner", type: "" },
  { terme: "anidar", definition: "nicher", type: "" },
  { terme: "pastar", definition: "paître", type: "" },
  { terme: "rugir", definition: "rugir", type: "" },
  { terme: "aullar", definition: "hurler", type: "" },
  { terme: "picar", definition: "piquer", type: "" },
  { terme: "volar", definition: "voler", type: "" },
  { terme: "nadar", definition: "nager", type: "" },
  { terme: "domesticar", definition: "domestiquer", type: "" },
  // —— 20 expressions ——
  { terme: "matar dos pájaros de un tiro", definition: "faire d'une pierre deux coups", type: "expression" },
  { terme: "como pez en el agua", definition: "être comme un poisson dans l'eau", type: "expression" },
  { terme: "ser la oveja negra", definition: "être le mouton noir", type: "expression" },
  { terme: "lobo con piel de cordero", definition: "se présenter sous un jour trompeur", type: "expression" },
  { terme: "a otra cosa, mariposa", definition: "passer à tout autre chose", type: "expression" },
  { terme: "estar en la cresta de la ola", definition: "être au sommet de la vague", type: "expression" },
  { terme: "a río revuelto, ganancia de pescadores", definition: "tirer profit du désordre", type: "expression" },
  { terme: "criar malvas", definition: "être sous les pâquerettes", type: "expression" },
  { terme: "hacer leña del árbol caído", definition: "accabler quelqu'un déjà à terre", type: "expression" },
  { terme: "en menos que canta un gallo", definition: "en un temps très court", type: "expression" },
  { terme: "quien siembra vientos recoge tempestades", definition: "récolter le mal semé", type: "expression" },
  { terme: "no hay mal que por bien no venga", definition: "tirer un bien d'un malheur", type: "expression" },
  { terme: "después de la tempestad, la calma", definition: "retrouver le calme après la crise", type: "expression" },
  { terme: "agua que no has de beber, déjala correr", definition: "ne pas se mêler de ce qui ne vous concerne pas", type: "expression" },
  { terme: "ver el cielo abierto", definition: "entrevoir une chance", type: "expression" },
  { terme: "dormir como un lirón", definition: "dormir comme une marmotte", type: "expression" },
  { terme: "tener memoria de pez", definition: "oublier tout de suite", type: "expression" },
  { terme: "estar entre dos aguas", definition: "ménager deux camps", type: "expression" },
  { terme: "más solo que la una", definition: "être seul au monde", type: "expression" },
  { terme: "el que a hierro mata, a hierro muere", definition: "subir le sort que l'on inflige", type: "expression" },
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
