/**
 * Pack 15 — Nature & animaux (langue deu).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "das Säugetier", definition: "mammifère", type: "" },
  { terme: "das Reptil", definition: "reptile", type: "" },
  { terme: "die Amphibie", definition: "amphibien", type: "" },
  { terme: "das Insekt", definition: "insecte", type: "" },
  { terme: "der Käfer", definition: "coléoptère", type: "" },
  { terme: "der Schmetterling", definition: "papillon", type: "" },
  { terme: "die Spinne", definition: "araignée", type: "" },
  { terme: "die Ameise", definition: "fourmi", type: "" },
  { terme: "die Biene", definition: "abeille", type: "" },
  { terme: "die Wespe", definition: "guêpe", type: "" },
  { terme: "die Mücke", definition: "moustique", type: "" },
  { terme: "der Fuchs", definition: "renard", type: "" },
  { terme: "der Hirsch", definition: "cerf", type: "" },
  { terme: "das Kaninchen", definition: "lapin", type: "" },
  { terme: "das Eichhörnchen", definition: "écureuil", type: "" },
  { terme: "der Igel", definition: "hérisson", type: "" },
  { terme: "die Eule", definition: "chouette", type: "" },
  { terme: "der Falke", definition: "faucon", type: "" },
  { terme: "der Adler", definition: "aigle", type: "" },
  { terme: "der Wolf", definition: "loup", type: "" },
  { terme: "der Bär", definition: "ours", type: "" },
  { terme: "der Löwe", definition: "lion", type: "" },
  { terme: "der Tiger", definition: "tigre", type: "" },
  { terme: "der Elefant", definition: "éléphant", type: "" },
  { terme: "die Giraffe", definition: "girafe", type: "" },
  { terme: "das Zebra", definition: "zèbre", type: "" },
  { terme: "der Affe", definition: "singe", type: "" },
  { terme: "der Delfin", definition: "dauphin", type: "" },
  { terme: "der Wal", definition: "baleine", type: "" },
  { terme: "der Hai", definition: "requin", type: "" },
  { terme: "die Schildkröte", definition: "tortue", type: "" },
  { terme: "die Schlange", definition: "serpent", type: "" },
  { terme: "die Eidechse", definition: "lézard", type: "" },
  { terme: "der Frosch", definition: "grenouille", type: "" },
  { terme: "der Pinguin", definition: "manchot", type: "" },
  { terme: "das Känguru", definition: "kangourou", type: "" },
  { terme: "der Lebensraum", definition: "milieu de vie d'une espèce", type: "" },
  { terme: "das Raubtier", definition: "prédateur", type: "" },
  { terme: "die Beute", definition: "proie", type: "" },
  { terme: "die Pfote", definition: "patte", type: "" },
  { terme: "die Kralle", definition: "griffe", type: "" },
  { terme: "der Fangzahn", definition: "croc", type: "" },
  { terme: "die Feder", definition: "plume", type: "" },
  { terme: "das Fell", definition: "fourrure", type: "" },
  { terme: "die Schuppe", definition: "écaille", type: "" },
  { terme: "der Huf", definition: "sabot", type: "" },
  { terme: "das Horn", definition: "corne", type: "" },
  { terme: "das Geweih", definition: "bois du cerf", type: "" },
  { terme: "das Nest", definition: "nid", type: "" },
  { terme: "die Höhle", definition: "grotte", type: "" },
  { terme: "der Bau", definition: "terrier", type: "" },
  { terme: "die Wiese", definition: "prairie", type: "" },
  { terme: "das Tal", definition: "vallée", type: "" },
  { terme: "die Klippe", definition: "falaise", type: "" },
  { terme: "der Wasserfall", definition: "cascade", type: "" },
  { terme: "der Teich", definition: "étang", type: "" },
  { terme: "der Dschungel", definition: "jungle", type: "" },
  { terme: "die Savanne", definition: "savane", type: "" },
  { terme: "das Blätterdach", definition: "canopée", type: "" },
  { terme: "die Rinde", definition: "écorce", type: "" },
  { terme: "der Farn", definition: "fougère", type: "" },
  { terme: "der Pilz", definition: "champignon", type: "" },
  { terme: "das Rind", definition: "bovin", type: "" },
  { terme: "der Schäfer", definition: "berger", type: "" },
  { terme: "die Scheune", definition: "grange", type: "" },
  // —— 15 verbes à particule séparable ——
  { terme: "aufblühen", definition: "s'épanouir", type: "" },
  { terme: "abfressen", definition: "brouter à ras", type: "" },
  { terme: "ausbrüten", definition: "couver", type: "" },
  { terme: "sich anpirschen", definition: "s'approcher sans bruit", type: "" },
  { terme: "davonlaufen", definition: "s'enfuir", type: "" },
  { terme: "umherstreifen", definition: "errer", type: "" },
  { terme: "aufgehen", definition: "germer", type: "" },
  { terme: "eingehen", definition: "dépérir", type: "" },
  { terme: "abwerfen", definition: "perdre ses bois ou ses feuilles", type: "" },
  { terme: "anspülen", definition: "rejeter sur le rivage", type: "" },
  { terme: "untertauchen", definition: "plonger", type: "" },
  { terme: "aufscheuchen", definition: "faire s'envoler", type: "" },
  { terme: "auswildern", definition: "relâcher dans la nature", type: "" },
  { terme: "anlocken", definition: "attirer", type: "" },
  { terme: "sich fortpflanzen", definition: "se reproduire", type: "" },
  // —— 20 expressions ——
  { terme: "die Katze lässt das Mausen nicht", definition: "retrouver toujours son naturel", type: "expression" },
  { terme: "sich wie ein Fisch auf dem Trockenen fühlen", definition: "être complètement déplacé", type: "expression" },
  { terme: "fleißig wie eine Biene", definition: "très actif et travailleur", type: "expression" },
  { terme: "schlau wie ein Fuchs", definition: "rusé", type: "expression" },
  { terme: "frei wie ein Vogel", definition: "libre de toute attache", type: "expression" },
  { terme: "in der Höhle des Löwen", definition: "en territoire hostile", type: "expression" },
  { terme: "ein Wolf im Schafspelz", definition: "personne dangereuse sous une apparence douce", type: "expression" },
  { terme: "schlafende Hunde wecken", definition: "réveiller une histoire mieux laissée en paix", type: "expression" },
  { terme: "Morgenstund hat Gold im Mund", definition: "avantage à qui commence tôt", type: "expression" },
  { terme: "am Sankt-Nimmerleins-Tag", definition: "jamais", type: "expression" },
  { terme: "zwei Fliegen mit einer Klappe schlagen", definition: "faire d'une pierre deux coups", type: "expression" },
  { terme: "die Kirche im Dorf lassen", definition: "rester mesuré", type: "expression" },
  { terme: "ein Spatz in der Hand ist besser als eine Taube auf dem Dach", definition: "avantage sûr préférable à une promesse", type: "expression" },
  { terme: "der Löwenanteil", definition: "la plus grosse part", type: "expression" },
  { terme: "Neugier ist der Katze Tod", definition: "curiosité qui se paie cher", type: "expression" },
  { terme: "das Fell des Bären nicht verteilen", definition: "compter sur un résultat avant de l'avoir", type: "expression" },
  { terme: "das schwarze Schaf", definition: "brebis galeuse", type: "expression" },
  { terme: "eine falsche Schlange", definition: "personne sournoise", type: "expression" },
  { terme: "den Stier bei den Hörnern packen", definition: "affronter une difficulté de face", type: "expression" },
  { terme: "jemandem einen Bären aufbinden", definition: "faire avaler une histoire fausse", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-15-nature-animaux.xlsx"));
