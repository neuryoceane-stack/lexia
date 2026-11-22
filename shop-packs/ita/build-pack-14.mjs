/**
 * Pack 14 — Relations & émotions (langue ita).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "l'amicizia (f.)", definition: "amitié", type: "" },
  { terme: "l'amore (m.)", definition: "amour", type: "" },
  { terme: "i genitori", definition: "père et mère", type: "" },
  { terme: "i parenti", definition: "famille élargie, pas le père et la mère", type: "" },
  { terme: "il fratello", definition: "frère", type: "" },
  { terme: "la sorella", definition: "sœur", type: "" },
  { terme: "il figlio", definition: "fils", type: "" },
  { terme: "la figlia", definition: "fille", type: "" },
  { terme: "il nonno", definition: "grand-père", type: "" },
  { terme: "la nonna", definition: "grand-mère", type: "" },
  { terme: "lo zio", definition: "oncle", type: "" },
  { terme: "la zia", definition: "tante", type: "" },
  { terme: "il cugino", definition: "cousin", type: "" },
  { terme: "la cugina", definition: "cousine", type: "" },
  { terme: "il nipote", definition: "petit-fils ou neveu, selon le contexte", type: "" },
  { terme: "la nipote", definition: "petite-fille ou nièce, selon le contexte", type: "" },
  { terme: "la suocera", definition: "belle-mère, mère du conjoint", type: "" },
  { terme: "il genero", definition: "gendre", type: "" },
  { terme: "la nuora", definition: "bru", type: "" },
  { terme: "il patrigno", definition: "beau-père, nouvel époux de la mère", type: "" },
  { terme: "la matrigna", definition: "belle-mère, nouvelle épouse du père", type: "" },
  { terme: "il fidanzato", definition: "fiancé, ou petit ami", type: "" },
  { terme: "la fidanzata", definition: "fiancée, ou petite amie", type: "" },
  { terme: "il marito", definition: "mari", type: "" },
  { terme: "la moglie", definition: "épouse", type: "" },
  { terme: "il matrimonio", definition: "mariage", type: "" },
  { terme: "il divorzio", definition: "divorce", type: "" },
  { terme: "la separazione", definition: "séparation d'un couple", type: "" },
  { terme: "la fiducia", definition: "confiance", type: "" },
  { terme: "la gelosia", definition: "jalousie", type: "" },
  { terme: "la rabbia", definition: "colère", type: "" },
  { terme: "la paura", definition: "peur", type: "" },
  { terme: "la gioia", definition: "joie", type: "" },
  { terme: "la tristezza", definition: "tristesse", type: "" },
  { terme: "la vergogna", definition: "honte", type: "" },
  { terme: "la speranza", definition: "espoir", type: "" },
  { terme: "l'invidia (f.)", definition: "envie", type: "" },
  { terme: "la nostalgia", definition: "manque d'une personne ou d'un lieu", type: "" },
  { terme: "il rimorso", definition: "remords", type: "" },
  { terme: "solo", definition: "seul", type: "" },
  { terme: "sensibile", definition: "qui se blesse facilement ; sensé se dit sensato", type: "" },
  { terme: "l'abbraccio (m.)", definition: "étreinte", type: "" },
  { terme: "il bacio", definition: "baiser", type: "" },
  { terme: "la stretta di mano", definition: "poignée de main", type: "" },
  { terme: "il litigio", definition: "dispute", type: "" },
  { terme: "le scuse", definition: "excuses", type: "" },
  { terme: "il tradimento", definition: "trahison", type: "" },
  { terme: "il segreto", definition: "secret", type: "" },
  { terme: "il rispetto", definition: "respect", type: "" },
  { terme: "il sostegno", definition: "soutien", type: "" },
  { terme: "il vedovo", definition: "veuf", type: "" },
  { terme: "l'orfano (m.)", definition: "orphelin", type: "" },
  { terme: "i suoceri", definition: "beaux-parents", type: "" },
  { terme: "il perdono", definition: "pardon", type: "" },
  { terme: "la confidenza", definition: "confidence", type: "" },
  { terme: "la risata", definition: "éclat de rire", type: "" },
  { terme: "la lacrima", definition: "larme", type: "" },
  { terme: "il sorriso", definition: "sourire", type: "" },
  { terme: "l'umore (m.)", definition: "humeur", type: "" },
  { terme: "la delusione", definition: "déception", type: "" },
  { terme: "l'orgoglio (m.)", definition: "fierté", type: "" },
  { terme: "la tenerezza", definition: "tendresse", type: "" },
  { terme: "il compagno", definition: "compagnon", type: "" },
  { terme: "l'estraneo (m.)", definition: "inconnu, une personne étrangère au cercle", type: "" },
  { terme: "il conoscente", definition: "connaissance, pas un ami proche", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "amare", definition: "aimer d'amour", type: "" },
  { terme: "voler bene", definition: "éprouver de l'affection", type: "" },
  { terme: "innamorarsi", definition: "tomber amoureux", type: "" },
  { terme: "lasciarsi", definition: "rompre, pour un couple", type: "" },
  { terme: "litigare", definition: "se disputer", type: "" },
  { terme: "fare la pace", definition: "se réconcilier", type: "" },
  { terme: "fidarsi", definition: "faire confiance", type: "" },
  { terme: "arrabbiarsi", definition: "se mettre en colère", type: "" },
  { terme: "prendersela", definition: "le prendre pour soi, se vexer", type: "" },
  { terme: "andare d'accordo", definition: "bien s'entendre", type: "" },
  { terme: "mancare", definition: "manquer à quelqu'un, sur le même modèle qu'en français", type: "" },
  { terme: "dare del tu", definition: "tutoyer", type: "" },
  { terme: "dare del lei", definition: "vouvoyer", type: "" },
  { terme: "contare su", definition: "compter sur quelqu'un", type: "" },
  { terme: "chiedere scusa", definition: "présenter des excuses", type: "" },
  // —— 20 expressions ——
  { terme: "un colpo di fulmine", definition: "coup de foudre", type: "expression" },
  { terme: "rompere il ghiaccio", definition: "détendre une première rencontre", type: "expression" },
  { terme: "avere le farfalle nello stomaco", definition: "ressentir le trouble amoureux", type: "expression" },
  { terme: "acqua in bocca", definition: "ne rien révéler d'un secret", type: "expression" },
  { terme: "essere in rotta", definition: "être en froid avec quelqu'un", type: "expression" },
  { terme: "tagliare i ponti", definition: "cesser toute relation", type: "expression" },
  { terme: "sotterrare l'ascia di guerra", definition: "mettre fin à une querelle", type: "expression" },
  { terme: "amici per la pelle", definition: "être inséparables", type: "expression" },
  { terme: "lontano dagli occhi, lontano dal cuore", definition: "oublier les gens qu'on ne voit plus", type: "expression" },
  { terme: "senza rancore", definition: "accepter de ne garder aucune rancune", type: "expression" },
  { terme: "avere il cuore in gola", definition: "sentir son cœur s'emballer sous le coup de l'émotion", type: "expression" },
  { terme: "tenere il broncio", definition: "bouder", type: "expression" },
  { terme: "fare una scenata", definition: "faire une scène à quelqu'un", type: "expression" },
  { terme: "buono come il pane", definition: "être d'une grande gentillesse", type: "expression" },
  { terme: "piangere lacrime di coccodrillo", definition: "montrer un regret qu'on ne ressent pas", type: "expression" },
  { terme: "farsi il sangue amaro", definition: "se ronger les sangs", type: "expression" },
  { terme: "il sangue non è acqua", definition: "les liens du sang passent avant le reste", type: "expression" },
  { terme: "meglio soli che male accompagnati", definition: "préférer la solitude à une mauvaise compagnie", type: "expression" },
  { terme: "chi si somiglia si piglia", definition: "s'attirer entre personnes semblables", type: "expression" },
  { terme: "tra i due litiganti il terzo gode", definition: "tirer profit de la dispute de deux autres", type: "expression" },
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
