/**
 * Pack 11 — Sport & loisirs (langue esp).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "el deporte", definition: "sport", type: "" },
  { terme: "el partido", definition: "match", type: "" },
  { terme: "el gol", definition: "but", type: "" },
  { terme: "el árbitro", definition: "arbitre", type: "" },
  { terme: "el entrenador", definition: "entraîneur", type: "" },
  { terme: "el entrenamiento", definition: "entraînement", type: "" },
  { terme: "la competición", definition: "compétition", type: "" },
  { terme: "el campeonato", definition: "championnat", type: "" },
  { terme: "la medalla", definition: "médaille", type: "" },
  { terme: "el podio", definition: "podium", type: "" },
  { terme: "la pista de atletismo", definition: "piste d'athlétisme", type: "" },
  { terme: "el campo", definition: "terrain", type: "" },
  { terme: "el balón", definition: "ballon", type: "" },
  { terme: "la pelota", definition: "balle", type: "" },
  { terme: "la raqueta", definition: "raquette", type: "" },
  { terme: "la red de la portería", definition: "filet du but", type: "" },
  { terme: "el equipo deportivo", definition: "équipe sportive", type: "" },
  { terme: "la lesión", definition: "blessure sportive", type: "" },
  { terme: "el esguince", definition: "entorse", type: "" },
  { terme: "el calentamiento", definition: "échauffement", type: "" },
  { terme: "la final", definition: "finale", type: "" },
  { terme: "el empate", definition: "match nul", type: "" },
  { terme: "la derrota", definition: "défaite", type: "" },
  { terme: "la victoria", definition: "victoire", type: "" },
  { terme: "el marcador", definition: "tableau des scores", type: "" },
  { terme: "la grada", definition: "tribune", type: "" },
  { terme: "el aficionado", definition: "supporteur", type: "" },
  { terme: "el estadio", definition: "stade", type: "" },
  { terme: "la piscina", definition: "piscine", type: "" },
  { terme: "la bicicleta", definition: "vélo", type: "" },
  { terme: "el fútbol", definition: "football", type: "" },
  { terme: "el baloncesto", definition: "basket-ball", type: "" },
  { terme: "el tenis", definition: "tennis", type: "" },
  { terme: "el penalti", definition: "penalty", type: "" },
  { terme: "el fuera de juego", definition: "hors-jeu", type: "" },
  { terme: "el córner", definition: "corner", type: "" },
  { terme: "la prórroga", definition: "prolongations", type: "" },
  { terme: "el descanso", definition: "mi-temps", type: "" },
  { terme: "el dorsal", definition: "numéro de maillot", type: "" },
  { terme: "la camiseta", definition: "maillot", type: "" },
  { terme: "las zapatillas", definition: "baskets", type: "" },
  { terme: "el vestuario", definition: "vestiaire", type: "" },
  { terme: "el banquillo", definition: "banc de touche", type: "" },
  { terme: "el suplente", definition: "remplaçant", type: "" },
  { terme: "el jugador titular", definition: "titulaire", type: "" },
  { terme: "el portero", definition: "gardien de but", type: "" },
  { terme: "el delantero", definition: "attaquant", type: "" },
  { terme: "el saque", definition: "engagement, service", type: "" },
  { terme: "el récord", definition: "record", type: "" },
  { terme: "el dopaje", definition: "dopage", type: "" },
  { terme: "la clasificación", definition: "classement", type: "" },
  { terme: "el patrocinador", definition: "sponsor", type: "" },
  { terme: "el gimnasio", definition: "salle de sport", type: "" },
  { terme: "la copa", definition: "coupe, trophée", type: "" },
  { terme: "la meta", definition: "ligne d'arrivée", type: "" },
  { terme: "el cronómetro", definition: "chronomètre", type: "" },
  { terme: "el oro", definition: "or (médaille)", type: "" },
  { terme: "la plata", definition: "argent (médaille)", type: "" },
  { terme: "el bronce", definition: "bronze", type: "" },
  { terme: "el árbitro asistente", definition: "arbitre assistant", type: "" },
  { terme: "la natación", definition: "natation", type: "" },
  { terme: "el atletismo", definition: "athlétisme", type: "" },
  { terme: "el ciclismo", definition: "cyclisme", type: "" },
  { terme: "la afición", definition: "public d'un club", type: "" },
  { terme: "el fair play", definition: "esprit sportif", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "entrenar", definition: "s'entraîner", type: "" },
  { terme: "marcar", definition: "marquer un but", type: "" },
  { terme: "empatar", definition: "faire match nul", type: "" },
  { terme: "ganar", definition: "gagner", type: "" },
  { terme: "perder", definition: "perdre un match", type: "" },
  { terme: "competir", definition: "concourir", type: "" },
  { terme: "lesionarse", definition: "se blesser en sport", type: "" },
  { terme: "calentarse", definition: "s'échauffer", type: "" },
  { terme: "estirar", definition: "s'étirer", type: "" },
  { terme: "regatear", definition: "dribbler", type: "" },
  { terme: "chutar", definition: "tirer au but", type: "" },
  { terme: "rendirse", definition: "abandonner la partie sportive", type: "" },
  { terme: "animar", definition: "encourager", type: "" },
  { terme: "clasificarse", definition: "se qualifier", type: "" },
  { terme: "batir un récord", definition: "battre un record", type: "" },
  // —— 20 expressions ——
  { terme: "colgar las botas", definition: "raccrocher", type: "expression" },
  { terme: "mover ficha", definition: "prendre l'initiative", type: "expression" },
  { terme: "devolver la pelota", definition: "renvoyer la balle", type: "expression" },
  { terme: "ir viento en popa", definition: "aller vent en poupe", type: "expression" },
  { terme: "quedarse en el banquillo", definition: "rester sur la touche", type: "expression" },
  { terme: "sudar la camiseta", definition: "se donner à fond", type: "expression" },
  { terme: "echar el resto", definition: "mettre toutes ses forces dans un dernier effort", type: "expression" },
  { terme: "estar en el alero", definition: "rester en suspens", type: "expression" },
  { terme: "pinchar en hueso", definition: "se heurter à plus fort que soi", type: "expression" },
  { terme: "pasarse de la raya", definition: "dépasser les bornes", type: "expression" },
  { terme: "aguantar el tipo", definition: "faire bonne figure", type: "expression" },
  { terme: "estar en racha", definition: "être en veine", type: "expression" },
  { terme: "a brazo partido", definition: "lutter avec acharnement", type: "expression" },
  { terme: "verlas venir", definition: "voir venir le coup", type: "expression" },
  { terme: "perder los nervios", definition: "perdre son calme", type: "expression" },
  { terme: "llevarse la palma", definition: "remporter la palme", type: "expression" },
  { terme: "quedar en tablas", definition: "finir sans vainqueur", type: "expression" },
  { terme: "hasta el último aliento", definition: "tenir jusqu'au bout", type: "expression" },
  { terme: "jugar sucio", definition: "user de moyens déloyaux", type: "expression" },
  { terme: "ver las estrellas", definition: "voir trente-six chandelles", type: "expression" },
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
