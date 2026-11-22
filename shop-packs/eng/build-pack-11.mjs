/**
 * Pack 11 — Sport & loisirs (langue eng).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const rows = [
  { terme: "ball", definition: "balle, ballon", type: "" },
  { terme: "goal", definition: "but", type: "" },
  { terme: "net", definition: "filet", type: "" },
  { terme: "coach", definition: "entraîneur", type: "" },
  { terme: "ref", definition: "arbitre", type: "" },
  { terme: "fan", definition: "supporter", type: "" },
  { terme: "win", definition: "gagner", type: "" },
  { terme: "lose", definition: "perdre", type: "" },
  { terme: "draw", definition: "match nul", type: "" },
  { terme: "race", definition: "compétition", type: "" },
  { terme: "jump", definition: "saut", type: "" },
  { terme: "throw", definition: "lancer", type: "" },
  { terme: "catch", definition: "réceptionner (un ballon)", type: "" },
  { terme: "kick", definition: "coup de pied", type: "" },
  { terme: "hit", definition: "frapper", type: "" },
  { terme: "swim", definition: "nager", type: "" },
  { terme: "run", definition: "courir", type: "" },
  { terme: "bike", definition: "faire du vélo", type: "" },
  { terme: "hike", definition: "randonner", type: "" },
  { terme: "ski", definition: "skier", type: "" },
  { terme: "surf", definition: "surfer", type: "" },
  { terme: "climb", definition: "grimper", type: "" },
  { terme: "yoga", definition: "yoga", type: "" },
  { terme: "fitness", definition: "forme physique", type: "" },
  { terme: "match", definition: "match", type: "" },
  { terme: "score", definition: "score", type: "" },
  { terme: "tie", definition: "égalité", type: "" },
  { terme: "foul", definition: "faute", type: "" },
  { terme: "penalty", definition: "pénalité", type: "" },
  { terme: "league", definition: "championnat", type: "" },
  { terme: "cup", definition: "coupe", type: "" },
  { terme: "tour", definition: "tournée", type: "" },
  { terme: "record", definition: "record", type: "" },
  { terme: "stadium", definition: "stade", type: "" },
  { terme: "track", definition: "piste", type: "" },
  { terme: "lane", definition: "couloir", type: "" },
  { terme: "pool", definition: "piscine", type: "" },
  { terme: "court", definition: "court (tennis)", type: "" },
  { terme: "pitch", definition: "terrain", type: "" },
  { terme: "ring", definition: "ring", type: "" },
  { terme: "racket", definition: "raquette", type: "" },
  { terme: "bat", definition: "batte", type: "" },
  { terme: "club", definition: "club", type: "" },
  { terme: "glove", definition: "gant", type: "" },
  { terme: "helmet", definition: "casque", type: "" },
  { terme: "whistle", definition: "sifflet", type: "" },
  { terme: "medal", definition: "médaille", type: "" },
  { terme: "trophy", definition: "trophée", type: "" },
  { terme: "warm-up", definition: "échauffement", type: "" },
  { terme: "cool-down", definition: "retour au calme", type: "" },
  { terme: "fair play", definition: "fair-play", type: "" },
  { terme: "line-up", definition: "composition d'équipe", type: "" },
  { terme: "play-off", definition: "phase finale", type: "" },
  { terme: "half-time", definition: "mi-temps", type: "" },
  { terme: "extra time", definition: "prolongations", type: "" },
  { terme: "doping test", definition: "contrôle antidopage", type: "" },
  { terme: "bench press", definition: "développé couché", type: "" },
  { terme: "jogging", definition: "jogging", type: "" },
  { terme: "squad", definition: "effectif", type: "" },
  { terme: "rival", definition: "adversaire", type: "" },
  { terme: "sprint", definition: "sprint", type: "" },
  { terme: "relay", definition: "relais", type: "" },
  { terme: "podium", definition: "podium", type: "" },
  { terme: "umpire", definition: "arbitre (tennis)", type: "" },
  { terme: "train hard", definition: "s'entraîner intensément", type: "" },
  { terme: "limber up", definition: "préparer ses muscles", type: "" },
  { terme: "kick off", definition: "donner le coup d'envoi", type: "" },
  { terme: "knock out", definition: "éliminer", type: "" },
  { terme: "warm down", definition: "récupérer après l'effort", type: "" },
  { terme: "take up", definition: "se mettre au", type: "" },
  { terme: "give up", definition: "abandonner", type: "" },
  { terme: "stay ahead", definition: "rester en tête", type: "" },
  { terme: "pull ahead", definition: "prendre l'avantage", type: "" },
  { terme: "lag behind", definition: "accuser du retard", type: "" },
  { terme: "bottle up", definition: "refouler (ses émotions)", type: "" },
  { terme: "team up", definition: "faire équipe", type: "" },
  { terme: "bow out", definition: "quitter la compétition", type: "" },
  { terme: "pace yourself", definition: "gérer son effort", type: "" },
  { terme: "level up", definition: "monter en niveau", type: "" },
  { terme: "in full swing", definition: "en plein essor", type: "" },
  { terme: "dead heat", definition: "ex æquo à l'arrivée", type: "expression" },
  { terme: "front runner", definition: "favori", type: "expression" },
  { terme: "the ball is in your court", definition: "la balle est dans votre camp", type: "expression" },
  { terme: "move the goalposts", definition: "changer les règles en cours de jeu", type: "expression" },
  { terme: "a clean sweep", definition: "une victoire totale", type: "expression" },
  { terme: "neck and neck", definition: "à égalité", type: "expression" },
  { terme: "home advantage", definition: "l'avantage du terrain", type: "expression" },
  { terme: "underdog victory", definition: "victoire de l'outsider", type: "expression" },
  { terme: "a photo finish", definition: "arrivée serrée", type: "expression" },
  { terme: "peak performance", definition: "performance maximale", type: "expression" },
  { terme: "personal best", definition: "meilleur record personnel", type: "expression" },
  { terme: "game plan", definition: "stratégie de match", type: "expression" },
  { terme: "come from behind", definition: "remonter au score", type: "expression" },
  { terme: "blow the whistle", definition: "siffler la fin", type: "expression" },
  { terme: "keep your eye on the ball", definition: "rester concentré", type: "expression" },
  { terme: "ahead of the game", definition: "en avance sur les autres", type: "expression" },
  { terme: "go the distance", definition: "aller jusqu'au bout", type: "expression" },
  { terme: "throw in the towel", definition: "jeter l'éponge", type: "expression" },
  { terme: "in the running", definition: "parmi les favoris", type: "expression" },
  { terme: "off form", definition: "hors forme", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-11-sport-loisirs.xlsx"));