/**
 * Pack 5 — Santé & corps (langue deu).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "der Schmerz", definition: "douleur", type: "" },
  { terme: "das Fieber", definition: "fièvre", type: "" },
  { terme: "der Husten", definition: "toux", type: "" },
  { terme: "die Erkältung", definition: "rhume", type: "" },
  { terme: "die Grippe", definition: "grippe", type: "" },
  { terme: "die Wunde", definition: "plaie", type: "" },
  { terme: "der Knochen", definition: "os", type: "" },
  { terme: "der Muskel", definition: "muscle", type: "" },
  { terme: "die Haut", definition: "peau", type: "" },
  { terme: "das Blut", definition: "sang", type: "" },
  { terme: "das Herz", definition: "cœur", type: "" },
  { terme: "die Lunge", definition: "poumon", type: "" },
  { terme: "die Tablette", definition: "comprimé", type: "" },
  { terme: "die Dosis", definition: "dose", type: "" },
  { terme: "die Pflegekraft", definition: "soignant", type: "" },
  { terme: "der Arzt", definition: "médecin", type: "" },
  { terme: "der Patient", definition: "patient", type: "" },
  { terme: "die Arztpraxis", definition: "cabinet médical", type: "" },
  { terme: "die Krankenstation", definition: "service d'hospitalisation", type: "" },
  { terme: "die Operation", definition: "opération chirurgicale", type: "" },
  { terme: "das Röntgenbild", definition: "radiographie", type: "" },
  { terme: "die Impfung", definition: "vaccination", type: "" },
  { terme: "die Allergie", definition: "allergie", type: "" },
  { terme: "das Asthma", definition: "asthme", type: "" },
  { terme: "der Hautausschlag", definition: "éruption cutanée", type: "" },
  { terme: "der Puls", definition: "pouls", type: "" },
  { terme: "der Atem", definition: "souffle", type: "" },
  { terme: "die Ernährung", definition: "alimentation", type: "" },
  { terme: "der Schlaf", definition: "sommeil", type: "" },
  { terme: "der Stress", definition: "stress", type: "" },
  { terme: "die Therapie", definition: "thérapie", type: "" },
  { terme: "das Symptom", definition: "symptôme", type: "" },
  { terme: "die Genesung", definition: "guérison", type: "" },
  { terme: "der Notfall", definition: "urgence", type: "" },
  { terme: "der Krankenwagen", definition: "ambulance", type: "" },
  { terme: "die Apotheke", definition: "pharmacie", type: "" },
  { terme: "das Rezept", definition: "ordonnance", type: "" },
  { terme: "der Verband", definition: "bandage", type: "" },
  { terme: "die Infektion", definition: "infection", type: "" },
  { terme: "das Virus", definition: "virus", type: "" },
  { terme: "das Bakterium", definition: "bactérie", type: "" },
  { terme: "der Rollstuhl", definition: "fauteuil roulant", type: "" },
  { terme: "die Krücke", definition: "béquille", type: "" },
  { terme: "chronisch", definition: "chronique", type: "" },
  { terme: "akut", definition: "aigu", type: "" },
  { terme: "die Vorsorgeuntersuchung", definition: "bilan de prévention", type: "" },
  { terme: "die Nebenwirkung", definition: "effet indésirable d'un traitement", type: "" },
  { terme: "das Immunsystem", definition: "système immunitaire", type: "" },
  { terme: "die psychische Gesundheit", definition: "santé mentale", type: "" },
  { terme: "das Pflaster", definition: "pansement", type: "" },
  { terme: "die Diagnose", definition: "diagnostic", type: "" },
  { terme: "die Behandlung", definition: "traitement", type: "" },
  { terme: "das Blutbild", definition: "analyse de sang", type: "" },
  { terme: "die Halsschmerzen", definition: "mal de gorge", type: "" },
  { terme: "die Erste Hilfe", definition: "premiers secours", type: "" },
  { terme: "die Lebenserwartung", definition: "espérance de vie", type: "" },
  { terme: "der Operationssaal", definition: "bloc opératoire", type: "" },
  { terme: "die Intensivstation", definition: "soins intensifs", type: "" },
  { terme: "der Hausarzt", definition: "médecin traitant", type: "" },
  { terme: "der Chirurg", definition: "chirurgien", type: "" },
  { terme: "der Rettungssanitäter", definition: "ambulancier", type: "" },
  { terme: "die Krankenkasse", definition: "caisse d'assurance maladie", type: "" },
  { terme: "die Hygiene", definition: "hygiène", type: "" },
  { terme: "das Gift", definition: "poison", type: "" },
  { terme: "die Spritze", definition: "piqûre", type: "" },
  // —— 15 verbes à particule séparable ——
  { terme: "anschwellen", definition: "enfler", type: "" },
  { terme: "auskurieren", definition: "soigner jusqu'au bout", type: "" },
  { terme: "durchhalten", definition: "tenir bon", type: "" },
  { terme: "sich hinlegen", definition: "s'allonger", type: "" },
  { terme: "aufstehen", definition: "se lever", type: "" },
  { terme: "einnehmen", definition: "avaler un médicament", type: "" },
  { terme: "abklingen", definition: "s'atténuer", type: "" },
  { terme: "ausbrechen", definition: "se déclarer (maladie)", type: "" },
  { terme: "zunehmen", definition: "prendre du poids", type: "" },
  { terme: "abnehmen", definition: "perdre du poids", type: "" },
  { terme: "aufwachen", definition: "se réveiller", type: "" },
  { terme: "einschlafen", definition: "s'endormir", type: "" },
  { terme: "sich ausruhen", definition: "se reposer", type: "" },
  { terme: "zusammenbrechen", definition: "s'effondrer", type: "" },
  { terme: "nachwirken", definition: "continuer d'agir après coup", type: "" },
  // —— 20 expressions ——
  { terme: "nicht auf dem Damm sein", definition: "ne pas être en forme", type: "expression" },
  { terme: "fit wie ein Turnschuh sein", definition: "pétiller de santé", type: "expression" },
  { terme: "auf dem Weg der Besserung sein", definition: "aller vers la guérison", type: "expression" },
  { terme: "vor Gesundheit strotzen", definition: "respirer la santé", type: "expression" },
  { terme: "den Atem verschlagen", definition: "couper le souffle", type: "expression" },
  { terme: "wie neugeboren sein", definition: "se sentir comme neuf", type: "expression" },
  { terme: "nicht in Form sein", definition: "manquer de condition physique", type: "expression" },
  { terme: "grün und blau geschlagen sein", definition: "être couvert de bleus", type: "expression" },
  { terme: "wieder auf die Beine kommen", definition: "se remettre d'aplomb", type: "expression" },
  { terme: "in guten Händen sein", definition: "être bien pris en charge", type: "expression" },
  { terme: "auf dem letzten Loch pfeifen", definition: "être à bout de forces", type: "expression" },
  { terme: "vor Energie strotzen", definition: "déborder d'énergie", type: "expression" },
  { terme: "fix und fertig sein", definition: "être lessivé, ou bien tout à fait prêt", type: "expression" },
  { terme: "eine bittere Pille schlucken", definition: "devoir accepter une chose pénible", type: "expression" },
  { terme: "mit einem Bein im Grab stehen", definition: "être dans un état critique", type: "expression" },
  { terme: "speiübel sein", definition: "être pris de nausée", type: "expression" },
  { terme: "die Seele baumeln lassen", definition: "se détendre sans rien faire", type: "expression" },
  { terme: "gute Besserung", definition: "souhait de prompt rétablissement", type: "expression" },
  { terme: "über den Berg sein", definition: "avoir passé le plus dur", type: "expression" },
  { terme: "jemanden aufpäppeln", definition: "retaper quelqu'un par les soins et la nourriture", type: "expression" },
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
