/**
 * Pack 16 — Ville & orientation (langue eng).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  { terme: "city", definition: "ville", type: "" },
  { terme: "town", definition: "bourg", type: "" },
  { terme: "cul-de-sac", definition: "impasse", type: "" },
  { terme: "suburb", definition: "banlieue", type: "" },
  { terme: "downtown", definition: "centre-ville", type: "" },
  { terme: "outskirts", definition: "périphérie", type: "" },
  { terme: "neighbourhood", definition: "quartier", type: "" },
  { terme: "district", definition: "arrondissement", type: "" },
  { terme: "street", definition: "rue", type: "" },
  { terme: "thoroughfare", definition: "grande artère", type: "" },
  { terme: "promenade", definition: "esplanade piétonne", type: "" },
  { terme: "alley", definition: "ruelle", type: "" },
  { terme: "square", definition: "place", type: "" },
  { terme: "plaza", definition: "esplanade", type: "" },
  { terme: "bus lane", definition: "voie de bus", type: "" },
  { terme: "pavement", definition: "trottoir", type: "" },
  { terme: "curb", definition: "bordure de trottoir", type: "" },
  { terme: "junction", definition: "carrefour", type: "" },
  { terme: "roundabout", definition: "rond-point", type: "" },
  { terme: "traffic light", definition: "feu tricolore", type: "" },
  { terme: "signpost", definition: "panneau indicateur", type: "" },
  { terme: "landmark", definition: "repère", type: "" },
  { terme: "war memorial", definition: "monument aux morts", type: "" },
  { terme: "drinking fountain", definition: "fontaine à eau publique", type: "" },
  { terme: "spire", definition: "flèche (architecture)", type: "" },
  { terme: "basilica", definition: "basilique", type: "" },
  { terme: "town hall", definition: "mairie", type: "" },
  { terme: "harbour", definition: "port", type: "" },
  { terme: "dock", definition: "quai", type: "" },
  { terme: "warehouse", definition: "entrepôt", type: "" },
  { terme: "skyscraper", definition: "gratte-ciel", type: "" },
  { terme: "block", definition: "îlot urbain", type: "" },
  { terme: "storey", definition: "étage", type: "" },
  { terme: "entrance", definition: "accès", type: "" },
  { terme: "exit", definition: "sortie", type: "" },
  { terme: "pedestrian", definition: "piéton", type: "" },
  { terme: "commuter", definition: "usager des transports", type: "" },
  { terme: "rush hour", definition: "heure de pointe", type: "" },
  { terme: "one-way", definition: "sens unique", type: "" },
  { terme: "north", definition: "nord", type: "" },
  { terme: "south", definition: "sud", type: "" },
  { terme: "east", definition: "est", type: "" },
  { terme: "west", definition: "ouest", type: "" },
  { terme: "left", definition: "gauche", type: "" },
  { terme: "right-hand", definition: "droite", type: "" },
  { terme: "straight ahead", definition: "tout droit", type: "" },
  { terme: "map", definition: "plan", type: "" },
  { terme: "compass", definition: "boussole", type: "" },
  { terme: "satnav", definition: "GPS embarqué", type: "" },
  { terme: "route", definition: "itinéraire", type: "" },
  { terme: "shortcut", definition: "raccourci", type: "" },
  { terme: "detour", definition: "détour", type: "" },
  { terme: "flyover", definition: "échangeur aérien", type: "" },
  { terme: "underpass", definition: "passage souterrain", type: "" },
  { terme: "overpass", definition: "passage supérieur", type: "" },
  { terme: "footbridge", definition: "passerelle", type: "" },
  { terme: "underground", definition: "métro souterrain", type: "" },
  { terme: "light rail", definition: "train léger", type: "" },
  { terme: "parking lot", definition: "parking", type: "" },
  { terme: "zebra crossing", definition: "passage piéton clouté", type: "" },
  { terme: "construction site", definition: "chantier", type: "" },
  { terme: "billboard", definition: "panneau publicitaire", type: "" },
  { terme: "streetlamp", definition: "réverbère", type: "" },
  { terme: "postcode", definition: "code postal", type: "" },
  { terme: "housing estate", definition: "cité (ensemble de logements)", type: "" },
  { terme: "head for", definition: "se diriger vers", type: "" },
  { terme: "pass by", definition: "passer devant", type: "" },
  { terme: "branch off", definition: "emprunter une bretelle", type: "" },
  { terme: "cut across", definition: "traverser en raccourci", type: "" },
  { terme: "stop off", definition: "faire escale", type: "" },
  { terme: "turn back", definition: "rebrousser chemin", type: "" },
  { terme: "make for", definition: "se rendre vers", type: "" },
  { terme: "get across", definition: "traverser", type: "" },
  { terme: "set down", definition: "déposer quelqu'un", type: "" },
  { terme: "veer off", definition: "quitter la route", type: "" },
  { terme: "sign in", definition: "pointer à l'accueil", type: "" },
  { terme: "check out", definition: "quitter son hôtel", type: "" },
  { terme: "map out", definition: "tracer un parcours", type: "" },
  { terme: "look around", definition: "chercher les alentours", type: "" },
  { terme: "end up", definition: "finir par arriver", type: "" },
  { terme: "concrete jungle", definition: "jungle de béton", type: "expression" },
  { terme: "hustle and bustle", definition: "effervescence", type: "expression" },
  { terme: "on every corner", definition: "à tous les coins de rue", type: "expression" },
  { terme: "a stone's throw away", definition: "à deux pas", type: "expression" },
  { terme: "around the corner", definition: "au coin de la rue", type: "expression" },
  { terme: "lose your way", definition: "se perdre", type: "expression" },
  { terme: "find your bearings", definition: "retrouver ses repères", type: "expression" },
  { terme: "a city that never sleeps", definition: "une ville qui ne dort jamais", type: "expression" },
  { terme: "take to the streets", definition: "envahir la rue", type: "expression" },
  { terme: "on the map", definition: "connu", type: "expression" },
  { terme: "the middle of nowhere", definition: "au milieu de nulle part", type: "expression" },
  { terme: "bright lights", definition: "grande ville", type: "expression" },
  { terme: "a hive of activity", definition: "une ruche d'activité, un lieu très animé", type: "expression" },
  { terme: "back streets", definition: "rues secondaires", type: "expression" },
  { terme: "main drag", definition: "artère principale", type: "expression" },
  { terme: "a hop skip and a jump", definition: "tout près", type: "expression" },
  { terme: "cross paths", definition: "croiser la route de", type: "expression" },
  { terme: "go with the flow", definition: "suivre le courant", type: "expression" },
  { terme: "urban sprawl", definition: "étalement urbain", type: "expression" },
  { terme: "a home from home", definition: "comme chez soi", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-16-ville-orientation.xlsx"));