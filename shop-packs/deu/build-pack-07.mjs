/**
 * Pack 7 — Vie quotidienne (langue deu).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "das Zuhause", definition: "foyer", type: "" },
  { terme: "die Wohnung", definition: "appartement", type: "" },
  { terme: "die Miete", definition: "loyer", type: "" },
  { terme: "die Rechnung", definition: "facture", type: "" },
  { terme: "der Schlüssel", definition: "clé", type: "" },
  { terme: "das Schloss", definition: "serrure", type: "" },
  { terme: "die Tür", definition: "porte", type: "" },
  { terme: "die Klingel", definition: "sonnette", type: "" },
  { terme: "die Treppenstufe", definition: "marche d'escalier", type: "" },
  { terme: "der Aufzug", definition: "ascenseur", type: "" },
  { terme: "das Sofa", definition: "canapé", type: "" },
  { terme: "das Bett", definition: "lit", type: "" },
  { terme: "das Kopfkissen", definition: "oreiller", type: "" },
  { terme: "das Bettlaken", definition: "drap", type: "" },
  { terme: "das Handtuch", definition: "serviette de toilette", type: "" },
  { terme: "die Badewanne", definition: "baignoire", type: "" },
  { terme: "die Dusche", definition: "douche", type: "" },
  { terme: "der Wasserhahn", definition: "robinet", type: "" },
  { terme: "das Waschbecken", definition: "lavabo", type: "" },
  { terme: "die Seife", definition: "savon", type: "" },
  { terme: "die Bürste", definition: "brosse", type: "" },
  { terme: "der Spiegel", definition: "miroir", type: "" },
  { terme: "der Mülleimer", definition: "poubelle", type: "" },
  { terme: "das Regal", definition: "étagère", type: "" },
  { terme: "die Schublade", definition: "tiroir", type: "" },
  { terme: "der Kühlschrank", definition: "réfrigérateur", type: "" },
  { terme: "der Backofen", definition: "four", type: "" },
  { terme: "die Pfanne", definition: "poêle", type: "" },
  { terme: "der Topf", definition: "casserole", type: "" },
  { terme: "der Teller", definition: "assiette", type: "" },
  { terme: "die Tasse", definition: "tasse", type: "" },
  { terme: "die Gabel", definition: "fourchette", type: "" },
  { terme: "das Messer", definition: "couteau", type: "" },
  { terme: "der Löffel", definition: "cuillère", type: "" },
  { terme: "das Frühstück", definition: "petit-déjeuner", type: "" },
  { terme: "das Mittagessen", definition: "déjeuner", type: "" },
  { terme: "die Zwischenmahlzeit", definition: "en-cas", type: "" },
  { terme: "das Abendessen", definition: "dîner", type: "" },
  { terme: "der Einkauf", definition: "courses", type: "" },
  { terme: "die Hausarbeit", definition: "ménage", type: "" },
  { terme: "die Wäsche", definition: "linge", type: "" },
  { terme: "das Bügeln", definition: "repassage", type: "" },
  { terme: "der Staubsauger", definition: "aspirateur", type: "" },
  { terme: "aufgeräumt", definition: "rangé", type: "" },
  { terme: "die Unordnung", definition: "désordre", type: "" },
  { terme: "die Gewohnheit", definition: "habitude", type: "" },
  { terme: "der Alltag", definition: "train-train quotidien", type: "" },
  { terme: "der Nachbar", definition: "voisin", type: "" },
  { terme: "der Vermieter", definition: "propriétaire bailleur", type: "" },
  { terme: "der Mieter", definition: "locataire", type: "" },
  { terme: "die Besorgung", definition: "course à faire dehors", type: "" },
  { terme: "die Warteschlange", definition: "file d'attente", type: "" },
  { terme: "der Geldbeutel", definition: "porte-monnaie", type: "" },
  { terme: "der Kassenbon", definition: "ticket de caisse", type: "" },
  { terme: "der Rabatt", definition: "réduction sur un prix", type: "" },
  { terme: "der Haushalt", definition: "ménage au sens du foyer", type: "" },
  { terme: "die Schlafenszeit", definition: "heure du coucher", type: "" },
  { terme: "das Nickerchen", definition: "sieste", type: "" },
  { terme: "die Mikrowelle", definition: "four à micro-ondes", type: "" },
  { terme: "der Geschirrspüler", definition: "lave-vaisselle", type: "" },
  { terme: "das Waschmittel", definition: "lessive", type: "" },
  { terme: "der Abholtag", definition: "jour de collecte des déchets", type: "" },
  { terme: "die Nebenkosten", definition: "charges du logement", type: "" },
  { terme: "der Mitbewohner", definition: "colocataire", type: "" },
  { terme: "der Vorhang", definition: "rideau", type: "" },
  // —— 15 verbes à particule séparable ——
  { terme: "aufräumen", definition: "ranger", type: "" },
  { terme: "abwaschen", definition: "faire la vaisselle", type: "" },
  { terme: "aufhängen", definition: "étendre le linge", type: "" },
  { terme: "einräumen", definition: "ranger dans un meuble", type: "" },
  { terme: "ausziehen", definition: "quitter un logement", type: "" },
  { terme: "einziehen", definition: "emménager", type: "" },
  { terme: "zumachen", definition: "fermer", type: "" },
  { terme: "aufmachen", definition: "ouvrir", type: "" },
  { terme: "anmachen", definition: "allumer la lumière", type: "" },
  { terme: "ausmachen", definition: "éteindre la lumière", type: "" },
  { terme: "weglegen", definition: "mettre de côté", type: "" },
  { terme: "mitbringen", definition: "apporter avec soi", type: "" },
  { terme: "abtrocknen", definition: "essuyer", type: "" },
  { terme: "einpacken", definition: "emballer", type: "" },
  { terme: "abstauben", definition: "épousseter", type: "" },
  // —— 20 expressions ——
  { terme: "trautes Heim, Glück allein", definition: "bonheur d'être chez soi", type: "expression" },
  { terme: "ein Frühaufsteher sein", definition: "être du matin", type: "expression" },
  { terme: "eine Nachteule sein", definition: "être du soir", type: "expression" },
  { terme: "ab und zu", definition: "de temps en temps", type: "expression" },
  { terme: "fühl dich wie zu Hause", definition: "se mettre à l'aise chez quelqu'un", type: "expression" },
  { terme: "ein zweites Zuhause", definition: "un lieu où l'on se sent chez soi", type: "expression" },
  { terme: "raus aus den Federn", definition: "sortir du lit", type: "expression" },
  { terme: "in die Falle gehen", definition: "aller se coucher", type: "expression" },
  { terme: "die Kerze an beiden Enden anzünden", definition: "mener un rythme épuisant", type: "expression" },
  { terme: "die Zeche zahlen", definition: "écoper à la place des autres", type: "expression" },
  { terme: "Besorgungen machen", definition: "faire les courses et les démarches", type: "expression" },
  { terme: "ein Vermögen kosten", definition: "coûter les yeux de la tête", type: "expression" },
  { terme: "aufs Haus gehen", definition: "être offert par l'établissement", type: "expression" },
  { terme: "den Haushalt schmeißen", definition: "tenir la maison", type: "expression" },
  { terme: "alle Jubeljahre", definition: "très rarement", type: "expression" },
  { terme: "immer mit der Ruhe", definition: "sans se presser", type: "expression" },
  { terme: "ein Schulterklopfen", definition: "une marque d'encouragement", type: "expression" },
  { terme: "in den Trott kommen", definition: "reprendre le train-train", type: "expression" },
  { terme: "das Gastrecht strapazieren", definition: "abuser de l'hospitalité", type: "expression" },
  { terme: "den Bogen überspannen", definition: "aller trop loin", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-07-vie-quotidienne.xlsx"));
