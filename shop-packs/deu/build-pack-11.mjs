/**
 * Pack 11 — Sport & loisirs (langue deu).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "der Sport", definition: "sport", type: "" },
  { terme: "das Spiel", definition: "match", type: "" },
  { terme: "das Tor", definition: "but", type: "" },
  { terme: "der Spieler", definition: "joueur", type: "" },
  { terme: "der Trainer", definition: "entraîneur", type: "" },
  { terme: "das Training", definition: "entraînement", type: "" },
  { terme: "die Mannschaft", definition: "équipe sportive", type: "" },
  { terme: "der Gegner", definition: "adversaire", type: "" },
  { terme: "der Schiedsrichter", definition: "arbitre", type: "" },
  { terme: "die Spielregel", definition: "règle du jeu", type: "" },
  { terme: "das Foul", definition: "faute", type: "" },
  { terme: "der Elfmeter", definition: "penalty", type: "" },
  { terme: "die Liga", definition: "championnat", type: "" },
  { terme: "der Pokal", definition: "coupe, trophée de compétition", type: "" },
  { terme: "die Etappe", definition: "étape", type: "" },
  { terme: "die Nachspielzeit", definition: "temps additionnel", type: "" },
  { terme: "das Stadion", definition: "stade", type: "" },
  { terme: "die Laufbahn", definition: "piste d'athlétisme", type: "" },
  { terme: "die Schwimmbahn", definition: "ligne d'eau", type: "" },
  { terme: "das Schwimmbad", definition: "piscine", type: "" },
  { terme: "der Tennisplatz", definition: "court de tennis", type: "" },
  { terme: "der Sportplatz", definition: "terrain de sport", type: "" },
  { terme: "der Boxring", definition: "ring", type: "" },
  { terme: "der Tennisschläger", definition: "raquette", type: "" },
  { terme: "die Fußballschuhe", definition: "crampons", type: "" },
  { terme: "der Handschuh", definition: "gant", type: "" },
  { terme: "der Helm", definition: "casque", type: "" },
  { terme: "die Pfeife", definition: "sifflet", type: "" },
  { terme: "die Medaille", definition: "médaille", type: "" },
  { terme: "die Trophäe", definition: "trophée", type: "" },
  { terme: "das Aufwärmen", definition: "échauffement", type: "" },
  { terme: "die Dehnung", definition: "étirement", type: "" },
  { terme: "die Fairness", definition: "esprit de fair-play", type: "" },
  { terme: "die Aufstellung", definition: "composition d'équipe", type: "" },
  { terme: "die K.-o.-Runde", definition: "phase à élimination directe", type: "" },
  { terme: "die Halbzeit", definition: "mi-temps", type: "" },
  { terme: "die Verlängerung", definition: "prolongations", type: "" },
  { terme: "die Dopingkontrolle", definition: "contrôle antidopage", type: "" },
  { terme: "das Krafttraining", definition: "musculation", type: "" },
  { terme: "das Joggen", definition: "footing", type: "" },
  { terme: "der Kader", definition: "effectif", type: "" },
  { terme: "der Rivale", definition: "rival", type: "" },
  { terme: "das Intervalltraining", definition: "course fractionnée", type: "" },
  { terme: "die Staffel", definition: "relais", type: "" },
  { terme: "das Abseits", definition: "hors-jeu", type: "" },
  { terme: "der Linienrichter", definition: "juge de ligne", type: "" },
  { terme: "der Fan", definition: "supporter", type: "" },
  { terme: "die Tribüne", definition: "tribune", type: "" },
  { terme: "der Anpfiff", definition: "coup d'envoi", type: "" },
  { terme: "der Schlusspfiff", definition: "coup de sifflet final", type: "" },
  { terme: "das Unentschieden", definition: "match nul", type: "" },
  { terme: "der Sieg", definition: "victoire", type: "" },
  { terme: "die Niederlage", definition: "défaite", type: "" },
  { terme: "das Eigentor", definition: "but contre son camp", type: "" },
  { terme: "der Freistoß", definition: "coup franc", type: "" },
  { terme: "die Ecke", definition: "corner", type: "" },
  { terme: "der Pass", definition: "passe", type: "" },
  { terme: "der Sprint", definition: "sprint", type: "" },
  { terme: "die Ausdauer", definition: "endurance", type: "" },
  { terme: "die Sportverletzung", definition: "blessure liée au sport", type: "" },
  { terme: "die Umkleide", definition: "vestiaire", type: "" },
  { terme: "das Finale", definition: "finale", type: "" },
  { terme: "der Weltrekord", definition: "record du monde", type: "" },
  { terme: "die Bestleistung", definition: "record personnel", type: "" },
  { terme: "der Sportverein", definition: "club sportif", type: "" },
  // —— 15 verbes à particule séparable ——
  { terme: "aufwärmen", definition: "s'échauffer", type: "" },
  { terme: "anpfeifen", definition: "donner le coup d'envoi", type: "" },
  { terme: "abpfeifen", definition: "siffler la fin", type: "" },
  { terme: "einwechseln", definition: "faire entrer un joueur", type: "" },
  { terme: "auswechseln", definition: "remplacer un joueur", type: "" },
  { terme: "zurückfallen", definition: "perdre du terrain", type: "" },
  { terme: "vorbeiziehen", definition: "dépasser", type: "" },
  { terme: "nachsetzen", definition: "talonner un adversaire", type: "" },
  { terme: "abprallen", definition: "rebondir", type: "" },
  { terme: "ausrutschen", definition: "glisser", type: "" },
  { terme: "gleichziehen", definition: "revenir à égalité", type: "" },
  { terme: "anfeuern", definition: "encourager", type: "" },
  { terme: "auslaufen", definition: "trottiner pour récupérer", type: "" },
  { terme: "abwehren", definition: "repousser", type: "" },
  { terme: "zuschauen", definition: "regarder un match", type: "" },
  // —— 20 expressions ——
  { terme: "Kopf an Kopf", definition: "au coude à coude", type: "expression" },
  { terme: "das Handtuch werfen", definition: "jeter l'éponge", type: "expression" },
  { terme: "am Ball bleiben", definition: "ne pas lâcher l'effort", type: "expression" },
  { terme: "ins Hintertreffen geraten", definition: "se faire distancer", type: "expression" },
  { terme: "die Nase vorn haben", definition: "mener", type: "expression" },
  { terme: "auf der Zielgeraden sein", definition: "être dans la dernière ligne droite", type: "expression" },
  { terme: "ein Eigentor schießen", definition: "se nuire à soi-même", type: "expression" },
  { terme: "das Runde muss ins Eckige", definition: "primauté du but sur le style de jeu", type: "expression" },
  { terme: "eine Steilvorlage liefern", definition: "offrir une occasion en or", type: "expression" },
  { terme: "eine weiße Weste haben", definition: "n'avoir rien à se reprocher", type: "expression" },
  { terme: "außer Puste sein", definition: "manquer d'air après l'effort", type: "expression" },
  { terme: "in Hochform sein", definition: "être au sommet de sa forme", type: "expression" },
  { terme: "die Segel streichen", definition: "abandonner la partie", type: "expression" },
  { terme: "wider Erwarten", definition: "contre toute attente", type: "expression" },
  { terme: "eine Glückssträhne haben", definition: "enchaîner les réussites", type: "expression" },
  { terme: "ein Fotofinish", definition: "arrivée trop serrée pour être départagée à l'œil", type: "expression" },
  { terme: "alle Trümpfe in der Hand haben", definition: "avoir tous les atouts", type: "expression" },
  { terme: "ein Comeback schaffen", definition: "réussir un retour", type: "expression" },
  { terme: "jemanden aus dem Rennen werfen", definition: "éliminer de la course", type: "expression" },
  { terme: "über sich hinauswachsen", definition: "se surpasser", type: "expression" },
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
