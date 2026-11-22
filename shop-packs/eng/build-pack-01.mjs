/**
 * Génère pack-01-environnement.xlsx (usage local, non importé automatiquement).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème (type vide) ——
  { terme: "environment", definition: "environnement", type: "" },
  { terme: "climate", definition: "climat", type: "" },
  { terme: "pollution", definition: "pollution", type: "" },
  { terme: "recycling", definition: "recyclage", type: "" },
  { terme: "sustainability", definition: "développement durable", type: "" },
  { terme: "ecosystem", definition: "écosystème", type: "" },
  { terme: "biodiversity", definition: "biodiversité", type: "" },
  { terme: "deforestation", definition: "déforestation", type: "" },
  { terme: "emission", definition: "émission", type: "" },
  { terme: "greenhouse effect", definition: "effet de serre", type: "" },
  { terme: "carbon dioxide", definition: "dioxyde de carbone", type: "" },
  { terme: "carbon footprint", definition: "empreinte carbone", type: "" },
  { terme: "global warming", definition: "réchauffement climatique", type: "" },
  { terme: "climate change", definition: "changement climatique", type: "" },
  { terme: "drought", definition: "sécheresse", type: "" },
  { terme: "flood", definition: "inondation", type: "" },
  { terme: "wildfire", definition: "feu de forêt", type: "" },
  { terme: "glacier", definition: "glacier", type: "" },
  { terme: "ozone layer", definition: "couche d'ozone", type: "" },
  { terme: "acid rain", definition: "pluie acide", type: "" },
  { terme: "landfill", definition: "décharge publique", type: "" },
  { terme: "compost", definition: "compost", type: "" },
  { terme: "waste", definition: "déchets", type: "" },
  { terme: "litter", definition: "détritus", type: "" },
  { terme: "pesticide", definition: "pesticide", type: "" },
  { terme: "organic farming", definition: "agriculture biologique", type: "" },
  { terme: "conservation", definition: "conservation", type: "" },
  { terme: "endangered species", definition: "espèce menacée", type: "" },
  { terme: "habitat", definition: "habitat", type: "" },
  { terme: "extinction", definition: "extinction", type: "" },
  { terme: "solar energy", definition: "énergie solaire", type: "" },
  { terme: "wind power", definition: "énergie éolienne", type: "" },
  { terme: "hydropower", definition: "hydroélectricité", type: "" },
  { terme: "fossil fuel", definition: "combustible fossile", type: "" },
  { terme: "coal", definition: "charbon", type: "" },
  { terme: "oil spill", definition: "marée noire", type: "" },
  { terme: "contamination", definition: "contamination", type: "" },
  { terme: "groundwater", definition: "eau souterraine", type: "" },
  { terme: "erosion", definition: "érosion", type: "" },
  { terme: "desertification", definition: "désertification", type: "" },
  { terme: "biodegradable", definition: "biodégradable", type: "" },
  { terme: "single-use plastic", definition: "plastique à usage unique", type: "" },
  { terme: "methane", definition: "méthane", type: "" },
  { terme: "reforestation", definition: "reforestation", type: "" },
  { terme: "carbon neutral", definition: "neutre en carbone", type: "" },
  { terme: "net zero", definition: "zéro émission nette", type: "" },
  { terme: "air quality", definition: "qualité de l'air", type: "" },
  { terme: "smog", definition: "smog", type: "" },
  { terme: "sewage", definition: "eaux usées", type: "" },
  { terme: "toxic waste", definition: "déchets toxiques", type: "" },
  { terme: "marine ecosystem", definition: "écosystème marin", type: "" },
  { terme: "coral reef", definition: "récif corallien", type: "" },
  { terme: "overfishing", definition: "surpêche", type: "" },
  { terme: "nature reserve", definition: "réserve naturelle", type: "" },
  { terme: "renewable resource", definition: "ressource renouvelable", type: "" },
  { terme: "invasive species", definition: "espèce invasive", type: "" },
  { terme: "food chain", definition: "chaîne alimentaire", type: "" },
  { terme: "carbon offset", definition: "compensation carbone", type: "" },
  { terme: "electric vehicle", definition: "véhicule électrique", type: "" },
  { terme: "heatwave", definition: "vague de chaleur", type: "" },
  { terme: "sea level rise", definition: "élévation du niveau de la mer", type: "" },
  { terme: "microplastic", definition: "microplastique", type: "" },
  { terme: "runoff", definition: "ruissellement", type: "" },
  { terme: "watershed", definition: "bassin versant", type: "" },
  { terme: "peatland", definition: "tourbière", type: "" },
  // —— 15 phrasal verbs (type vide = mot) ——
  { terme: "run out of", definition: "manquer de", type: "" },
  { terme: "cut down on", definition: "réduire", type: "" },
  { terme: "wipe out", definition: "anéantir", type: "" },
  { terme: "use up", definition: "épuiser", type: "" },
  { terme: "throw away", definition: "jeter", type: "" },
  { terme: "break down", definition: "se décomposer", type: "" },
  { terme: "give off", definition: "émettre", type: "" },
  { terme: "heat up", definition: "se réchauffer", type: "" },
  { terme: "dry up", definition: "s'assécher", type: "" },
  { terme: "die out", definition: "disparaître", type: "" },
  { terme: "phase out", definition: "abandonner progressivement", type: "" },
  { terme: "clean up", definition: "nettoyer", type: "" },
  { terme: "cut back on", definition: "diminuer", type: "" },
  { terme: "run off", definition: "s'écouler", type: "" },
  { terme: "scale down", definition: "réduire", type: "" },
  // —— 20 expressions (type = expression) ——
  { terme: "go green", definition: "adopter une démarche écologique", type: "expression" },
  { terme: "Mother Nature", definition: "la nature (personnifiée)", type: "expression" },
  { terme: "a drop in the ocean", definition: "une goutte d'eau dans l'océan", type: "expression" },
  { terme: "the tip of the iceberg", definition: "la partie émergée de l'iceberg", type: "expression" },
  { terme: "back to nature", definition: "retour à la nature", type: "expression" },
  { terme: "a force of nature", definition: "une force de la nature", type: "expression" },
  { terme: "clear the air", definition: "apaiser les tensions", type: "expression" },
  { terme: "stem the tide", definition: "freiner le mouvement", type: "expression" },
  { terme: "on thin ice", definition: "sur un terrain glissant", type: "expression" },
  { terme: "weather the storm", definition: "tenir bon face à la tempête", type: "expression" },
  { terme: "the great outdoors", definition: "les grands espaces", type: "expression" },
  { terme: "live off the land", definition: "vivre de la terre", type: "expression" },
  { terme: "every little helps", definition: "chaque effort compte", type: "expression" },
  { terme: "think globally, act locally", definition: "penser global, agir local", type: "expression" },
  { terme: "reduce, reuse, recycle", definition: "réduire, réutiliser, recycler", type: "expression" },
  { terme: "breathe easy", definition: "être soulagé", type: "expression" },
  { terme: "in the long run", definition: "à long terme", type: "expression" },
  { terme: "run its course", definition: "suivre son cours", type: "expression" },
  { terme: "turn over a new leaf", definition: "tourner la page", type: "expression" },
  { terme: "the eleventh hour", definition: "au dernier moment", type: "expression" },
];

function validate(data) {
  if (data.length !== 100) throw new Error(`Expected 100 rows, got ${data.length}`);
  const terms = new Set();
  for (const row of data) {
    if (!row.terme?.trim() || !row.definition?.trim()) {
      throw new Error(`Empty term or definition: ${JSON.stringify(row)}`);
    }
    const key = row.terme.trim().toLowerCase();
    if (terms.has(key)) throw new Error(`Duplicate term: ${row.terme}`);
    terms.add(key);
  }
  const words = data.filter((r) => r.type !== "expression").length;
  const expressions = data.filter((r) => r.type === "expression").length;
  if (words !== 80) throw new Error(`Word count: expected 80, got ${words}`);
  if (expressions !== 20) throw new Error(`Expression count: expected 20, got ${expressions}`);
}

validate(rows);

const ws = XLSX.utils.json_to_sheet(rows, { header: ["terme", "definition", "type"] });
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

const outPath = join(__dirname, "pack-01-environnement.xlsx");
XLSX.writeFile(wb, outPath);