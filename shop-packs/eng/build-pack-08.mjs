/**
 * Pack 8 — Études & école (langue eng).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const rows = [
  { terme: "school", definition: "école", type: "" },
  { terme: "class", definition: "classe", type: "" },
  { terme: "pupil", definition: "élève", type: "" },
  { terme: "teacher", definition: "professeur", type: "" },
  { terme: "lesson", definition: "leçon", type: "" },
  { terme: "test", definition: "contrôle", type: "" },
  { terme: "mark", definition: "note", type: "" },
  { terme: "exam", definition: "examen", type: "" },
  { terme: "essay", definition: "dissertation", type: "" },
  { terme: "book", definition: "livre", type: "" },
  { terme: "pen", definition: "stylo", type: "" },
  { terme: "pencil", definition: "crayon", type: "" },
  { terme: "ruler", definition: "règle", type: "" },
  { terme: "worktop", definition: "plan de travail", type: "" },
  { terme: "gym", definition: "gymnase", type: "" },
  { terme: "term", definition: "trimestre", type: "" },
  { terme: "break", definition: "récréation", type: "" },
  { terme: "rule", definition: "règle", type: "" },
  { terme: "note", definition: "note (cours)", type: "" },
  { terme: "board", definition: "tableau", type: "" },
  { terme: "subject", definition: "matière", type: "" },
  { terme: "tutor", definition: "répétiteur", type: "" },
  { terme: "campus", definition: "campus", type: "" },
  { terme: "lecture", definition: "cours magistral", type: "" },
  { terme: "seminar", definition: "séminaire", type: "" },
  { terme: "thesis", definition: "mémoire", type: "" },
  { terme: "degree", definition: "diplôme universitaire", type: "" },
  { terme: "diploma", definition: "diplôme", type: "" },
  { terme: "library", definition: "bibliothèque", type: "" },
  { terme: "borrow", definition: "emprunter", type: "" },
  { terme: "lend", definition: "prêter", type: "" },
  { terme: "absent", definition: "absent", type: "" },
  { terme: "cheat", definition: "tricher", type: "" },
  { terme: "pass", definition: "réussir", type: "" },
  { terme: "fail", definition: "échouer", type: "" },
  { terme: "copy", definition: "copie", type: "" },
  { terme: "draft", definition: "brouillon", type: "" },
  { terme: "quote", definition: "citation", type: "" },
  { terme: "spell", definition: "épeler", type: "" },
  { terme: "oral", definition: "oral", type: "" },
  { terme: "report", definition: "bulletin", type: "" },
  { terme: "locker", definition: "casier", type: "" },
  { terme: "canteen", definition: "cantine", type: "" },
  { terme: "uniform", definition: "uniforme", type: "" },
  { terme: "revision", definition: "révisions", type: "" },
  { terme: "scholarship", definition: "bourse d'études", type: "" },
  { terme: "plagiarism", definition: "plagiat", type: "" },
  { terme: "attendance", definition: "assiduité", type: "" },
  { terme: "detention", definition: "retenue", type: "" },
  { terme: "freshman", definition: "étudiant de première année", type: "" },
  { terme: "graduate", definition: "diplômé", type: "" },
  { terme: "headteacher", definition: "chef d'établissement", type: "" },
  { terme: "field trip", definition: "sortie scolaire", type: "" },
  { terme: "open day", definition: "journée portes ouvertes", type: "" },
  { terme: "gap year", definition: "année sabbatique", type: "" },
  { terme: "study skills", definition: "méthodologie", type: "" },
  { terme: "school report", definition: "bulletin scolaire", type: "" },
  { terme: "mock exam", definition: "examen blanc", type: "" },
  { terme: "timetable", definition: "emploi du temps", type: "" },
  { terme: "blackboard", definition: "tableau noir", type: "" },
  { terme: "worksheet", definition: "feuille d'exercices", type: "" },
  { terme: "dictation", definition: "dictée", type: "" },
  { terme: "laboratory", definition: "salle de sciences", type: "" },
  { terme: "principal", definition: "proviseur", type: "" },
  { terme: "prefect", definition: "délégué", type: "" },
  { terme: "module", definition: "module", type: "" },
  { terme: "swot up", definition: "bourriner", type: "" },
  { terme: "drop out", definition: "abandonner ses études", type: "" },
  { terme: "catch up", definition: "rattraper", type: "" },
  { terme: "fall behind", definition: "prendre du retard", type: "" },
  { terme: "keep up", definition: "suivre le rythme", type: "" },
  { terme: "mug up", definition: "apprendre par cœur à la hâte", type: "" },
  { terme: "sail through", definition: "réussir facilement", type: "" },
  { terme: "bone up on", definition: "réviser à fond", type: "" },
  { terme: "sit through", definition: "endurer (un cours)", type: "" },
  { terme: "cram for", definition: "potasser pour", type: "" },
  { terme: "hand back", definition: "rendre (une copie)", type: "" },
  { terme: "puzzle out", definition: "déchiffrer", type: "" },
  { terme: "read up on", definition: "se documenter sur", type: "" },
  { terme: "plod through", definition: "avancer laborieusement dans", type: "" },
  { terme: "pass with flying colours", definition: "réussir haut la main", type: "expression" },
  { terme: "hit the books", definition: "se mettre aux révisions", type: "expression" },
  { terme: "teacher's pet", definition: "chouchou du prof", type: "expression" },
  { terme: "back to the drawing board", definition: "repartir de zéro", type: "expression" },
  { terme: "pull an all-nighter", definition: "veiller toute la nuit", type: "expression" },
  { terme: "school of hard knocks", definition: "école de la vie", type: "expression" },
  { terme: "top of the class", definition: "premier de la classe", type: "expression" },
  { terme: "make the grade", definition: "obtenir la moyenne", type: "expression" },
  { terme: "a steep learning curve", definition: "une montée en compétence rapide", type: "expression" },
  { terme: "learn by heart", definition: "apprendre par cœur", type: "expression" },
  { terme: "every trick in the book", definition: "toutes les astuces possibles", type: "expression" },
  { terme: "read the riot act", definition: "remettre quelqu'un à sa place", type: "expression" },
  { terme: "set the bar high", definition: "fixer la barre haut", type: "expression" },
  { terme: "miss the mark", definition: "rater sa cible", type: "expression" },
  { terme: "word for word", definition: "mot pour mot", type: "expression" },
  { terme: "a quick study", definition: "quelqu'un qui apprend vite", type: "expression" },
  { terme: "copybook error", definition: "faute impardonnable", type: "expression" },
  { terme: "in a league of your own", definition: "sans rival", type: "expression" },
  { terme: "know something inside out", definition: "maîtriser quelque chose sur le bout des doigts", type: "expression" },
  { terme: "put your thinking cap on", definition: "concentrer sa réflexion", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-08-etudes-ecole.xlsx"));