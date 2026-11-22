/**
 * Pack 2 — Voyage & transports (langue deu).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "die Bordkarte", definition: "carte d'embarquement", type: "" },
  { terme: "die Gepäckausgabe", definition: "retrait des bagages", type: "" },
  { terme: "der Zwischenstopp", definition: "escale", type: "" },
  { terme: "die Umsteigezeit", definition: "temps pour changer de train ou d'avion", type: "" },
  { terme: "das Reisegepäck", definition: "bagages", type: "" },
  { terme: "der Koffer", definition: "valise", type: "" },
  { terme: "der Abflug", definition: "départ d'un avion", type: "" },
  { terme: "die Ankunft", definition: "arrivée", type: "" },
  { terme: "die Fahrkarte", definition: "billet de train ou de bus", type: "" },
  { terme: "der Fahrgast", definition: "passager", type: "" },
  { terme: "der Anschlussflug", definition: "vol de correspondance", type: "" },
  { terme: "der Direktflug", definition: "vol sans escale", type: "" },
  { terme: "der Langstreckenflug", definition: "vol long-courrier", type: "" },
  { terme: "der Kurzstreckenflug", definition: "vol court-courrier", type: "" },
  { terme: "der Nachtflug", definition: "vol de nuit", type: "" },
  { terme: "die Überbuchung", definition: "surréservation", type: "" },
  { terme: "das Nichterscheinen", definition: "absence d'un passager annoncé", type: "" },
  { terme: "der Check-in-Schalter", definition: "comptoir d'enregistrement", type: "" },
  { terme: "der Flugsteig", definition: "porte d'embarquement", type: "" },
  { terme: "die Startbahn", definition: "piste de décollage", type: "" },
  { terme: "die Zollerklärung", definition: "déclaration en douane", type: "" },
  { terme: "zollfrei", definition: "hors taxes", type: "" },
  { terme: "die Passkontrolle", definition: "contrôle des passeports", type: "" },
  { terme: "die Visumbefreiung", definition: "entrée sans visa", type: "" },
  { terme: "die Reisewarnung", definition: "avis déconseillant un déplacement", type: "" },
  { terme: "die Rundreise", definition: "voyage en circuit", type: "" },
  { terme: "die Rückfahrkarte", definition: "billet aller-retour", type: "" },
  { terme: "die einfache Fahrt", definition: "trajet aller simple", type: "" },
  { terme: "die Hauptverkehrszeit", definition: "heures de pointe", type: "" },
  { terme: "der Zubringer", definition: "navette", type: "" },
  { terme: "der Mietwagen", definition: "voiture de location", type: "" },
  { terme: "der Standstreifen", definition: "bande d'arrêt d'urgence", type: "" },
  { terme: "die Maut", definition: "péage", type: "" },
  { terme: "die Umweltzone", definition: "zone urbaine à vignette", type: "" },
  { terme: "die Einbahnstraße", definition: "rue à sens unique", type: "" },
  { terme: "die Fußgängerzone", definition: "zone piétonne", type: "" },
  { terme: "der Radweg", definition: "piste cyclable", type: "" },
  { terme: "der Bahnsteig", definition: "quai de gare", type: "" },
  { terme: "der ICE", definition: "train à grande vitesse en Allemagne", type: "" },
  { terme: "der Schlafwagen", definition: "voiture-couchettes", type: "" },
  { terme: "die Fähre", definition: "ferry", type: "" },
  { terme: "das Kreuzfahrtschiff", definition: "paquebot de croisière", type: "" },
  { terme: "das Terminal", definition: "aérogare", type: "" },
  { terme: "das Handgepäck", definition: "bagage cabine", type: "" },
  { terme: "das aufgegebene Gepäck", definition: "bagage enregistré en soute", type: "" },
  { terme: "die Sitzplatzreservierung", definition: "réservation de siège", type: "" },
  { terme: "der Gangplatz", definition: "siège côté couloir", type: "" },
  { terme: "der Fensterplatz", definition: "siège côté hublot", type: "" },
  { terme: "der Anschluss", definition: "correspondance", type: "" },
  { terme: "die Verspätung", definition: "retard de transport", type: "" },
  { terme: "die Stornogebühr", definition: "frais d'annulation", type: "" },
  { terme: "die Reiseversicherung", definition: "assurance voyage", type: "" },
  { terme: "der Jetlag", definition: "fatigue due au décalage horaire", type: "" },
  { terme: "die Wechselstube", definition: "bureau de change", type: "" },
  { terme: "der internationale Führerschein", definition: "permis de conduire international", type: "" },
  { terme: "der Stau", definition: "embouteillage", type: "" },
  { terme: "die Umleitung", definition: "déviation", type: "" },
  { terme: "die Mitfahrgelegenheit", definition: "place en covoiturage", type: "" },
  { terme: "der Fahrplan", definition: "horaires des trains ou des bus", type: "" },
  { terme: "das Fundbüro", definition: "service des objets trouvés", type: "" },
  { terme: "die Gepäckaufbewahrung", definition: "consigne à bagages", type: "" },
  { terme: "der Umsteigebahnhof", definition: "gare où l'on change de train", type: "" },
  { terme: "das Freigepäck", definition: "poids de bagages inclus dans le billet", type: "" },
  { terme: "die Warteliste", definition: "liste d'attente", type: "" },
  { terme: "der Reisepass", definition: "passeport", type: "" },
  // —— 15 verbes à particule séparable ——
  { terme: "abfahren", definition: "quitter un arrêt", type: "" },
  { terme: "abheben", definition: "décoller", type: "" },
  { terme: "aufsetzen", definition: "toucher la piste", type: "" },
  { terme: "anhalten", definition: "s'arrêter (véhicule)", type: "" },
  { terme: "absetzen", definition: "déposer quelqu'un en chemin", type: "" },
  { terme: "abholen", definition: "passer prendre quelqu'un", type: "" },
  { terme: "losfahren", definition: "démarrer un trajet", type: "" },
  { terme: "aufhalten", definition: "retenir et faire perdre du temps", type: "" },
  { terme: "abbremsen", definition: "ralentir en freinant", type: "" },
  { terme: "auftanken", definition: "faire le plein", type: "" },
  { terme: "einsteigen", definition: "monter à bord", type: "" },
  { terme: "aussteigen", definition: "descendre d'un transport", type: "" },
  { terme: "umsteigen", definition: "changer de train, de bus ou d'avion", type: "" },
  { terme: "zurückkommen", definition: "rentrer d'un voyage", type: "" },
  { terme: "mitfahren", definition: "faire le trajet avec quelqu'un", type: "" },
  // —— 20 expressions ——
  { terme: "sich auf den Weg machen", definition: "se mettre en route", type: "expression" },
  { terme: "abseits der ausgetretenen Pfade", definition: "hors des sentiers battus", type: "expression" },
  { terme: "Reisen bildet", definition: "formation de l'esprit par le voyage", type: "expression" },
  { terme: "den Anschluss verpassen", definition: "se laisser distancer", type: "expression" },
  { terme: "am Scheideweg stehen", definition: "être face à un choix décisif", type: "expression" },
  { terme: "auf Achse sein", definition: "être sans cesse en déplacement", type: "expression" },
  { terme: "die Beine in die Hand nehmen", definition: "se dépêcher", type: "expression" },
  { terme: "wie am Schnürchen laufen", definition: "se dérouler sans accroc", type: "expression" },
  { terme: "kurz vor Torschluss", definition: "juste avant la fermeture", type: "expression" },
  { terme: "auf die Tube drücken", definition: "accélérer à fond", type: "expression" },
  { terme: "auf andere Gedanken kommen", definition: "se changer les idées", type: "expression" },
  { terme: "von Pontius zu Pilatus laufen", definition: "courir de guichet en guichet", type: "expression" },
  { terme: "alle Wege führen nach Rom", definition: "plusieurs chemins vers le même but", type: "expression" },
  { terme: "das Steuer herumreißen", definition: "changer brusquement de cap", type: "expression" },
  { terme: "den Amtsschimmel reiten", definition: "s'enliser dans les formalités", type: "expression" },
  { terme: "auf dem falschen Dampfer sein", definition: "partir d'une idée fausse", type: "expression" },
  { terme: "wo sich Fuchs und Hase gute Nacht sagen", definition: "dans un endroit complètement perdu", type: "expression" },
  { terme: "über alle Berge sein", definition: "être déjà loin", type: "expression" },
  { terme: "die Biege machen", definition: "filer en douce", type: "expression" },
  { terme: "Sitzfleisch haben", definition: "supporter une longue attente assise", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-02-voyage-transports.xlsx"));
