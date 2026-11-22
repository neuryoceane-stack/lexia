/**
 * Pack 14 — Relations & émotions (langue deu).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "die Freundschaft", definition: "amitié", type: "" },
  { terme: "die Beziehung", definition: "relation amoureuse", type: "" },
  { terme: "der Partner", definition: "partenaire", type: "" },
  { terme: "das Paar", definition: "couple", type: "" },
  { terme: "der Schwarm", definition: "béguin", type: "" },
  { terme: "die Verabredung", definition: "rendez-vous", type: "" },
  { terme: "das Vertrauen", definition: "confiance", type: "" },
  { terme: "die Treue", definition: "fidélité", type: "" },
  { terme: "die Eifersucht", definition: "jalousie", type: "" },
  { terme: "die Wut", definition: "colère", type: "" },
  { terme: "die Angst", definition: "peur", type: "" },
  { terme: "die Freude", definition: "joie", type: "" },
  { terme: "die Trauer", definition: "tristesse", type: "" },
  { terme: "der Kummer", definition: "chagrin", type: "" },
  { terme: "der Stolz", definition: "fierté", type: "" },
  { terme: "die Scham", definition: "honte", type: "" },
  { terme: "die Schuld", definition: "culpabilité", type: "" },
  { terme: "die Hoffnung", definition: "espoir", type: "" },
  { terme: "der Neid", definition: "envie", type: "" },
  { terme: "einsam", definition: "seul", type: "" },
  { terme: "dankbar", definition: "reconnaissant", type: "" },
  { terme: "beschämt", definition: "honteux", type: "" },
  { terme: "erleichtert", definition: "soulagé", type: "" },
  { terme: "ängstlich", definition: "anxieux", type: "" },
  { terme: "launisch", definition: "d'humeur changeante", type: "" },
  { terme: "untröstlich", definition: "inconsolable", type: "" },
  { terme: "die Empathie", definition: "empathie", type: "" },
  { terme: "das Mitgefühl", definition: "compassion", type: "" },
  { terme: "die Zuneigung", definition: "affection", type: "" },
  { terme: "die Bindung", definition: "attachement", type: "" },
  { terme: "der Streit", definition: "dispute", type: "" },
  { terme: "die Auseinandersetzung", definition: "explication tendue", type: "" },
  { terme: "die Entschuldigung", definition: "excuses", type: "" },
  { terme: "die Versöhnung", definition: "réconciliation", type: "" },
  { terme: "die Verlobung", definition: "fiançailles", type: "" },
  { terme: "der Verrat", definition: "trahison", type: "" },
  { terme: "das Geheimnis", definition: "secret", type: "" },
  { terme: "die Unterstützung", definition: "soutien", type: "" },
  { terme: "der Respekt", definition: "respect", type: "" },
  { terme: "die Umarmung", definition: "étreinte", type: "" },
  { terme: "der Kuss", definition: "baiser", type: "" },
  { terme: "der Händedruck", definition: "poignée de main", type: "" },
  { terme: "der Begleiter", definition: "compagnon", type: "" },
  { terme: "der Fremde", definition: "inconnu", type: "" },
  { terme: "der Bekannte", definition: "connaissance", type: "" },
  { terme: "die Geschwister", definition: "frères et sœurs", type: "" },
  { terme: "der Cousin", definition: "cousin", type: "" },
  { terme: "die Nichte", definition: "nièce", type: "" },
  { terme: "der Neffe", definition: "neveu", type: "" },
  { terme: "der Pate", definition: "parrain", type: "" },
  { terme: "die Stiefmutter", definition: "belle-mère", type: "" },
  { terme: "der Stiefsohn", definition: "beau-fils", type: "" },
  { terme: "die Witwe", definition: "veuve", type: "" },
  { terme: "das Waisenkind", definition: "orphelin", type: "" },
  { terme: "streitsüchtig", definition: "querelleur", type: "" },
  { terme: "rücksichtsvoll", definition: "attentionné", type: "" },
  { terme: "anhänglich", definition: "collant", type: "" },
  { terme: "herzlich", definition: "chaleureux", type: "" },
  { terme: "gefühlvoll", definition: "émotif", type: "" },
  { terme: "die Schwiegereltern", definition: "beaux-parents", type: "" },
  { terme: "die Hochzeit", definition: "mariage", type: "" },
  { terme: "die Trennung", definition: "rupture", type: "" },
  { terme: "das Missverständnis", definition: "malentendu", type: "" },
  { terme: "die Sehnsucht", definition: "manque d'une personne", type: "" },
  { terme: "sensibel", definition: "facilement blessé, pas « raisonnable »", type: "" },
  // —— 15 verbes à particule séparable ——
  { terme: "auskommen", definition: "s'entendre avec quelqu'un", type: "" },
  { terme: "anfreunden", definition: "se lier d'amitié", type: "" },
  { terme: "näherkommen", definition: "se rapprocher", type: "" },
  { terme: "auseinandergehen", definition: "se séparer", type: "" },
  { terme: "anvertrauen", definition: "confier un secret", type: "" },
  { terme: "aufheitern", definition: "redonner le sourire", type: "" },
  { terme: "fallenlassen", definition: "laisser tomber quelqu'un", type: "" },
  { terme: "nachtragen", definition: "garder rancune", type: "" },
  { terme: "beistehen", definition: "soutenir dans l'épreuve", type: "" },
  { terme: "anschreien", definition: "crier après quelqu'un", type: "" },
  { terme: "zuwenden", definition: "se tourner vers quelqu'un", type: "" },
  { terme: "abwenden", definition: "se détourner", type: "" },
  { terme: "mitfühlen", definition: "compatir", type: "" },
  { terme: "aufbauen", definition: "redonner confiance", type: "" },
  { terme: "einlenken", definition: "faire un pas pour apaiser", type: "" },
  // —— 20 expressions ——
  { terme: "Liebe auf den ersten Blick", definition: "coup de foudre", type: "expression" },
  { terme: "den Bund fürs Leben schließen", definition: "se marier", type: "expression" },
  { terme: "auf einer Wellenlänge sein", definition: "être sur la même longueur d'onde", type: "expression" },
  { terme: "auf der Kippe stehen", definition: "être menacé de rupture", type: "expression" },
  { terme: "jemanden links liegen lassen", definition: "ignorer complètement quelqu'un", type: "expression" },
  { terme: "das Herz auf der Zunge tragen", definition: "montrer ses sentiments sans les cacher", type: "expression" },
  { terme: "eine Schulter zum Anlehnen", definition: "une présence sur qui s'appuyer", type: "expression" },
  { terme: "die Brücken abbrechen", definition: "couper les ponts", type: "expression" },
  { terme: "das Kriegsbeil begraben", definition: "mettre fin à une querelle", type: "expression" },
  { terme: "dicke Freunde sein", definition: "être inséparables", type: "expression" },
  { terme: "gleich und gleich gesellt sich gern", definition: "attirance entre personnes semblables", type: "expression" },
  { terme: "ein Schönwetterfreund", definition: "un ami seulement dans les bons moments", type: "expression" },
  { terme: "Blut ist dicker als Wasser", definition: "les liens du sang passent avant le reste", type: "expression" },
  { terme: "aus den Augen, aus dem Sinn", definition: "loin des yeux, loin du cœur", type: "expression" },
  { terme: "nichts für ungut", definition: "sans rancune", type: "expression" },
  { terme: "sich verknallen", definition: "tomber amoureux", type: "expression" },
  { terme: "gelb vor Neid sein", definition: "être dévoré par la jalousie", type: "expression" },
  { terme: "mit schwerem Herzen", definition: "à contrecœur, le cœur gros", type: "expression" },
  { terme: "Kopf hoch", definition: "garder la tête haute", type: "expression" },
  { terme: "jemanden auf die Palme bringen", definition: "mettre quelqu'un hors de soi", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-14-relations-emotions.xlsx"));
