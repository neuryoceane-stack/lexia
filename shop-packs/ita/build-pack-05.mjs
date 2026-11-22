/**
 * Pack 5 — Santé & corps (langue ita).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "il dolore", definition: "douleur", type: "" },
  { terme: "la febbre", definition: "fièvre", type: "" },
  { terme: "la tosse", definition: "toux", type: "" },
  { terme: "il raffreddore", definition: "rhume", type: "" },
  { terme: "l'influenza (f.)", definition: "grippe", type: "" },
  { terme: "la ferita", definition: "plaie", type: "" },
  { terme: "l'osso (m.)", definition: "os", type: "" },
  { terme: "il muscolo", definition: "muscle", type: "" },
  { terme: "la pelle", definition: "peau", type: "" },
  { terme: "il sangue", definition: "sang", type: "" },
  { terme: "il cuore", definition: "cœur, l'organe", type: "" },
  { terme: "il polmone", definition: "poumon", type: "" },
  { terme: "la compressa", definition: "comprimé", type: "" },
  { terme: "la dose", definition: "dose", type: "" },
  { terme: "l'infermiere (m.)", definition: "infirmier ; au féminin, infermiera", type: "" },
  { terme: "il medico", definition: "médecin", type: "" },
  { terme: "il paziente", definition: "personne soignée", type: "" },
  { terme: "l'ambulatorio (m.)", definition: "cabinet médical", type: "" },
  { terme: "il reparto", definition: "service d'hospitalisation", type: "" },
  { terme: "l'intervento chirurgico (m.)", definition: "opération chirurgicale", type: "" },
  { terme: "la radiografia", definition: "radiographie", type: "" },
  { terme: "il vaccino", definition: "vaccin", type: "" },
  { terme: "l'allergia (f.)", definition: "allergie", type: "" },
  { terme: "l'asma (f.)", definition: "asthme", type: "" },
  { terme: "l'eruzione cutanea (f.)", definition: "éruption cutanée", type: "" },
  { terme: "il battito", definition: "battement cardiaque", type: "" },
  { terme: "il respiro", definition: "souffle", type: "" },
  { terme: "l'alimentazione (f.)", definition: "alimentation", type: "" },
  { terme: "il sonno", definition: "sommeil", type: "" },
  { terme: "lo stress", definition: "stress", type: "" },
  { terme: "la terapia", definition: "thérapie", type: "" },
  { terme: "il sintomo", definition: "symptôme", type: "" },
  { terme: "la guarigione", definition: "guérison", type: "" },
  { terme: "l'emergenza (f.)", definition: "urgence", type: "" },
  { terme: "l'ambulanza (f.)", definition: "ambulance", type: "" },
  { terme: "la farmacia", definition: "pharmacie", type: "" },
  { terme: "la ricetta", definition: "ordonnance médicale ; en cuisine, le mot veut dire recette", type: "" },
  { terme: "la fasciatura", definition: "bandage", type: "" },
  { terme: "l'infezione (f.)", definition: "infection", type: "" },
  { terme: "il virus", definition: "virus", type: "" },
  { terme: "il batterio", definition: "bactérie", type: "" },
  { terme: "la sedia a rotelle", definition: "fauteuil roulant", type: "" },
  { terme: "la stampella", definition: "béquille", type: "" },
  { terme: "cronico", definition: "chronique", type: "" },
  { terme: "acuto", definition: "aigu, pour un symptôme", type: "" },
  { terme: "il controllo di prevenzione", definition: "bilan de prévention", type: "" },
  { terme: "l'effetto indesiderato (m.)", definition: "effet indésirable d'un traitement", type: "" },
  { terme: "il sistema immunitario", definition: "système immunitaire", type: "" },
  { terme: "la salute mentale", definition: "santé mentale", type: "" },
  { terme: "il cerotto", definition: "pansement", type: "" },
  { terme: "la diagnosi", definition: "diagnostic", type: "" },
  { terme: "la cura", definition: "traitement prescrit par un médecin", type: "" },
  { terme: "le analisi del sangue", definition: "analyse de sang", type: "" },
  { terme: "il mal di gola", definition: "mal de gorge", type: "" },
  { terme: "il pronto soccorso", definition: "service des urgences", type: "" },
  { terme: "la speranza di vita", definition: "espérance de vie", type: "" },
  { terme: "la sala operatoria", definition: "bloc opératoire", type: "" },
  { terme: "la terapia intensiva", definition: "soins intensifs", type: "" },
  { terme: "il medico di base", definition: "médecin traitant", type: "" },
  { terme: "il chirurgo", definition: "chirurgien", type: "" },
  { terme: "il soccorritore", definition: "secouriste", type: "" },
  { terme: "la tessera sanitaria", definition: "carte d'assuré social, en Italie", type: "" },
  { terme: "l'igiene (f.)", definition: "hygiène", type: "" },
  { terme: "il veleno", definition: "poison", type: "" },
  { terme: "la puntura", definition: "piqûre", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "gonfiarsi", definition: "enfler", type: "" },
  { terme: "guarire", definition: "guérir", type: "" },
  { terme: "reggere", definition: "tenir le coup", type: "" },
  { terme: "sdraiarsi", definition: "s'allonger", type: "" },
  { terme: "alzarsi", definition: "se lever", type: "" },
  { terme: "prendere una medicina", definition: "avaler un médicament", type: "" },
  { terme: "attenuarsi", definition: "s'atténuer", type: "" },
  { terme: "manifestarsi", definition: "se déclarer, pour une maladie", type: "" },
  { terme: "ingrassare", definition: "prendre du poids", type: "" },
  { terme: "dimagrire", definition: "perdre du poids", type: "" },
  { terme: "svegliarsi", definition: "se réveiller", type: "" },
  { terme: "addormentarsi", definition: "s'endormir", type: "" },
  { terme: "riposarsi", definition: "se reposer", type: "" },
  { terme: "crollare", definition: "s'effondrer", type: "" },
  { terme: "lasciare strascichi", definition: "laisser des suites après une maladie", type: "" },
  // —— 20 expressions ——
  { terme: "essere giù di corda", definition: "être en petite forme", type: "expression" },
  { terme: "scoppiare di salute", definition: "respirer la santé", type: "expression" },
  { terme: "prevenire è meglio che curare", definition: "éviter le mal avant d'avoir à le soigner", type: "expression" },
  { terme: "mozzare il fiato", definition: "couper le souffle", type: "expression" },
  { terme: "sentirsi rinato", definition: "se sentir comme neuf", type: "expression" },
  { terme: "sudare freddo", definition: "avoir une sueur d'angoisse", type: "expression" },
  { terme: "rimettersi in sesto", definition: "se remettre d'aplomb", type: "expression" },
  { terme: "essere in buone mani", definition: "être bien pris en charge", type: "expression" },
  { terme: "essere allo stremo", definition: "être à bout de forces", type: "expression" },
  { terme: "essere a pezzi", definition: "être lessivé", type: "expression" },
  { terme: "ingoiare il rospo", definition: "accepter une chose pénible sans protester", type: "expression" },
  { terme: "avere un piede nella fossa", definition: "être dans un état critique", type: "expression" },
  { terme: "avere lo stomaco sottosopra", definition: "avoir la nausée", type: "expression" },
  { terme: "ricaricare le pile", definition: "retrouver de l'énergie en se reposant", type: "expression" },
  { terme: "salvarsi per un pelo", definition: "échapper de justesse à un danger", type: "expression" },
  { terme: "vedere le stelle", definition: "avoir si mal qu'on en est sonné", type: "expression" },
  { terme: "essere sano come un pesce", definition: "être en excellente santé", type: "expression" },
  { terme: "essere pelle e ossa", definition: "n'avoir plus que la peau sur les os", type: "expression" },
  { terme: "dormire come un ghiro", definition: "dormir d'un sommeil très lourd", type: "expression" },
  { terme: "il rimedio è peggiore del male", definition: "aggraver la situation en voulant la réparer", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-05-sante-corps.xlsx"));
