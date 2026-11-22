/**
 * Pack 15 — Nature & animaux (langue ita).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "l'animale (m.)", definition: "animal", type: "" },
  { terme: "il cane", definition: "chien", type: "" },
  { terme: "il gatto", definition: "chat", type: "" },
  { terme: "il lupo", definition: "loup", type: "" },
  { terme: "l'uccello (m.)", definition: "oiseau", type: "" },
  { terme: "il cavallo", definition: "cheval", type: "" },
  { terme: "la mucca", definition: "vache", type: "" },
  { terme: "la pecora", definition: "mouton", type: "" },
  { terme: "il leone", definition: "lion", type: "" },
  { terme: "l'orso (m.)", definition: "ours", type: "" },
  { terme: "il delfino", definition: "dauphin", type: "" },
  { terme: "l'ape (f.)", definition: "abeille", type: "" },
  { terme: "la farfalla", definition: "papillon", type: "" },
  { terme: "il ragno", definition: "araignée", type: "" },
  { terme: "il serpente", definition: "serpent", type: "" },
  { terme: "il coniglio", definition: "lapin", type: "" },
  { terme: "la volpe", definition: "renard", type: "" },
  { terme: "il cervo", definition: "cerf", type: "" },
  { terme: "l'aquila (f.)", definition: "aigle", type: "" },
  { terme: "la rana", definition: "grenouille", type: "" },
  { terme: "la tartaruga", definition: "tortue", type: "" },
  { terme: "il granchio", definition: "crabe", type: "" },
  { terme: "la balena", definition: "baleine", type: "" },
  { terme: "l'insetto (m.)", definition: "insecte", type: "" },
  { terme: "il branco", definition: "meute ou troupeau", type: "" },
  { terme: "la tana", definition: "terrier", type: "" },
  { terme: "il nido", definition: "nid", type: "" },
  { terme: "la zampa", definition: "patte", type: "" },
  { terme: "l'ala (f.)", definition: "aile", type: "" },
  { terme: "la foresta", definition: "forêt", type: "" },
  { terme: "il bosco", definition: "bois", type: "" },
  { terme: "la montagna", definition: "montagne", type: "" },
  { terme: "la collina", definition: "colline", type: "" },
  { terme: "la valle", definition: "vallée", type: "" },
  { terme: "il fiume", definition: "fleuve ou rivière", type: "" },
  { terme: "il lago", definition: "lac", type: "" },
  { terme: "il mare", definition: "mer", type: "" },
  { terme: "la spiaggia", definition: "plage", type: "" },
  { terme: "l'isola (f.)", definition: "île", type: "" },
  { terme: "il deserto", definition: "désert", type: "" },
  { terme: "il prato", definition: "pré", type: "" },
  { terme: "l'albero (m.)", definition: "arbre", type: "" },
  { terme: "il fiore", definition: "fleur", type: "" },
  { terme: "la foglia", definition: "feuille d'un arbre", type: "" },
  { terme: "la radice", definition: "racine", type: "" },
  { terme: "il ramo", definition: "branche d'un arbre", type: "" },
  { terme: "l'erba (f.)", definition: "herbe", type: "" },
  { terme: "il seme", definition: "graine", type: "" },
  { terme: "il frutto", definition: "fruit d'une plante, au sens botanique", type: "" },
  { terme: "il paesaggio", definition: "paysage", type: "" },
  { terme: "la roccia", definition: "rocher", type: "" },
  { terme: "la sabbia", definition: "sable", type: "" },
  { terme: "l'onda (f.)", definition: "vague", type: "" },
  { terme: "la marea", definition: "marée", type: "" },
  { terme: "il vento", definition: "vent", type: "" },
  { terme: "la nebbia", definition: "brouillard", type: "" },
  { terme: "la neve", definition: "neige", type: "" },
  { terme: "il ghiaccio", definition: "glace, l'eau gelée", type: "" },
  { terme: "il temporale", definition: "orage", type: "" },
  { terme: "il tuono", definition: "tonnerre", type: "" },
  { terme: "il fulmine", definition: "éclair", type: "" },
  { terme: "l'arcobaleno (m.)", definition: "arc-en-ciel", type: "" },
  { terme: "l'alba (f.)", definition: "aube", type: "" },
  { terme: "il tramonto", definition: "coucher du soleil", type: "" },
  { terme: "la cascata", definition: "cascade", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "abbaiare", definition: "aboyer", type: "" },
  { terme: "miagolare", definition: "miauler", type: "" },
  { terme: "volare", definition: "voler dans les airs ; dérober se dit rubare, vouloir se dit volere", type: "" },
  { terme: "nuotare", definition: "nager", type: "" },
  { terme: "strisciare", definition: "ramper", type: "" },
  { terme: "fiorire", definition: "fleurir", type: "" },
  { terme: "germogliare", definition: "germer", type: "" },
  { terme: "appassire", definition: "se faner", type: "" },
  { terme: "sbocciare", definition: "éclore", type: "" },
  { terme: "migrare", definition: "migrer", type: "" },
  { terme: "andare in letargo", definition: "hiberner", type: "" },
  { terme: "addomesticare", definition: "domestiquer", type: "" },
  { terme: "innaffiare", definition: "arroser une plante", type: "" },
  { terme: "potare", definition: "tailler un arbre ou un arbuste", type: "" },
  { terme: "sorgere", definition: "se lever, pour le soleil ou la lune", type: "" },
  // —— 20 expressions ——
  { terme: "prendere un granchio", definition: "se tromper du tout au tout", type: "expression" },
  { terme: "essere un pesce fuor d'acqua", definition: "ne pas être à sa place", type: "expression" },
  { terme: "prendere due piccioni con una fava", definition: "obtenir deux résultats d'un seul geste", type: "expression" },
  { terme: "quando il gatto non c'è i topi ballano", definition: "sans surveillance, faire ce qui est interdit", type: "expression" },
  { terme: "l'erba del vicino è sempre più verde", definition: "trouver toujours mieux ce qu'ont les autres", type: "expression" },
  { terme: "cane che abbaia non morde", definition: "qui menace fort agit peu", type: "expression" },
  { terme: "meglio un uovo oggi che una gallina domani", definition: "préférer un gain sûr à une promesse", type: "expression" },
  { terme: "menare il can per l'aia", definition: "tourner autour du pot", type: "expression" },
  { terme: "fare la gatta morta", definition: "feindre l'innocence", type: "expression" },
  { terme: "mettere la pulce nell'orecchio", definition: "éveiller un doute", type: "expression" },
  { terme: "fare un freddo cane", definition: "faire un froid très vif", type: "expression" },
  { terme: "nascere con la camicia", definition: "avoir une chance insolente dès le départ", type: "expression" },
  { terme: "gallina vecchia fa buon brodo", definition: "l'expérience garde de la valeur", type: "expression" },
  { terme: "drizzare le orecchie", definition: "tendre l'oreille", type: "expression" },
  { terme: "libero come l'aria", definition: "n'être tenu par aucune contrainte", type: "expression" },
  { terme: "essere testardo come un mulo", definition: "refuser de changer d'avis", type: "expression" },
  { terme: "la pecora nera", definition: "personne qui déroge à son groupe", type: "expression" },
  { terme: "a passo di lumaca", definition: "à une lenteur extrême", type: "expression" },
  { terme: "muto come un pesce", definition: "ne rien dire", type: "expression" },
  { terme: "una rondine non fa primavera", definition: "un seul signe ne permet pas de conclure", type: "expression" },
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
