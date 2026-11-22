/**
 * Pack 9 — Technologie & sciences (langue deu).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "der Code", definition: "code informatique", type: "" },
  { terme: "die App", definition: "application", type: "" },
  { terme: "das Internet", definition: "internet", type: "" },
  { terme: "der Chip", definition: "puce électronique", type: "" },
  { terme: "die Daten", definition: "données", type: "" },
  { terme: "die Datei", definition: "fichier", type: "" },
  { terme: "die Festplatte", definition: "disque dur", type: "" },
  { terme: "die Cloud", definition: "nuage informatique", type: "" },
  { terme: "der Bug", definition: "bogue", type: "" },
  { terme: "der Hackerangriff", definition: "attaque de piratage", type: "" },
  { terme: "der Bot", definition: "robot logiciel", type: "" },
  { terme: "die KI", definition: "intelligence artificielle", type: "" },
  { terme: "der Bildschirm", definition: "écran", type: "" },
  { terme: "die Computermaus", definition: "souris d'ordinateur", type: "" },
  { terme: "der Klick", definition: "clic", type: "" },
  { terme: "die Wischgeste", definition: "glissement du doigt sur l'écran", type: "" },
  { terme: "das Pixel", definition: "pixel", type: "" },
  { terme: "das Byte", definition: "octet", type: "" },
  { terme: "der Router", definition: "routeur", type: "" },
  { terme: "der Server", definition: "serveur informatique", type: "" },
  { terme: "das Update", definition: "mise à jour", type: "" },
  { terme: "das Backup", definition: "sauvegarde", type: "" },
  { terme: "die Schadsoftware", definition: "logiciel malveillant", type: "" },
  { terme: "der Patch", definition: "correctif", type: "" },
  { terme: "der Browser", definition: "navigateur", type: "" },
  { terme: "das Cookie", definition: "traceur déposé par un site", type: "" },
  { terme: "der Laptop", definition: "ordinateur portable", type: "" },
  { terme: "das Tablet", definition: "tablette", type: "" },
  { terme: "das Gadget", definition: "gadget", type: "" },
  { terme: "der Sensor", definition: "capteur", type: "" },
  { terme: "der Roboter", definition: "robot", type: "" },
  { terme: "das Labor", definition: "laboratoire", type: "" },
  { terme: "das Experiment", definition: "expérience scientifique", type: "" },
  { terme: "die Hypothese", definition: "hypothèse", type: "" },
  { terme: "die Theorie", definition: "théorie", type: "" },
  { terme: "die Formel", definition: "formule", type: "" },
  { terme: "das Molekül", definition: "molécule", type: "" },
  { terme: "das Atom", definition: "atome", type: "" },
  { terme: "die Schwerkraft", definition: "gravité", type: "" },
  { terme: "die Energie", definition: "énergie, grandeur physique", type: "" },
  { terme: "die Erfindung", definition: "invention", type: "" },
  { terme: "das Patent", definition: "brevet", type: "" },
  { terme: "der Prototyp", definition: "prototype", type: "" },
  { terme: "die Innovation", definition: "innovation", type: "" },
  { terme: "die Programmierung", definition: "programmation", type: "" },
  { terme: "die Schnittstelle", definition: "interface", type: "" },
  { terme: "die Verschlüsselung", definition: "chiffrement", type: "" },
  { terme: "das Netzwerk", definition: "réseau informatique", type: "" },
  { terme: "die Bandbreite", definition: "bande passante", type: "" },
  { terme: "der Absturz", definition: "plantage d'un programme", type: "" },
  { terme: "die Fehlermeldung", definition: "message d'erreur", type: "" },
  { terme: "der Nutzer", definition: "utilisateur", type: "" },
  { terme: "das Betriebssystem", definition: "système d'exploitation", type: "" },
  { terme: "die Tastatur", definition: "clavier", type: "" },
  { terme: "der USB-Stick", definition: "clé USB", type: "" },
  { terme: "das WLAN", definition: "wifi", type: "" },
  { terme: "der Akku", definition: "batterie", type: "" },
  { terme: "das Ladegerät", definition: "chargeur", type: "" },
  { terme: "die Drohne", definition: "drone", type: "" },
  { terme: "der 3D-Druck", definition: "impression en trois dimensions", type: "" },
  { terme: "die virtuelle Realität", definition: "réalité virtuelle", type: "" },
  { terme: "das Mikroskop", definition: "microscope", type: "" },
  { terme: "das Teleskop", definition: "télescope", type: "" },
  { terme: "die Messung", definition: "mesure", type: "" },
  { terme: "das Ergebnis", definition: "résultat", type: "" },
  // —— 15 verbes à particule séparable ——
  { terme: "anschließen", definition: "brancher", type: "" },
  { terme: "abspeichern", definition: "enregistrer un fichier", type: "" },
  { terme: "eingeben", definition: "saisir au clavier", type: "" },
  { terme: "ausdrucken", definition: "imprimer", type: "" },
  { terme: "hochfahren", definition: "démarrer un appareil", type: "" },
  { terme: "herunterfahren", definition: "arrêter un appareil", type: "" },
  { terme: "einrichten", definition: "configurer", type: "" },
  { terme: "freischalten", definition: "activer un accès", type: "" },
  { terme: "ausprobieren", definition: "tester", type: "" },
  { terme: "nachrüsten", definition: "ajouter un équipement après coup", type: "" },
  { terme: "weiterentwickeln", definition: "faire évoluer", type: "" },
  { terme: "auswerten", definition: "analyser des données", type: "" },
  { terme: "anzeigen", definition: "afficher à l'écran", type: "" },
  { terme: "eingreifen", definition: "intervenir dans un processus", type: "" },
  { terme: "zurücksetzen", definition: "réinitialiser", type: "" },
  // —— 20 expressions ——
  { terme: "auf dem Schirm haben", definition: "avoir quelque chose bien en tête", type: "expression" },
  { terme: "den Durchblick haben", definition: "y voir clair", type: "expression" },
  { terme: "im Dunkeln tappen", definition: "avancer sans comprendre", type: "expression" },
  { terme: "das Rad neu erfinden", definition: "réinventer la roue", type: "expression" },
  { terme: "der Groschen fällt", definition: "avoir enfin le déclic", type: "expression" },
  { terme: "aus der Steinzeit stammen", definition: "être complètement dépassé", type: "expression" },
  { terme: "auf dem neuesten Stand sein", definition: "être à jour", type: "expression" },
  { terme: "keine Raketenwissenschaft sein", definition: "ne pas être bien compliqué", type: "expression" },
  { terme: "den Stecker ziehen", definition: "couper net", type: "expression" },
  { terme: "eine Baustelle sein", definition: "être encore inachevé", type: "expression" },
  { terme: "Daten sind das neue Öl", definition: "les données, ressource stratégique du moment", type: "expression" },
  { terme: "offline sein", definition: "être injoignable", type: "expression" },
  { terme: "in Nullen und Einsen denken", definition: "raisonner de façon purement technique", type: "expression" },
  { terme: "zwei Schritte voraus sein", definition: "avoir une longueur d'avance", type: "expression" },
  { terme: "am Puls der Zeit sein", definition: "être dans l'air du temps", type: "expression" },
  { terme: "eine Blackbox sein", definition: "rester opaque", type: "expression" },
  { terme: "den Geist aufgeben", definition: "tomber en panne pour de bon", type: "expression" },
  { terme: "auf Hochtouren laufen", definition: "tourner à plein régime", type: "expression" },
  { terme: "ins Stocken geraten", definition: "se bloquer en cours de route", type: "expression" },
  { terme: "einen Haken haben", definition: "cacher un défaut", type: "expression" },
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
