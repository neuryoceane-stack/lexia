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
  { terme: "village", definition: "village", type: "" },
  { terme: "suburb", definition: "banlieue", type: "" },
  { terme: "downtown", definition: "centre-ville", type: "" },
  { terme: "outskirts", definition: "périphérie", type: "" },
  { terme: "neighbourhood", definition: "quartier", type: "" },
  { terme: "district", definition: "arrondissement", type: "" },
  { terme: "street", definition: "rue", type: "" },
  { terme: "avenue", definition: "avenue", type: "" },
  { terme: "boulevard", definition: "boulevard", type: "" },
  { terme: "alley", definition: "ruelle", type: "" },
  { terme: "square", definition: "place", type: "" },
  { terme: "plaza", definition: "esplanade", type: "" },
  { terme: "crossing", definition: "passage piéton", type: "" },
  { terme: "pavement", definition: "trottoir", type: "" },
  { terme: "curb", definition: "bordure de trottoir", type: "" },
  { terme: "junction", definition: "carrefour", type: "" },
  { terme: "roundabout", definition: "rond-point", type: "" },
  { terme: "traffic light", definition: "feu tricolore", type: "" },
  { terme: "signpost", definition: "panneau indicateur", type: "" },
  { terme: "landmark", definition: "repère", type: "" },
  { terme: "monument", definition: "monument", type: "" },
  { terme: "fountain", definition: "fontaine", type: "" },
  { terme: "obelisk", definition: "obélisque", type: "" },
  { terme: "cathedral", definition: "cathédrale", type: "" },
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
  { terme: "GPS", definition: "système de positionnement", type: "" },
  { terme: "route", definition: "itinéraire", type: "" },
  { terme: "shortcut", definition: "raccourci", type: "" },
  { terme: "detour", definition: "détour", type: "" },
  { terme: "intersection", definition: "croisement", type: "" },
  { terme: "underpass", definition: "passage souterrain", type: "" },
  { terme: "overpass", definition: "passage supérieur", type: "" },
  { terme: "footbridge", definition: "passerelle", type: "" },
  { terme: "metro", definition: "métro", type: "" },
  { terme: "tram", definition: "tramway", type: "" },
  { terme: "parking lot", definition: "parking", type: "" },
  { terme: "zebra crossing", definition: "passage piéton clouté", type: "" },
  { terme: "construction site", definition: "chantier", type: "" },
  { terme: "billboard", definition: "panneau publicitaire", type: "" },
  { terme: "streetlamp", definition: "réverbère", type: "" },
  { terme: "postcode", definition: "code postal", type: "" },
  { terme: "crosswalk", definition: "passage protégé", type: "" },
  { terme: "head for", definition: "tu te diriges vers", type: "" },
  { terme: "pass by", definition: "tu passes devant", type: "" },
  { terme: "turn around", definition: "tu fais demi-tour", type: "" },
  { terme: "cut across", definition: "tu traverses en raccourci", type: "" },
  { terme: "draw up", definition: "tu te ranges sur le côté", type: "" },
  { terme: "turn back", definition: "tu rebrousses chemin", type: "" },
  { terme: "make for", definition: "tu vas vers", type: "" },
  { terme: "get across", definition: "tu traverses", type: "" },
  { terme: "set down", definition: "tu déposes quelqu'un", type: "" },
  { terme: "collect", definition: "tu récupères quelqu'un", type: "" },
  { terme: "sign in", definition: "tu t'enregistres", type: "" },
  { terme: "check out", definition: "tu quittes ton hôtel", type: "" },
  { terme: "map out", definition: "tu traces ton parcours", type: "" },
  { terme: "wind up", definition: "tu te retrouves", type: "" },
  { terme: "end up", definition: "tu finis par arriver", type: "" },
  { terme: "concrete jungle", definition: "jungle de béton", type: "expression" },
  { terme: "hustle and bustle", definition: "effervescence", type: "expression" },
  { terme: "the road less travelled", definition: "la voie moins fréquentée", type: "expression" },
  { terme: "a stone's throw away", definition: "à deux pas", type: "expression" },
  { terme: "around the corner", definition: "au coin de la rue", type: "expression" },
  { terme: "lose your way", definition: "tu te perds", type: "expression" },
  { terme: "find your bearings", definition: "tu retrouves tes repères", type: "expression" },
  { terme: "up and about", definition: "sur pieds", type: "expression" },
  { terme: "take to the streets", definition: "tu envahis la rue", type: "expression" },
  { terme: "on the map", definition: "connu", type: "expression" },
  { terme: "the middle of nowhere", definition: "au milieu de nulle part", type: "expression" },
  { terme: "bright lights", definition: "grande ville", type: "expression" },
  { terme: "a hive of activity", definition: "un fourmilier", type: "expression" },
  { terme: "back streets", definition: "rues secondaires", type: "expression" },
  { terme: "main drag", definition: "artère principale", type: "expression" },
  { terme: "a hop skip and a jump", definition: "tout près", type: "expression" },
  { terme: "cross paths", definition: "tu croises la route de", type: "expression" },
  { terme: "go with the flow", definition: "tu suis le courant", type: "expression" },
  { terme: "urban sprawl", definition: "étalement urbain", type: "expression" },
  { terme: "a home from home", definition: "comme chez toi", type: "expression" },
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