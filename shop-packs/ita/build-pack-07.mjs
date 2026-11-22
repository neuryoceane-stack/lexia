/**
 * Pack 7 — Vie quotidienne (langue ita).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "la casa", definition: "domicile", type: "" },
  { terme: "l'appartamento (m.)", definition: "appartement", type: "" },
  { terme: "l'affitto (m.)", definition: "loyer", type: "" },
  { terme: "la bolletta", definition: "facture d'électricité, de gaz ou de téléphone", type: "" },
  { terme: "la chiave", definition: "clé", type: "" },
  { terme: "la serratura", definition: "serrure", type: "" },
  { terme: "la porta", definition: "porte", type: "" },
  { terme: "il campanello", definition: "sonnette", type: "" },
  { terme: "il gradino", definition: "marche d'escalier", type: "" },
  { terme: "l'ascensore (m.)", definition: "ascenseur", type: "" },
  { terme: "il divano", definition: "canapé", type: "" },
  { terme: "il letto", definition: "lit", type: "" },
  { terme: "il cuscino", definition: "oreiller", type: "" },
  { terme: "il lenzuolo", definition: "drap", type: "" },
  { terme: "l'asciugamano (m.)", definition: "serviette de toilette", type: "" },
  { terme: "la vasca da bagno", definition: "baignoire", type: "" },
  { terme: "la doccia", definition: "douche", type: "" },
  { terme: "il rubinetto", definition: "robinet", type: "" },
  { terme: "il lavandino", definition: "lavabo", type: "" },
  { terme: "il sapone", definition: "savon", type: "" },
  { terme: "la spazzola", definition: "brosse", type: "" },
  { terme: "lo specchio", definition: "miroir", type: "" },
  { terme: "il cestino", definition: "petite poubelle", type: "" },
  { terme: "lo scaffale", definition: "étagère", type: "" },
  { terme: "il cassetto", definition: "tiroir", type: "" },
  { terme: "il frigorifero", definition: "réfrigérateur", type: "" },
  { terme: "il forno", definition: "four", type: "" },
  { terme: "la padella", definition: "poêle", type: "" },
  { terme: "la pentola", definition: "casserole", type: "" },
  { terme: "il piatto", definition: "assiette", type: "" },
  { terme: "la tazza", definition: "tasse", type: "" },
  { terme: "la forchetta", definition: "fourchette", type: "" },
  { terme: "il coltello", definition: "couteau", type: "" },
  { terme: "il cucchiaio", definition: "cuillère", type: "" },
  { terme: "la colazione", definition: "petit-déjeuner", type: "" },
  { terme: "il pranzo", definition: "déjeuner", type: "" },
  { terme: "lo spuntino", definition: "en-cas", type: "" },
  { terme: "la cena", definition: "dîner", type: "" },
  { terme: "la spesa", definition: "courses alimentaires", type: "" },
  { terme: "le faccende", definition: "tâches ménagères", type: "" },
  { terme: "il bucato", definition: "linge à laver", type: "" },
  { terme: "lo stiro", definition: "repassage", type: "" },
  { terme: "l'aspirapolvere (m.)", definition: "aspirateur", type: "" },
  { terme: "in ordine", definition: "rangé", type: "" },
  { terme: "il disordine", definition: "désordre", type: "" },
  { terme: "l'abitudine (f.)", definition: "habitude", type: "" },
  { terme: "la quotidianità", definition: "train-train quotidien", type: "" },
  { terme: "il vicino di casa", definition: "voisin", type: "" },
  { terme: "il padrone di casa", definition: "propriétaire qui loue un logement", type: "" },
  { terme: "l'inquilino (m.)", definition: "locataire", type: "" },
  { terme: "le commissioni", definition: "courses à faire dehors", type: "" },
  { terme: "la fila", definition: "file d'attente", type: "" },
  { terme: "il portafoglio", definition: "portefeuille", type: "" },
  { terme: "lo scontrino", definition: "ticket de caisse", type: "" },
  { terme: "lo sconto", definition: "réduction sur un prix", type: "" },
  { terme: "le utenze", definition: "abonnements d'eau, de gaz et d'électricité", type: "" },
  { terme: "il pisolino", definition: "sieste", type: "" },
  { terme: "il forno a microonde", definition: "four à micro-ondes", type: "" },
  { terme: "la lavastoviglie", definition: "lave-vaisselle", type: "" },
  { terme: "il detersivo", definition: "lessive", type: "" },
  { terme: "il giorno del ritiro", definition: "jour de passage des éboueurs", type: "" },
  { terme: "le spese condominiali", definition: "charges de copropriété", type: "" },
  { terme: "il coinquilino", definition: "colocataire", type: "" },
  { terme: "la tenda", definition: "rideau ; une tente se dit tenda da campeggio", type: "" },
  { terme: "il citofono", definition: "interphone d'immeuble", type: "" },
  // —— 15 verbes et locutions verbales ——
  { terme: "riordinare", definition: "ranger", type: "" },
  { terme: "lavare i piatti", definition: "faire la vaisselle", type: "" },
  { terme: "stendere il bucato", definition: "étendre le linge", type: "" },
  { terme: "traslocare", definition: "déménager ses affaires", type: "" },
  { terme: "prendere casa", definition: "emménager dans un logement", type: "" },
  { terme: "chiudere a chiave", definition: "fermer à clé", type: "" },
  { terme: "accendere la luce", definition: "allumer la lumière", type: "" },
  { terme: "spegnere la luce", definition: "éteindre la lumière", type: "" },
  { terme: "mettere da parte", definition: "mettre de côté", type: "" },
  { terme: "portare con sé", definition: "apporter avec soi", type: "" },
  { terme: "asciugare", definition: "essuyer", type: "" },
  { terme: "spolverare", definition: "épousseter", type: "" },
  { terme: "fare la doccia", definition: "prendre une douche", type: "" },
  { terme: "apparecchiare", definition: "mettre le couvert", type: "" },
  { terme: "sparecchiare", definition: "débarrasser la table", type: "" },
  // —— 20 expressions ——
  { terme: "casa dolce casa", definition: "bonheur d'être chez soi", type: "expression" },
  { terme: "vivere e lasciare vivere", definition: "laisser chacun vivre à sa façon", type: "expression" },
  { terme: "girarsi i pollici", definition: "se tourner les pouces", type: "expression" },
  { terme: "sentirsi in gabbia", definition: "se sentir enfermé", type: "expression" },
  { terme: "sporcare il proprio nido", definition: "nuire au milieu dont on fait partie", type: "expression" },
  { terme: "buttarsi giù dal letto", definition: "sortir du lit à contrecœur", type: "expression" },
  { terme: "andare a letto con le galline", definition: "se coucher très tôt", type: "expression" },
  { terme: "non avere un attimo di respiro", definition: "n'avoir aucun répit", type: "expression" },
  { terme: "fare le spese di qualcosa", definition: "subir les conséquences à la place d'un autre", type: "expression" },
  { terme: "nascondere la polvere sotto il tappeto", definition: "dissimuler un problème gênant", type: "expression" },
  { terme: "costare un occhio della testa", definition: "coûter extrêmement cher", type: "expression" },
  { terme: "offre la casa", definition: "être payé par l'établissement", type: "expression" },
  { terme: "mandare avanti la casa", definition: "faire tourner le foyer", type: "expression" },
  { terme: "ogni morte di papa", definition: "une fois tous les trente-six du mois", type: "expression" },
  { terme: "essere pieno come un uovo", definition: "être plein à craquer", type: "expression" },
  { terme: "tirare troppo la corda", definition: "pousser quelqu'un à bout", type: "expression" },
  { terme: "mettere radici", definition: "s'installer durablement quelque part", type: "expression" },
  { terme: "piangere sul latte versato", definition: "regretter inutilement ce qui est déjà fait", type: "expression" },
  { terme: "il mattino ha l'oro in bocca", definition: "le début de journée est le moment le plus utile", type: "expression" },
  { terme: "alzarsi con il piede sbagliato", definition: "commencer la journée de mauvaise humeur", type: "expression" },
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
