/**
 * Pack 10 — Culture & arts (langue esp).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "el cine", definition: "cinéma", type: "" },
  { terme: "la película", definition: "film", type: "" },
  { terme: "el actor", definition: "acteur, actrice", type: "" },
  { terme: "el director de cine", definition: "réalisateur", type: "" },
  { terme: "el guion", definition: "scénario", type: "" },
  { terme: "el papel", definition: "rôle au théâtre ou au cinéma", type: "" },
  { terme: "la escena", definition: "scène", type: "" },
  { terme: "el escenario", definition: "plateau, scène", type: "" },
  { terme: "la obra", definition: "œuvre", type: "" },
  { terme: "el cuadro", definition: "tableau peint", type: "" },
  { terme: "el museo", definition: "musée", type: "" },
  { terme: "la exposición artística", definition: "exposition d'art", type: "" },
  { terme: "el concierto", definition: "concert", type: "" },
  { terme: "la canción", definition: "chanson", type: "" },
  { terme: "el instrumento", definition: "instrument de musique", type: "" },
  { terme: "la guitarra", definition: "guitare", type: "" },
  { terme: "el piano", definition: "piano", type: "" },
  { terme: "el baile", definition: "danse", type: "" },
  { terme: "el teatro", definition: "théâtre", type: "" },
  { terme: "la entrada", definition: "billet de spectacle", type: "" },
  { terme: "el aplauso", definition: "applaudissement", type: "" },
  { terme: "el ensayo", definition: "répétition", type: "" },
  { terme: "el público", definition: "public", type: "" },
  { terme: "la crítica", definition: "critique", type: "" },
  { terme: "el poema", definition: "poème", type: "" },
  { terme: "la novela", definition: "roman", type: "" },
  { terme: "el autor", definition: "auteur", type: "" },
  { terme: "el capítulo", definition: "chapitre", type: "" },
  { terme: "la portada", definition: "couverture d'un livre", type: "" },
  { terme: "el género", definition: "genre artistique", type: "" },
  { terme: "la comedia", definition: "comédie", type: "" },
  { terme: "el drama", definition: "drame", type: "" },
  { terme: "la butaca", definition: "fauteuil de salle", type: "" },
  { terme: "el intermedio", definition: "entracte", type: "" },
  { terme: "el pincel", definition: "pinceau", type: "" },
  { terme: "el lienzo", definition: "toile", type: "" },
  { terme: "la acuarela", definition: "aquarelle", type: "" },
  { terme: "el estilo", definition: "style", type: "" },
  { terme: "el siglo", definition: "siècle", type: "" },
  { terme: "el patrimonio", definition: "patrimoine", type: "" },
  { terme: "el monumento", definition: "monument", type: "" },
  { terme: "la leyenda", definition: "légende", type: "" },
  { terme: "el mito", definition: "mythe", type: "" },
  { terme: "la tradición", definition: "tradition", type: "" },
  { terme: "el carnaval", definition: "carnaval", type: "" },
  { terme: "el festival", definition: "festival", type: "" },
  { terme: "la taquilla", definition: "guichet", type: "" },
  { terme: "el estreno", definition: "première", type: "" },
  { terme: "la banda sonora", definition: "bande originale", type: "" },
  { terme: "la letra", definition: "paroles d'une chanson", type: "" },
  { terme: "la escultura", definition: "sculpture", type: "" },
  { terme: "el arquitecto", definition: "architecte", type: "" },
  { terme: "la ópera", definition: "opéra", type: "" },
  { terme: "el coro", definition: "chœur", type: "" },
  { terme: "la melodía", definition: "mélodie", type: "" },
  { terme: "el ritmo", definition: "rythme", type: "" },
  { terme: "el compás", definition: "mesure musicale", type: "" },
  { terme: "el decorado", definition: "décor", type: "" },
  { terme: "el palco", definition: "loge", type: "" },
  { terme: "la rima", definition: "rime", type: "" },
  { terme: "la estrofa", definition: "strophe", type: "" },
  { terme: "el narrador", definition: "narrateur", type: "" },
  { terme: "la ficción", definition: "fiction", type: "" },
  { terme: "el clásico", definition: "classique", type: "" },
  { terme: "la fiesta", definition: "fête", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "actuar", definition: "jouer un rôle", type: "" },
  { terme: "ensayar", definition: "répéter un spectacle", type: "" },
  { terme: "interpretar", definition: "interpréter", type: "" },
  { terme: "pintar", definition: "peindre", type: "" },
  { terme: "esculpir", definition: "sculpter", type: "" },
  { terme: "componer", definition: "composer", type: "" },
  { terme: "tocar", definition: "jouer d'un instrument", type: "" },
  { terme: "rodar", definition: "tourner un film", type: "" },
  { terme: "aplaudir", definition: "applaudir", type: "" },
  { terme: "estrenar", definition: "créer une œuvre", type: "" },
  { terme: "improvisar", definition: "improviser", type: "" },
  { terme: "inspirarse", definition: "s'inspirer", type: "" },
  { terme: "tararear", definition: "fredonner", type: "" },
  { terme: "afinar", definition: "accorder un instrument", type: "" },
  { terme: "declamar", definition: "déclamer", type: "" },
  // —— 20 expressions ——
  { terme: "robar el protagonismo", definition: "voler la vedette", type: "expression" },
  { terme: "tener tablas", definition: "avoir du métier", type: "expression" },
  { terme: "de película", definition: "digne d'un film", type: "expression" },
  { terme: "montar un número", definition: "faire une scène", type: "expression" },
  { terme: "ser un rollo", definition: "être rasoir", type: "expression" },
  { terme: "no tener desperdicio", definition: "être réussi de bout en bout", type: "expression" },
  { terme: "como anillo al dedo", definition: "aller comme un gant", type: "expression" },
  { terme: "dar la nota", definition: "se faire remarquer de façon déplacée", type: "expression" },
  { terme: "llevar la batuta", definition: "mener la danse", type: "expression" },
  { terme: "ser siempre la misma canción", definition: "rabâcher le même refrain", type: "expression" },
  { terme: "mantenerse en sus trece", definition: "camper sur ses positions", type: "expression" },
  { terme: "bajar el telón", definition: "tirer le rideau", type: "expression" },
  { terme: "a pleno pulmón", definition: "à pleins poumons", type: "expression" },
  { terme: "por amor al arte", definition: "pour le plaisir, sans rien attendre", type: "expression" },
  { terme: "ser música para sus oídos", definition: "être une nouvelle très agréable", type: "expression" },
  { terme: "no venir a cuento", definition: "n'avoir rien à voir avec le sujet", type: "expression" },
  { terme: "írsele la lengua", definition: "laisser échapper un mot de trop", type: "expression" },
  { terme: "pintar bastos", definition: "tourner au vinaigre", type: "expression" },
  { terme: "no hay color", definition: "ne pas souffrir la comparaison", type: "expression" },
  { terme: "de cine", definition: "sortir de l'ordinaire", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-10-culture-arts.xlsx"));
