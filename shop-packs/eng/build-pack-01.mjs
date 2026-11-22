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
  { terme: "airborne pollutants", definition: "polluants atmosphériques", type: "" },
  { terme: "recycling", definition: "recyclage", type: "" },
  { terme: "sustainability", definition: "développement durable", type: "" },
  { terme: "ecosystem", definition: "écosystème", type: "" },
  { terme: "species richness", definition: "richesse spécifique", type: "" },
  { terme: "clear-cutting", definition: "coupe rase", type: "" },
  { terme: "emission", definition: "émission", type: "" },
  { terme: "greenhouse effect", definition: "effet de serre", type: "" },
  { terme: "carbon dioxide", definition: "dioxyde de carbone", type: "" },
  { terme: "carbon footprint", definition: "empreinte carbone", type: "" },
  { terme: "global warming", definition: "réchauffement climatique", type: "" },
  { terme: "climate change", definition: "changement climatique", type: "" },
  { terme: "drought", definition: "sécheresse", type: "" },
  { terme: "flood", definition: "inondation", type: "" },
  { terme: "wildfire", definition: "feu de forêt", type: "" },
  { terme: "permafrost", definition: "pergélisol", type: "" },
  { terme: "ozone layer", definition: "couche d'ozone", type: "" },
  { terme: "acid rain", definition: "pluie acide", type: "" },
  { terme: "landfill", definition: "décharge publique", type: "" },
  { terme: "mulch", definition: "paillis", type: "" },
  { terme: "waste", definition: "déchets", type: "" },
  { terme: "litter", definition: "détritus", type: "" },
  { terme: "weedkiller", definition: "désherbant", type: "" },
  { terme: "organic farming", definition: "agriculture biologique", type: "" },
  { terme: "rewilding", definition: "réensauvagement", type: "" },
  { terme: "endangered species", definition: "espèce menacée", type: "" },
  { terme: "wildlife corridor", definition: "corridor écologique", type: "" },
  { terme: "mass extinction", definition: "extinction de masse", type: "" },
  { terme: "solar energy", definition: "énergie solaire", type: "" },
  { terme: "wind power", definition: "énergie éolienne", type: "" },
  { terme: "hydropower", definition: "hydroélectricité", type: "" },
  { terme: "fossil fuel", definition: "combustible fossile", type: "" },
  { terme: "coal", definition: "charbon", type: "" },
  { terme: "oil spill", definition: "marée noire", type: "" },
  { terme: "leachate", definition: "lixiviat", type: "" },
  { terme: "groundwater", definition: "eau souterraine", type: "" },
  { terme: "coastal retreat", definition: "recul du littoral", type: "" },
  { terme: "land degradation", definition: "dégradation des sols", type: "" },
  { terme: "biodegradable", definition: "biodégradable", type: "" },
  { terme: "single-use plastic", definition: "plastique à usage unique", type: "" },
  { terme: "nitrous oxide", definition: "protoxyde d'azote", type: "" },
  { terme: "reforestation", definition: "reboisement", type: "" },
  { terme: "carbon neutral", definition: "neutre en carbone", type: "" },
  { terme: "net zero", definition: "zéro émission nette", type: "" },
  { terme: "air quality", definition: "qualité de l'air", type: "" },
  { terme: "urban heat island", definition: "îlot de chaleur urbain", type: "" },
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
  { terme: "soak up", definition: "absorber", type: "" },
  { terme: "run off", definition: "s'écouler", type: "" },
  { terme: "pile up", definition: "s'accumuler", type: "" },
  // —— 20 expressions (type = expression) ——
  { terme: "go green", definition: "adopter une démarche écologique", type: "expression" },
  { terme: "Mother Nature", definition: "Mère Nature", type: "expression" },
  { terme: "a drop in the ocean", definition: "une goutte d'eau dans l'océan", type: "expression" },
  { terme: "the tip of the iceberg", definition: "la partie émergée de l'iceberg", type: "expression" },
  { terme: "every cloud has a silver lining", definition: "à quelque chose malheur est bon", type: "expression" },
  { terme: "a force of nature", definition: "une force de la nature", type: "expression" },
  { terme: "raining cats and dogs", definition: "il pleut des cordes", type: "expression" },
  { terme: "stem the tide", definition: "endiguer ; enrayer", type: "expression" },
  { terme: "on thin ice", definition: "sur un terrain glissant", type: "expression" },
  { terme: "weather the storm", definition: "tenir bon face à la tempête", type: "expression" },
  { terme: "the great outdoors", definition: "les grands espaces", type: "expression" },
  { terme: "live off the land", definition: "vivre de la terre", type: "expression" },
  { terme: "every little helps", definition: "chaque effort compte", type: "expression" },
  { terme: "think globally, act locally", definition: "penser global, agir local", type: "expression" },
  { terme: "reduce, reuse, recycle", definition: "réduire, réutiliser, recycler", type: "expression" },
  { terme: "green fingers", definition: "avoir la main verte", type: "expression" },
  { terme: "breathe easy", definition: "être soulagé", type: "expression" },
  { terme: "run its course", definition: "suivre son cours", type: "expression" },
  { terme: "turn over a new leaf", definition: "prendre un nouveau départ", type: "expression" },
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