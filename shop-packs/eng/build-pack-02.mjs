/**
 * Génère pack-02-voyage-transports.xlsx (thème 2 — Voyage & transports).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "boarding pass", definition: "carte d'embarquement", type: "" },
  { terme: "baggage claim", definition: "retrait des bagages", type: "" },
  { terme: "stopover", definition: "escale", type: "" },
  { terme: "layover", definition: "escale prolongée", type: "" },
  { terme: "connecting flight", definition: "vol avec correspondance", type: "" },
  { terme: "direct flight", definition: "vol direct", type: "" },
  { terme: "long-haul", definition: "vol long-courrier", type: "" },
  { terme: "short-haul", definition: "vol court-courrier", type: "" },
  { terme: "red-eye flight", definition: "vol de nuit", type: "" },
  { terme: "overbooking", definition: "surréservation", type: "" },
  { terme: "no-show", definition: "absent sans prévenir", type: "" },
  { terme: "check-in desk", definition: "comptoir d'enregistrement", type: "" },
  { terme: "departure lounge", definition: "salle d'embarquement", type: "" },
  { terme: "final boarding call", definition: "dernier appel à l'embarquement", type: "" },
  { terme: "boarding gate", definition: "porte d'embarquement", type: "" },
  { terme: "runway", definition: "piste d'aérodrome", type: "" },
  { terme: "customs declaration", definition: "déclaration en douane", type: "" },
  { terme: "duty-free", definition: "hors taxes", type: "" },
  { terme: "passport control", definition: "contrôle des passeports", type: "" },
  { terme: "visa waiver", definition: "exemption de visa", type: "" },
  { terme: "travel advisory", definition: "conseil aux voyageurs", type: "" },
  { terme: "multicity ticket", definition: "billet multi-destinations", type: "" },
  { terme: "round-trip fare", definition: "tarif aller-retour", type: "" },
  { terme: "one-way ticket", definition: "billet aller simple", type: "" },
  { terme: "peak fare", definition: "tarif heures de pointe", type: "" },
  { terme: "shuttle service", definition: "navette", type: "" },
  { terme: "car rental", definition: "location de voiture", type: "" },
  { terme: "breakdown lane", definition: "bande d'arrêt d'urgence", type: "" },
  { terme: "toll road", definition: "route à péage", type: "" },
  { terme: "congestion charge", definition: "taxe de congestion", type: "" },
  { terme: "one-way street", definition: "rue à sens unique", type: "" },
  { terme: "pedestrian zone", definition: "zone piétonne", type: "" },
  { terme: "cycle lane", definition: "piste cyclable", type: "" },
  { terme: "railway platform", definition: "quai de gare", type: "" },
  { terme: "express service", definition: "service express", type: "" },
  { terme: "sleeper carriage", definition: "voiture-couchettes", type: "" },
  { terme: "ferry crossing", definition: "traversée en ferry", type: "" },
  { terme: "cruise liner", definition: "paquebot de croisière", type: "" },
  { terme: "harbour terminal", definition: "terminal portuaire", type: "" },
  { terme: "cabin baggage", definition: "bagage cabine", type: "" },
  { terme: "hold luggage", definition: "bagage en soute", type: "" },
  { terme: "seat allocation", definition: "attribution des places", type: "" },
  { terme: "aisle seat", definition: "place côté couloir", type: "" },
  { terme: "window seat", definition: "place côté hublot", type: "" },
  { terme: "missed connection", definition: "correspondance manquée", type: "" },
  { terme: "flight delay", definition: "retard de vol", type: "" },
  { terme: "cancellation policy", definition: "conditions d'annulation", type: "" },
  { terme: "travel insurance", definition: "assurance voyage", type: "" },
  { terme: "jet lag", definition: "décalage horaire", type: "" },
  { terme: "currency exchange", definition: "bureau de change", type: "" },
  { terme: "international driving permit", definition: "permis de conduire international", type: "" },
  { terme: "parking permit", definition: "autorisation de stationnement", type: "" },
  { terme: "rush-hour traffic", definition: "trafic aux heures de pointe", type: "" },
  { terme: "roadworks", definition: "travaux sur la chaussée", type: "" },
  { terme: "diversion route", definition: "itinéraire de déviation", type: "" },
  { terme: "rideshare booking", definition: "réservation en covoiturage", type: "" },
  { terme: "timetable change", definition: "modification d'horaire", type: "" },
  { terme: "lost property office", definition: "bureau des objets trouvés", type: "" },
  { terme: "left-luggage desk", definition: "consigne à bagages", type: "" },
  { terme: "interchange station", definition: "gare de correspondance", type: "" },
  { terme: "luggage allowance", definition: "franchise bagages", type: "" },
  { terme: "boarding group", definition: "groupe d'embarquement", type: "" },
  { terme: "onward journey", definition: "suite du voyage", type: "" },
  { terme: "return journey", definition: "voyage de retour", type: "" },
  { terme: "standby passenger", definition: "passager en liste d'attente", type: "" },
  // —— 15 phrasal verbs ——
  { terme: "set off", definition: "partir", type: "" },
  { terme: "check in", definition: "s'enregistrer", type: "" },
  { terme: "take off", definition: "décoller", type: "" },
  { terme: "touch down", definition: "atterrir", type: "" },
  { terme: "pull over", definition: "se garer sur le côté", type: "" },
  { terme: "drop off", definition: "déposer", type: "" },
  { terme: "pick up", definition: "aller chercher", type: "" },
  { terme: "see off", definition: "accompagner au départ", type: "" },
  { terme: "get away", definition: "s'échapper", type: "" },
  { terme: "hold up", definition: "retarder", type: "" },
  { terme: "slow down", definition: "ralentir", type: "" },
  { terme: "fill up", definition: "faire le plein", type: "" },
  { terme: "get on", definition: "monter", type: "" },
  { terme: "get off", definition: "descendre", type: "" },
  { terme: "run late", definition: "accuser du retard", type: "" },
  // —— 20 expressions ——
  { terme: "hit the road", definition: "prendre la route", type: "expression" },
  { terme: "off the beaten track", definition: "hors des sentiers battus", type: "expression" },
  { terme: "travel light", definition: "voyager léger", type: "expression" },
  { terme: "miss the boat", definition: "rater le coche", type: "expression" },
  { terme: "at a crossroads", definition: "à la croisée des chemins", type: "expression" },
  { terme: "on the go", definition: "toujours en déplacement", type: "expression" },
  { terme: "safe travels", definition: "bon voyage", type: "expression" },
  { terme: "make good time", definition: "faire bon chemin", type: "expression" },
  { terme: "smooth sailing", definition: "sans encombre", type: "expression" },
  { terme: "in the nick of time", definition: "juste à temps", type: "expression" },
  { terme: "burn rubber", definition: "filer à toute allure", type: "expression" },
  { terme: "a change of scenery", definition: "changer d'air", type: "expression" },
  { terme: "from pillar to post", definition: "être balloté de service en service", type: "expression" },
  { terme: "all roads lead to Rome", definition: "tous les chemins mènent à Rome", type: "expression" },
  { terme: "behind the wheel", definition: "au volant", type: "expression" },
  { terme: "red tape", definition: "paperasserie", type: "expression" },
  { terme: "on the wrong track", definition: "être sur une mauvaise piste", type: "expression" },
  { terme: "miles apart", definition: "aux antipodes", type: "expression" },
  { terme: "sit tight", definition: "patienter sans bouger", type: "expression" },
  { terme: "go the extra mile", definition: "faire un effort supplémentaire", type: "expression" },
];

function validate(data) {
  if (data.length !== 100) throw new Error(`Expected 100 rows, got ${data.length}`);
  const terms = new Set();
  for (const row of data) {
    if (!row.terme?.trim() || !row.definition?.trim()) {
      throw new Error(`Empty term or definition: ${JSON.stringify(row)}`);
    }
    const key = row.terme.trim().toLowerCase();
    if (terms.has(key)) throw new Error(`Duplicate term: ${row.terme}`);
    terms.add(key);
  }
  const words = data.filter((r) => r.type !== "expression").length;
  const expressions = data.filter((r) => r.type === "expression").length;
  if (words !== 80) throw new Error(`Word count: expected 80, got ${words}`);
  if (expressions !== 20) throw new Error(`Expression count: expected 20, got ${expressions}`);
}

validate(rows);

const ws = XLSX.utils.json_to_sheet(rows, { header: ["terme", "definition", "type"] });
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

const outPath = join(__dirname, "pack-02-voyage-transports.xlsx");
XLSX.writeFile(wb, outPath);