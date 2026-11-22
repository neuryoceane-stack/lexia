/**
 * Pack 10 — Culture & arts (langue eng).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const rows = [
  { terme: "play", definition: "pièce de théâtre", type: "" },
  { terme: "film", definition: "film", type: "" },
  { terme: "plot", definition: "intrigue", type: "" },
  { terme: "role", definition: "rôle", type: "" },
  { terme: "cast", definition: "distribution", type: "" },
  { terme: "stage", definition: "scène", type: "" },
  { terme: "scene", definition: "scène (théâtre)", type: "" },
  { terme: "act", definition: "acte", type: "" },
  { terme: "novel", definition: "roman", type: "" },
  { terme: "poem", definition: "poème", type: "" },
  { terme: "tale", definition: "conte", type: "" },
  { terme: "myth", definition: "mythe", type: "" },
  { terme: "hero", definition: "héros", type: "" },
  { terme: "muse", definition: "muse", type: "" },
  { terme: "hue", definition: "teinte", type: "" },
  { terme: "tone", definition: "tonalité", type: "" },
  { terme: "beat", definition: "rythme", type: "" },
  { terme: "band", definition: "groupe (musique)", type: "" },
  { terme: "drum", definition: "tambour", type: "" },
  { terme: "flute", definition: "flûte", type: "" },
  { terme: "violin", definition: "violon", type: "" },
  { terme: "choir", definition: "chœur", type: "" },
  { terme: "gallery", definition: "galerie", type: "" },
  { terme: "statue", definition: "statue", type: "" },
  { terme: "opera", definition: "opéra", type: "" },
  { terme: "ballet", definition: "ballet", type: "" },
  { terme: "comedy", definition: "comédie", type: "" },
  { terme: "drama", definition: "drame", type: "" },
  { terme: "tragedy", definition: "tragédie", type: "" },
  { terme: "satire", definition: "satire", type: "" },
  { terme: "irony", definition: "ironie", type: "" },
  { terme: "folk", definition: "folk", type: "" },
  { terme: "epic", definition: "épopée", type: "" },
  { terme: "rhyme", definition: "rime", type: "" },
  { terme: "stanza", definition: "strophe", type: "" },
  { terme: "canvas", definition: "toile", type: "" },
  { terme: "sketch", definition: "croquis", type: "" },
  { terme: "frame", definition: "cadre", type: "" },
  { terme: "exhibit", definition: "exposition", type: "" },
  { terme: "curator", definition: "conservateur", type: "" },
  { terme: "premiere", definition: "première", type: "" },
  { terme: "ovation", definition: "ovation", type: "" },
  { terme: "critic", definition: "critique", type: "" },
  { terme: "sequel", definition: "suite", type: "" },
  { terme: "remake", definition: "remake", type: "" },
  { terme: "screenplay", definition: "scénario", type: "" },
  { terme: "soundtrack", definition: "bande originale", type: "" },
  { terme: "watercolour", definition: "aquarelle", type: "" },
  { terme: "sculpture", definition: "sculpture", type: "" },
  { terme: "portrait", definition: "portrait", type: "" },
  { terme: "landscape", definition: "paysage (peinture)", type: "" },
  { terme: "woodwind", definition: "bois (instrument)", type: "" },
  { terme: "string quartet", definition: "quatuor à cordes", type: "" },
  { terme: "box office", definition: "billetterie", type: "" },
  { terme: "opening night", definition: "soirée d'ouverture", type: "" },
  { terme: "arts funding", definition: "financement des arts", type: "" },
  { terme: "brushstroke", definition: "coup de pinceau", type: "" },
  { terme: "stagecraft", definition: "art de la scène", type: "" },
  { terme: "verse", definition: "vers", type: "" },
  { terme: "lyric", definition: "paroles (chanson)", type: "" },
  { terme: "prose", definition: "prose", type: "" },
  { terme: "encore", definition: "rappel (bis)", type: "" },
  { terme: "patron", definition: "mécène", type: "" },
  { terme: "aisle", definition: "allée (salle)", type: "" },
  { terme: "act out", definition: "jouer une scène", type: "" },
  { terme: "look up to", definition: "admirer", type: "" },
  { terme: "draw on", definition: "s'inspirer de", type: "" },
  { terme: "live up to", definition: "être à la hauteur de", type: "" },
  { terme: "sum up", definition: "résumer", type: "" },
  { terme: "point out", definition: "souligner", type: "" },
  { terme: "grow on", definition: "gagner en appréciation", type: "" },
  { terme: "catch on", definition: "devenir tendance", type: "" },
  { terme: "show off", definition: "se mettre en valeur", type: "" },
  { terme: "mull over", definition: "mûrir une réflexion", type: "" },
  { terme: "flesh out", definition: "développer (une idée)", type: "" },
  { terme: "tone down", definition: "atténuer", type: "" },
  { terme: "hype up", definition: "mettre en avant", type: "" },
  { terme: "set the scene", definition: "poser le décor", type: "" },
  { terme: "work of art", definition: "chef-d'œuvre", type: "" },
  { terme: "star turn", definition: "performance d'étoile", type: "" },
  { terme: "steal the show", definition: "voler la vedette", type: "expression" },
  { terme: "in the limelight", definition: "sous les feux de la rampe", type: "expression" },
  { terme: "curtain call", definition: "rappel sur scène", type: "expression" },
  { terme: "a tough act to follow", definition: "une prestation difficile à égaler", type: "expression" },
  { terme: "a masterpiece", definition: "un chef-d'œuvre", type: "expression" },
  { terme: "the show must go on", definition: "le spectacle doit continuer", type: "expression" },
  { terme: "break a lance for", definition: "prendre fait et cause pour", type: "expression" },
  { terme: "paint the town red", definition: "faire la fête", type: "expression" },
  { terme: "a palette of colours", definition: "une palette de couleurs", type: "expression" },
  { terme: "a stroke of genius", definition: "un coup de génie", type: "expression" },
  { terme: "strike a chord", definition: "toucher juste", type: "expression" },
  { terme: "a blank canvas", definition: "une page blanche", type: "expression" },
  { terme: "set the tone", definition: "donner le ton", type: "expression" },
  { terme: "a diamond in the rough", definition: "une pépite brute", type: "expression" },
  { terme: "old master", definition: "maître ancien", type: "expression" },
  { terme: "labour of love", definition: "travail fait par passion", type: "expression" },
  { terme: "a standing ovation", definition: "ovation debout", type: "expression" },
  { terme: "behind the times", definition: "dépassé", type: "expression" },
  { terme: "ahead of its time", definition: "en avance sur son temps", type: "expression" },
  { terme: "the plot thickens", definition: "l'intrigue se complique", type: "expression" },
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