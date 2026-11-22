/**
 * Pack 5 — Santé & corps (langue eng).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  { terme: "pain", definition: "douleur", type: "" },
  { terme: "fever", definition: "fièvre", type: "" },
  { terme: "cough", definition: "toux", type: "" },
  { terme: "cold", definition: "rhume", type: "" },
  { terme: "flu", definition: "grippe", type: "" },
  { terme: "ache", definition: "mal", type: "" },
  { terme: "wound", definition: "blessure", type: "" },
  { terme: "bone", definition: "os", type: "" },
  { terme: "muscle", definition: "muscle", type: "" },
  { terme: "skin", definition: "peau", type: "" },
  { terme: "blood", definition: "sang", type: "" },
  { terme: "heart", definition: "cœur", type: "" },
  { terme: "lung", definition: "poumon", type: "" },
  { terme: "pill", definition: "comprimé", type: "" },
  { terme: "dose", definition: "dose", type: "" },
  { terme: "nurse", definition: "infirmier", type: "" },
  { terme: "doctor", definition: "médecin", type: "" },
  { terme: "patient", definition: "patient", type: "" },
  { terme: "clinic", definition: "clinique", type: "" },
  { terme: "ward", definition: "service hospitalier", type: "" },
  { terme: "surgery", definition: "chirurgie", type: "" },
  { terme: "scan", definition: "scanner", type: "" },
  { terme: "x-ray", definition: "radiographie", type: "" },
  { terme: "vaccine", definition: "vaccin", type: "" },
  { terme: "allergy", definition: "allergie", type: "" },
  { terme: "asthma", definition: "asthme", type: "" },
  { terme: "rash", definition: "éruption cutanée", type: "" },
  { terme: "pulse", definition: "pouls", type: "" },
  { terme: "breath", definition: "souffle", type: "" },
  { terme: "diet", definition: "régime alimentaire", type: "" },
  { terme: "sleep", definition: "sommeil", type: "" },
  { terme: "stress", definition: "stress", type: "" },
  { terme: "therapy", definition: "thérapie", type: "" },
  { terme: "symptom", definition: "symptôme", type: "" },
  { terme: "recovery", definition: "guérison", type: "" },
  { terme: "emergency", definition: "urgence", type: "" },
  { terme: "ambulance", definition: "ambulance", type: "" },
  { terme: "pharmacy", definition: "pharmacie", type: "" },
  { terme: "prescription", definition: "ordonnance", type: "" },
  { terme: "bandage", definition: "bandage", type: "" },
  { terme: "infection", definition: "infection", type: "" },
  { terme: "virus", definition: "virus", type: "" },
  { terme: "bacteria", definition: "bactérie", type: "" },
  { terme: "wheelchair", definition: "fauteuil roulant", type: "" },
  { terme: "crutch", definition: "béquille", type: "" },
  { terme: "chronic", definition: "chronique", type: "" },
  { terme: "acute", definition: "aigu", type: "" },
  { terme: "check-up", definition: "bilan de santé", type: "" },
  { terme: "side effect", definition: "effet secondaire", type: "" },
  { terme: "immune system", definition: "système immunitaire", type: "" },
  { terme: "mental health", definition: "santé mentale", type: "" },
  { terme: "wellbeing", definition: "bien-être", type: "" },
  { terme: "diagnosis", definition: "diagnostic", type: "" },
  { terme: "treatment", definition: "traitement", type: "" },
  { terme: "blood test", definition: "analyse de sang", type: "" },
  { terme: "sore throat", definition: "mal de gorge", type: "" },
  { terme: "first aid", definition: "premiers secours", type: "" },
  { terme: "life expectancy", definition: "espérance de vie", type: "" },
  { terme: "operating theatre", definition: "bloc opératoire", type: "" },
  { terme: "intensive care", definition: "soins intensifs", type: "" },
  { terme: "GP", definition: "médecin généraliste", type: "" },
  { terme: "surgeon", definition: "chirurgien", type: "" },
  { terme: "paramedic", definition: "ambulancier", type: "" },
  { terme: "stretcher", definition: "brancard", type: "" },
  { terme: "hygiene", definition: "hygiène", type: "" },
  { terme: "throw up", definition: "vomir", type: "" },
  { terme: "pass out", definition: "s'évanouir", type: "" },
  { terme: "come round", definition: "reprendre connaissance", type: "" },
  { terme: "pass away", definition: "décéder", type: "" },
  { terme: "pull through", definition: "s'en sortir", type: "" },
  { terme: "break out", definition: "éclater", type: "" },
  { terme: "fight off", definition: "vaincre (une maladie)", type: "" },
  { terme: "come down with", definition: "être atteint de", type: "" },
  { terme: "get over", definition: "guérir de", type: "" },
  { terme: "bandage up", definition: "bander, panser", type: "" },
  { terme: "check up on", definition: "contrôler l'état de", type: "" },
  { terme: "ward off", definition: "éloigner", type: "" },
  { terme: "work out", definition: "faire du sport", type: "" },
  { terme: "warm up", definition: "s'échauffer", type: "" },
  { terme: "calm down", definition: "se calmer", type: "" },
  { terme: "an apple a day keeps the doctor away", definition: "une pomme par jour éloigne le médecin", type: "expression" },
  { terme: "under the weather", definition: "ne pas être en forme", type: "expression" },
  { terme: "fit as a fiddle", definition: "en pleine forme", type: "expression" },
  { terme: "on the mend", definition: "en voie de guérison", type: "expression" },
  { terme: "a clean bill of health", definition: "bonne santé attestée", type: "expression" },
  { terme: "take your breath away", definition: "couper le souffle", type: "expression" },
  { terme: "break a leg", definition: "bonne chance (se dit à un artiste avant de monter sur scène)", type: "expression" },
  { terme: "pain in the neck", definition: "casse-pied", type: "expression" },
  { terme: "fresh as a daisy", definition: "frais comme une rose", type: "expression" },
  { terme: "out of shape", definition: "pas en forme", type: "expression" },
  { terme: "black and blue", definition: "tout meurtri", type: "expression" },
  { terme: "bounce back", definition: "se rétablir", type: "expression" },
  { terme: "in safe hands", definition: "entre de bonnes mains", type: "expression" },
  { terme: "on your last legs", definition: "à bout de forces", type: "expression" },
  { terme: "full of beans", definition: "plein d'énergie", type: "expression" },
  { terme: "run down", definition: "épuisé", type: "expression" },
  { terme: "a bitter pill to swallow", definition: "une pilule difficile à avaler", type: "expression" },
  { terme: "the picture of health", definition: "l'image même de la santé", type: "expression" },
  { terme: "at death's door", definition: "aux portes de la mort", type: "expression" },
  { terme: "green around the gills", definition: "avoir l'air malade", type: "expression" },
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