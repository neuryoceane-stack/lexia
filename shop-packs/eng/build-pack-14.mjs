/**
 * Pack 14 — Relations & émotions (langue eng).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  { terme: "friendship", definition: "amitié", type: "" },
  { terme: "relationship", definition: "relation amoureuse", type: "" },
  { terme: "partner", definition: "partenaire", type: "" },
  { terme: "couple", definition: "couple", type: "" },
  { terme: "crush", definition: "béguin", type: "" },
  { terme: "date", definition: "rendez-vous", type: "" },
  { terme: "trust", definition: "confiance", type: "" },
  { terme: "loyalty", definition: "loyauté", type: "" },
  { terme: "jealousy", definition: "jalousie", type: "" },
  { terme: "anger", definition: "colère", type: "" },
  { terme: "fear", definition: "peur", type: "" },
  { terme: "joy", definition: "joie", type: "" },
  { terme: "sadness", definition: "tristesse", type: "" },
  { terme: "grief", definition: "chagrin", type: "" },
  { terme: "pride", definition: "fierté", type: "" },
  { terme: "shame", definition: "honte", type: "" },
  { terme: "guilt", definition: "culpabilité", type: "" },
  { terme: "hope", definition: "espoir", type: "" },
  { terme: "envy", definition: "envie", type: "" },
  { terme: "lonely", definition: "seul", type: "" },
  { terme: "grateful", definition: "reconnaissant", type: "" },
  { terme: "ashamed", definition: "honteux", type: "" },
  { terme: "relieved", definition: "soulagé", type: "" },
  { terme: "anxious", definition: "anxieux", type: "" },
  { terme: "moody", definition: "lunaire", type: "" },
  { terme: "heartbroken", definition: "le cœur brisé", type: "" },
  { terme: "empathy", definition: "empathie", type: "" },
  { terme: "sympathy", definition: "sympathie", type: "" },
  { terme: "affection", definition: "affection", type: "" },
  { terme: "attachment", definition: "attachement", type: "" },
  { terme: "quarrel", definition: "dispute", type: "" },
  { terme: "argument", definition: "dispute verbale", type: "" },
  { terme: "apology", definition: "excuses", type: "" },
  { terme: "forgiveness", definition: "pardon", type: "" },
  { terme: "breakup", definition: "rupture", type: "" },
  { terme: "reconciliation", definition: "réconciliation", type: "" },
  { terme: "commitment", definition: "engagement", type: "" },
  { terme: "fidelity", definition: "fidélité", type: "" },
  { terme: "betrayal", definition: "trahison", type: "" },
  { terme: "secret", definition: "secret", type: "" },
  { terme: "confide", definition: "se confier", type: "" },
  { terme: "support", definition: "soutien", type: "" },
  { terme: "respect", definition: "respect", type: "" },
  { terme: "admire", definition: "estimer", type: "" },
  { terme: "comfort", definition: "réconfort", type: "" },
  { terme: "embrace", definition: "étreinte", type: "" },
  { terme: "hug", definition: "câlin", type: "" },
  { terme: "handshake", definition: "poignée de main", type: "" },
  { terme: "companion", definition: "compagnon", type: "" },
  { terme: "stranger", definition: "inconnu", type: "" },
  { terme: "acquaintance", definition: "connaissance", type: "" },
  { terme: "sibling", definition: "frère ou sœur", type: "" },
  { terme: "cousin", definition: "cousin", type: "" },
  { terme: "niece", definition: "nièce", type: "" },
  { terme: "nephew", definition: "neveu", type: "" },
  { terme: "godparent", definition: "parrain ou marraine", type: "" },
  { terme: "stepmother", definition: "belle-mère", type: "" },
  { terme: "stepson", definition: "beau-fils", type: "" },
  { terme: "widow", definition: "veuve", type: "" },
  { terme: "orphan", definition: "orphelin", type: "" },
  { terme: "argumentative", definition: "querelleur", type: "" },
  { terme: "considerate", definition: "attentionné", type: "" },
  { terme: "clingy", definition: "collant", type: "" },
  { terme: "heartfelt", definition: "sincère", type: "" },
  { terme: "emotional", definition: "émotif", type: "" },
  { terme: "in-laws", definition: "belle-famille", type: "" },
  { terme: "fall out", definition: "tu te disputes", type: "" },
  { terme: "make up", definition: "tu te réconcilies", type: "" },
  { terme: "break up", definition: "tu romps", type: "" },
  { terme: "get along", definition: "tu t'entends bien", type: "" },
  { terme: "open up", definition: "tu t'ouvres", type: "" },
  { terme: "cheer up", definition: "tu te remontes le moral", type: "" },
  { terme: "let down", definition: "tu déçois", type: "" },
  { terme: "count on", definition: "tu comptes sur", type: "" },
  { terme: "stand by", definition: "tu restes fidèle", type: "" },
  { terme: "lash out", definition: "tu t'en prends à", type: "" },
  { terme: "warm to", definition: "tu prends de l'affection pour", type: "" },
  { terme: "grow apart", definition: "tu t'éloignes", type: "" },
  { terme: "hold back", definition: "tu te retiens émotionnellement", type: "" },
  { terme: "snap at", definition: "tu t'énerves contre", type: "" },
  { terme: "love at first sight", definition: "coup de foudre", type: "expression" },
  { terme: "tie the knot", definition: "tu te maries", type: "expression" },
  { terme: "hit it off", definition: "tu entres en symbiose", type: "expression" },
  { terme: "on the rocks", definition: "en mauvaise passe (couple)", type: "expression" },
  { terme: "give someone the cold shoulder", definition: "tu ignores quelqu'un", type: "expression" },
  { terme: "wear your heart on your sleeve", definition: "tu montres tes sentiments", type: "expression" },
  { terme: "a shoulder to cry on", definition: "une épaule sur laquelle pleurer", type: "expression" },
  { terme: "burn bridges", definition: "tu coupes les ponts", type: "expression" },
  { terme: "bury the hatchet", definition: "tu enterres la hache de guerre", type: "expression" },
  { terme: "thick as thieves", definition: "inséparables", type: "expression" },
  { terme: "birds of a feather", definition: "qui se ressemblent s'assemblent", type: "expression" },
  { terme: "a fair-weather friend", definition: "un ami des beaux jours", type: "expression" },
  { terme: "blood is thicker than water", definition: "le sang ne ment pas", type: "expression" },
  { terme: "out of sight, out of mind", definition: "loin des yeux, loin du cœur", type: "expression" },
  { terme: "actions speak louder than words", definition: "les actes valent mieux que les mots", type: "expression" },
  { terme: "no hard feelings", definition: "sans rancune", type: "expression" },
  { terme: "catch feelings", definition: "tu tombes amoureux", type: "expression" },
  { terme: "the green-eyed monster", definition: "la jalousie", type: "expression" },
  { terme: "a heavy heart", definition: "le cœur lourd", type: "expression" },
  { terme: "keep your chin up", definition: "garde la tête haute", type: "expression" },
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