/**
 * Pack 1 — Environnement & climat (langue ita).
 * Noms : article défini. (m.) ou (f.) seulement quand l'article l' ne montre pas le genre.
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "l'ambiente (m.)", definition: "environnement", type: "" },
  { terme: "il clima", definition: "climat", type: "" },
  { terme: "l'inquinamento atmosferico (m.)", definition: "pollution de l'air", type: "" },
  { terme: "il riciclaggio", definition: "recyclage", type: "" },
  { terme: "la sostenibilità", definition: "développement durable", type: "" },
  { terme: "l'ecosistema (m.)", definition: "écosystème", type: "" },
  { terme: "la biodiversità", definition: "biodiversité", type: "" },
  { terme: "il disboscamento", definition: "coupe rase", type: "" },
  { terme: "il gas serra", definition: "gaz à effet de serre", type: "" },
  { terme: "l'effetto serra (m.)", definition: "effet de serre", type: "" },
  { terme: "l'anidride carbonica (f.)", definition: "dioxyde de carbone", type: "" },
  { terme: "l'impronta di carbonio (f.)", definition: "empreinte carbone", type: "" },
  { terme: "il riscaldamento globale", definition: "réchauffement de la planète", type: "" },
  { terme: "il cambiamento climatico", definition: "dérèglement du climat", type: "" },
  { terme: "la siccità", definition: "sécheresse", type: "" },
  { terme: "l'alluvione (f.)", definition: "crue qui déborde", type: "" },
  { terme: "l'incendio boschivo (m.)", definition: "incendie de forêt", type: "" },
  { terme: "il permafrost", definition: "pergélisol", type: "" },
  { terme: "lo strato di ozono", definition: "couche d'ozone", type: "" },
  { terme: "la pioggia acida", definition: "pluie acide", type: "" },
  { terme: "la discarica", definition: "décharge", type: "" },
  { terme: "la pacciamatura", definition: "paillis", type: "" },
  { terme: "i rifiuti", definition: "ordures", type: "" },
  { terme: "i rifiuti abbandonati", definition: "détritus laissés par terre", type: "" },
  { terme: "il diserbante", definition: "désherbant", type: "" },
  { terme: "l'agricoltura biologica (f.)", definition: "agriculture biologique", type: "" },
  { terme: "la rinaturalizzazione", definition: "restauration d'un milieu naturel", type: "" },
  { terme: "la specie a rischio", definition: "espèce menacée", type: "" },
  { terme: "il corridoio ecologico", definition: "corridor écologique", type: "" },
  { terme: "l'estinzione di massa (f.)", definition: "disparition massive d'espèces", type: "" },
  { terme: "l'energia solare (f.)", definition: "énergie solaire", type: "" },
  { terme: "l'energia eolica (f.)", definition: "énergie éolienne", type: "" },
  { terme: "l'energia idroelettrica (f.)", definition: "énergie hydraulique", type: "" },
  { terme: "il combustibile fossile", definition: "combustible fossile", type: "" },
  { terme: "il carbone", definition: "charbon", type: "" },
  { terme: "la marea nera", definition: "marée noire", type: "" },
  { terme: "il percolato", definition: "liquide pollué qui s'écoule d'une décharge", type: "" },
  { terme: "la falda acquifera", definition: "nappe phréatique", type: "" },
  { terme: "l'arretramento della costa (m.)", definition: "recul du littoral", type: "" },
  { terme: "l'erosione del suolo (f.)", definition: "érosion du sol", type: "" },
  { terme: "biodegradabile", definition: "biodégradable", type: "" },
  { terme: "la plastica monouso", definition: "plastique à usage unique", type: "" },
  { terme: "il protossido di azoto", definition: "protoxyde d'azote", type: "" },
  { terme: "il rimboschimento", definition: "reboisement", type: "" },
  { terme: "neutro in carbonio", definition: "neutre en carbone", type: "" },
  { terme: "la qualità dell'aria", definition: "qualité de l'air", type: "" },
  { terme: "l'isola di calore (f.)", definition: "îlot de chaleur urbain", type: "" },
  { terme: "le acque reflue", definition: "eaux usées", type: "" },
  { terme: "i rifiuti pericolosi", definition: "déchets dangereux", type: "" },
  { terme: "la barriera corallina", definition: "récif corallien", type: "" },
  { terme: "la sovrapesca", definition: "surpêche", type: "" },
  { terme: "la riserva naturale", definition: "réserve naturelle", type: "" },
  { terme: "l'energia rinnovabile (f.)", definition: "énergie renouvelable", type: "" },
  { terme: "la specie invasiva", definition: "espèce introduite qui prolifère", type: "" },
  { terme: "la catena alimentare", definition: "chaîne alimentaire", type: "" },
  { terme: "la tutela del clima", definition: "protection du climat", type: "" },
  { terme: "l'auto elettrica (f.)", definition: "voiture électrique", type: "" },
  { terme: "l'ondata di calore (f.)", definition: "canicule", type: "" },
  { terme: "l'innalzamento del mare (m.)", definition: "hausse du niveau des mers", type: "" },
  { terme: "la microplastica", definition: "microplastique", type: "" },
  { terme: "la torbiera", definition: "tourbière", type: "" },
  { terme: "la centrale nucleare", definition: "centrale nucléaire", type: "" },
  { terme: "la transizione energetica", definition: "transition énergétique", type: "" },
  { terme: "la raccolta differenziata", definition: "tri des déchets", type: "" },
  { terme: "il pannello solare", definition: "panneau solaire", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "inquinare", definition: "polluer", type: "" },
  { terme: "riciclare", definition: "recycler", type: "" },
  { terme: "fare la raccolta differenziata", definition: "trier ses ordures", type: "" },
  { terme: "disboscare", definition: "abattre les arbres d'une parcelle", type: "" },
  { terme: "smaltire i rifiuti", definition: "envoyer des déchets au traitement", type: "" },
  { terme: "rimboschire", definition: "replanter une forêt", type: "" },
  { terme: "sciogliersi", definition: "fondre, pour la glace ou un glacier", type: "" },
  { terme: "prosciugarsi", definition: "s'assécher", type: "" },
  { terme: "emettere", definition: "relâcher un gaz ou un polluant", type: "" },
  { terme: "sprecare", definition: "gaspiller", type: "" },
  { terme: "estinguersi", definition: "disparaître en tant qu'espèce", type: "" },
  { terme: "depurare", definition: "épurer une eau", type: "" },
  { terme: "esaurire", definition: "épuiser une ressource", type: "" },
  { terme: "bonificare", definition: "assainir un terrain pollué", type: "" },
  { terme: "accumularsi", definition: "s'entasser peu à peu", type: "" },
  // —— 20 expressions ——
  { terme: "una goccia nel mare", definition: "effort trop petit pour changer quoi que ce soit", type: "expression" },
  { terme: "la punta dell'iceberg", definition: "partie visible d'un problème bien plus grand", type: "expression" },
  { terme: "piove sul bagnato", definition: "s'ajouter à des ennuis déjà là", type: "expression" },
  { terme: "non tutto il male viene per nuocere", definition: "tirer parti d'un inconvénient", type: "expression" },
  { terme: "dopo la pioggia viene il sereno", definition: "voir le calme revenir après une période dure", type: "expression" },
  { terme: "chi semina vento raccoglie tempesta", definition: "subir les conséquences d'une provocation", type: "expression" },
  { terme: "avere il pollice verde", definition: "faire pousser les plantes sans effort", type: "expression" },
  { terme: "navigare in cattive acque", definition: "traverser une période mauvaise", type: "expression" },
  { terme: "essere in alto mare", definition: "être encore très loin du résultat", type: "expression" },
  { terme: "tirare l'acqua al proprio mulino", definition: "tourner une situation à son profit", type: "expression" },
  { terme: "gettare acqua sul fuoco", definition: "apaiser une tension", type: "expression" },
  { terme: "fare terra bruciata", definition: "détruire ce qui pourrait encore servir", type: "expression" },
  { terme: "acqua passata non macina più", definition: "tenir une vieille affaire pour close", type: "expression" },
  { terme: "cadere dalle nuvole", definition: "apprendre une chose avec une totale surprise", type: "expression" },
  { terme: "salvare capra e cavoli", definition: "concilier deux intérêts opposés", type: "expression" },
  { terme: "predicare bene e razzolare male", definition: "ne pas faire ce que l'on recommande aux autres", type: "expression" },
  { terme: "essere una forza della natura", definition: "avoir une énergie hors du commun", type: "expression" },
  { terme: "piove a catinelle", definition: "pleuvoir à verse", type: "expression" },
  { terme: "non vedere al di là del proprio naso", definition: "manquer de la moindre vision d'ensemble", type: "expression" },
  { terme: "moltiplicarsi come i funghi", definition: "apparaître en très grand nombre", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-01-environnement.xlsx"));
