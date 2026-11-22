/**
 * Pack 16 — Ville & orientation (langue deu).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "die Stadt", definition: "ville", type: "" },
  { terme: "die Kleinstadt", definition: "petite ville", type: "" },
  { terme: "die Sackgasse", definition: "impasse", type: "" },
  { terme: "der Vorort", definition: "banlieue", type: "" },
  { terme: "die Innenstadt", definition: "centre-ville", type: "" },
  { terme: "der Stadtrand", definition: "périphérie", type: "" },
  { terme: "das Viertel", definition: "quartier", type: "" },
  { terme: "der Bezirk", definition: "arrondissement", type: "" },
  { terme: "die Straße", definition: "rue", type: "" },
  { terme: "die Allee", definition: "avenue", type: "" },
  { terme: "die Promenade", definition: "promenade", type: "" },
  { terme: "die Gasse", definition: "ruelle", type: "" },
  { terme: "der Marktplatz", definition: "place centrale", type: "" },
  { terme: "die Busspur", definition: "voie réservée aux bus", type: "" },
  { terme: "der Bürgersteig", definition: "trottoir", type: "" },
  { terme: "die Bordsteinkante", definition: "bordure de trottoir", type: "" },
  { terme: "die Kreuzung", definition: "carrefour", type: "" },
  { terme: "der Kreisverkehr", definition: "rond-point", type: "" },
  { terme: "die Ampel", definition: "feu tricolore", type: "" },
  { terme: "der Wegweiser", definition: "panneau indicateur", type: "" },
  { terme: "der Orientierungspunkt", definition: "point de repère", type: "" },
  { terme: "das Mahnmal", definition: "monument commémoratif", type: "" },
  { terme: "der Trinkbrunnen", definition: "fontaine publique", type: "" },
  { terme: "der Kirchturm", definition: "clocher", type: "" },
  { terme: "das Rathaus", definition: "mairie", type: "" },
  { terme: "der Hafen", definition: "port", type: "" },
  { terme: "das Lagerhaus", definition: "entrepôt", type: "" },
  { terme: "der Wolkenkratzer", definition: "gratte-ciel", type: "" },
  { terme: "der Häuserblock", definition: "pâté de maisons", type: "" },
  { terme: "das Stockwerk", definition: "étage", type: "" },
  { terme: "der Eingang", definition: "accès d'un lieu", type: "" },
  { terme: "der Ausgang", definition: "sortie", type: "" },
  { terme: "der Fußgänger", definition: "piéton", type: "" },
  { terme: "der Pendler", definition: "personne qui fait la navette domicile-travail", type: "" },
  { terme: "der Feierabendverkehr", definition: "circulation de fin de journée", type: "" },
  { terme: "der Norden", definition: "nord", type: "" },
  { terme: "der Süden", definition: "sud", type: "" },
  { terme: "der Osten", definition: "est", type: "" },
  { terme: "der Westen", definition: "ouest", type: "" },
  { terme: "links", definition: "à gauche", type: "" },
  { terme: "rechts", definition: "à droite", type: "" },
  { terme: "geradeaus", definition: "tout droit", type: "" },
  { terme: "der Stadtplan", definition: "plan de la ville", type: "" },
  { terme: "der Kompass", definition: "boussole", type: "" },
  { terme: "das Navi", definition: "guidage GPS", type: "" },
  { terme: "die Route", definition: "itinéraire", type: "" },
  { terme: "die Abkürzung", definition: "raccourci", type: "" },
  { terme: "der Umweg", definition: "détour", type: "" },
  { terme: "die Hochstraße", definition: "voie surélevée", type: "" },
  { terme: "die Unterführung", definition: "passage souterrain", type: "" },
  { terme: "die Überführung", definition: "pont au-dessus d'une voie", type: "" },
  { terme: "der Steg", definition: "passerelle", type: "" },
  { terme: "die U-Bahn", definition: "métro", type: "" },
  { terme: "die S-Bahn", definition: "train urbain et de banlieue", type: "" },
  { terme: "der Parkplatz", definition: "parking", type: "" },
  { terme: "der Zebrastreifen", definition: "passage piéton", type: "" },
  { terme: "die Baustelle", definition: "chantier", type: "" },
  { terme: "die Werbetafel", definition: "panneau publicitaire", type: "" },
  { terme: "die Straßenlaterne", definition: "réverbère", type: "" },
  { terme: "die Postleitzahl", definition: "code postal", type: "" },
  { terme: "die Wohnsiedlung", definition: "ensemble de logements", type: "" },
  { terme: "die Haltestelle", definition: "arrêt", type: "" },
  { terme: "die Altstadt", definition: "vieille ville", type: "" },
  { terme: "die Fußgängerampel", definition: "feu pour les piétons", type: "" },
  { terme: "das Schild", definition: "panneau", type: "" },
  // —— 15 verbes à particule séparable ——
  { terme: "abbiegen", definition: "tourner", type: "" },
  { terme: "einbiegen", definition: "s'engager dans une rue", type: "" },
  { terme: "hinübergehen", definition: "traverser à pied", type: "" },
  { terme: "entlanggehen", definition: "longer une rue", type: "" },
  { terme: "ausweichen", definition: "éviter un obstacle", type: "" },
  { terme: "ankommen", definition: "arriver sur place", type: "" },
  { terme: "weitergehen", definition: "continuer tout droit", type: "" },
  { terme: "umdrehen", definition: "faire demi-tour", type: "" },
  { terme: "stehenbleiben", definition: "s'arrêter net", type: "" },
  { terme: "vorbeigehen", definition: "passer devant à pied", type: "" },
  { terme: "gegenüberliegen", definition: "se trouver en face", type: "" },
  { terme: "hinaufgehen", definition: "monter une rue ou un escalier", type: "" },
  { terme: "hinuntergehen", definition: "descendre une rue ou un escalier", type: "" },
  { terme: "zurechtfinden", definition: "s'orienter", type: "" },
  { terme: "anfahren", definition: "desservir un arrêt", type: "" },
  // —— 20 expressions ——
  { terme: "die Betonwüste", definition: "désert de béton", type: "expression" },
  { terme: "das bunte Treiben", definition: "animation et va-et-vient", type: "expression" },
  { terme: "an jeder Ecke", definition: "à chaque coin de rue", type: "expression" },
  { terme: "einen Katzensprung entfernt", definition: "à deux pas", type: "expression" },
  { terme: "um die Ecke", definition: "au coin de la rue", type: "expression" },
  { terme: "sich verlaufen", definition: "perdre son chemin", type: "expression" },
  { terme: "die Orientierung verlieren", definition: "perte de ses repères", type: "expression" },
  { terme: "eine Stadt, die nie schläft", definition: "une ville toujours en éveil", type: "expression" },
  { terme: "auf die Straße gehen", definition: "descendre dans la rue pour protester", type: "expression" },
  { terme: "auf der Landkarte stehen", definition: "compter aux yeux des autres", type: "expression" },
  { terme: "am Ende der Welt", definition: "au bout du monde", type: "expression" },
  { terme: "das Lichtermeer", definition: "mer de lumières urbaines", type: "expression" },
  { terme: "ein Ameisenhaufen", definition: "lieu qui grouille de monde", type: "expression" },
  { terme: "die Seitenstraßen", definition: "rues à l'écart du passage", type: "expression" },
  { terme: "die Hauptschlagader", definition: "artère principale d'une ville", type: "expression" },
  { terme: "sich über den Weg laufen", definition: "se croiser par hasard", type: "expression" },
  { terme: "mit dem Strom schwimmen", definition: "suivre le mouvement général", type: "expression" },
  { terme: "die Stadt frisst das Land", definition: "extension de la ville sur la campagne", type: "expression" },
  { terme: "in Sichtweite", definition: "à portée de vue", type: "expression" },
  { terme: "zwischen Tür und Angel", definition: "en coup de vent, sur le pas de la porte", type: "expression" },
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
