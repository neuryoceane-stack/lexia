/**
 * Pack 9 — Technologie & sciences (langue eng).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const rows = [
  { terme: "code", definition: "code", type: "" },
  { terme: "app", definition: "application", type: "" },
  { terme: "web", definition: "web", type: "" },
  { terme: "chip", definition: "puce", type: "" },
  { terme: "data", definition: "données", type: "" },
  { terme: "file", definition: "fichier", type: "" },
  { terme: "disk", definition: "disque", type: "" },
  { terme: "cloud", definition: "nuage (informatique)", type: "" },
  { terme: "bug", definition: "bogue", type: "" },
  { terme: "hack", definition: "piratage", type: "" },
  { terme: "bot", definition: "robot (logiciel)", type: "" },
  { terme: "AI", definition: "intelligence artificielle", type: "" },
  { terme: "screen", definition: "écran", type: "" },
  { terme: "mouse", definition: "souris", type: "" },
  { terme: "click", definition: "clic", type: "" },
  { terme: "swipe", definition: "glisser (écran tactile)", type: "" },
  { terme: "pixel", definition: "pixel", type: "" },
  { terme: "byte", definition: "octet", type: "" },
  { terme: "router", definition: "routeur", type: "" },
  { terme: "server", definition: "serveur", type: "" },
  { terme: "update", definition: "mise à jour", type: "" },
  { terme: "backup", definition: "sauvegarde", type: "" },
  { terme: "malware", definition: "logiciel malveillant", type: "" },
  { terme: "patch", definition: "correctif", type: "" },
  { terme: "browser", definition: "navigateur", type: "" },
  { terme: "cookie", definition: "témoin de connexion", type: "" },
  { terme: "laptop", definition: "ordinateur portable", type: "" },
  { terme: "tablet", definition: "tablette", type: "" },
  { terme: "gadget", definition: "gadget", type: "" },
  { terme: "sensor", definition: "capteur", type: "" },
  { terme: "robot", definition: "robot", type: "" },
  { terme: "drone", definition: "drone", type: "" },
  { terme: "gene", definition: "gène", type: "" },
  { terme: "lab", definition: "laboratoire de recherche", type: "" },
  { terme: "atom", definition: "atome", type: "" },
  { terme: "cell", definition: "cellule", type: "" },
  { terme: "force", definition: "force (physique)", type: "" },
  { terme: "energy", definition: "énergie", type: "" },
  { terme: "orbit", definition: "orbite", type: "" },
  { terme: "galaxy", definition: "galaxie", type: "" },
  { terme: "telescope", definition: "télescope", type: "" },
  { terme: "theory", definition: "théorie", type: "" },
  { terme: "formula", definition: "formule", type: "" },
  { terme: "reaction", definition: "réaction chimique", type: "" },
  { terme: "mixture", definition: "mélange", type: "" },
  { terme: "acid", definition: "acide", type: "" },
  { terme: "base", definition: "base (chimie)", type: "" },
  { terme: "gravity", definition: "gravité", type: "" },
  { terme: "magnet", definition: "aimant", type: "" },
  { terme: "laser", definition: "laser", type: "" },
  { terme: "circuit", definition: "circuit", type: "" },
  { terme: "voltage", definition: "tension", type: "" },
  { terme: "wireless", definition: "sans fil", type: "" },
  { terme: "startup", definition: "jeune pousse", type: "" },
  { terme: "innovation", definition: "innovation", type: "" },
  { terme: "research paper", definition: "article scientifique", type: "" },
  { terme: "peer review", definition: "évaluation par les pairs", type: "" },
  { terme: "proton", definition: "proton", type: "" },
  { terme: "electron", definition: "électron", type: "" },
  { terme: "wavelength", definition: "longueur d'onde", type: "" },
  { terme: "microscope", definition: "microscope", type: "" },
  { terme: "hypothesis", definition: "hypothèse", type: "" },
  { terme: "neutron", definition: "neutron", type: "" },
  { terme: "isotope", definition: "isotope", type: "" },
  { terme: "plug in", definition: "brancher", type: "" },
  { terme: "log on", definition: "ouvrir une session", type: "" },
  { terme: "log off", definition: "fermer une session", type: "" },
  { terme: "boot up", definition: "démarrer", type: "" },
  { terme: "tap into", definition: "exploiter (une ressource)", type: "" },
  { terme: "scroll down", definition: "défiler vers le bas", type: "" },
  { terme: "zoom in", definition: "zoomer", type: "" },
  { terme: "zoom out", definition: "dézoomer", type: "" },
  { terme: "back up", definition: "sauvegarder", type: "" },
  { terme: "set up", definition: "configurer", type: "" },
  { terme: "figure out", definition: "comprendre", type: "" },
  { terme: "keep track of", definition: "suivre", type: "" },
  { terme: "power up", definition: "mettre sous tension", type: "" },
  { terme: "wear out", definition: "user", type: "" },
  { terme: "fire up", definition: "démarrer (un moteur)", type: "" },
  { terme: "power down", definition: "couper l'alimentation", type: "" },
  { terme: "state of the art", definition: "à la pointe", type: "expression" },
  { terme: "bright idea", definition: "bonne idée", type: "expression" },
  { terme: "needle in a haystack", definition: "aiguille dans une botte de foin", type: "expression" },
  { terme: "cutting edge", definition: "de pointe", type: "expression" },
  { terme: "bring to light", definition: "mettre au jour", type: "expression" },
  { terme: "a flash in the pan", definition: "un feu de paille", type: "expression" },
  { terme: "reach a milestone", definition: "franchir une étape clé", type: "expression" },
  { terme: "back to square one", definition: "retour à la case départ", type: "expression" },
  { terme: "trial and error", definition: "tâtonnement", type: "expression" },
  { terme: "hit the nail on the head", definition: "mettre dans le mille", type: "expression" },
  { terme: "in layman's terms", definition: "en termes simples", type: "expression" },
  { terme: "light years ahead", definition: "en avance de plusieurs années", type: "expression" },
  { terme: "break new ground", definition: "innover", type: "expression" },
  { terme: "scratch the surface", definition: "effleurer le sujet", type: "expression" },
  { terme: "a shot in the dark", definition: "tentative au hasard", type: "expression" },
  { terme: "silver bullet", definition: "solution miracle", type: "expression" },
  { terme: "room for improvement", definition: "marge de progression", type: "expression" },
  { terme: "works like a charm", definition: "fonctionne parfaitement", type: "expression" },
  { terme: "down to the wire", definition: "jusqu'à la dernière minute", type: "expression" },
  { terme: "push the envelope", definition: "repousser les limites", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-09-technologie-sciences.xlsx"));