/**
 * Pack 13 — Argent & économie (langue deu).
 */
import * as XLSX from "xlsx";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ terme: string; definition: string; type: string }[]} */
const rows = [
  // —— 65 mots du thème ——
  { terme: "die Münze", definition: "pièce de monnaie", type: "" },
  { terme: "der Geldschein", definition: "billet de banque", type: "" },
  { terme: "das Bargeld", definition: "espèces", type: "" },
  { terme: "die Währung", definition: "devise", type: "" },
  { terme: "der Euro", definition: "euro", type: "" },
  { terme: "der Dollar", definition: "dollar", type: "" },
  { terme: "der Wechselkurs", definition: "taux de change", type: "" },
  { terme: "die Inflation", definition: "inflation", type: "" },
  { terme: "die Deflation", definition: "déflation", type: "" },
  { terme: "der Zinssatz", definition: "taux d'intérêt", type: "" },
  { terme: "der Kredit", definition: "prêt", type: "" },
  { terme: "die Hypothek", definition: "emprunt immobilier", type: "" },
  { terme: "das Ersparte", definition: "épargne", type: "" },
  { terme: "die Bank", definition: "banque", type: "" },
  { terme: "der Geldautomat", definition: "distributeur de billets", type: "" },
  { terme: "die Kreditkarte", definition: "carte de crédit", type: "" },
  { terme: "die Girokarte", definition: "carte de débit", type: "" },
  { terme: "die PIN", definition: "code secret de carte", type: "" },
  { terme: "der Dispo", definition: "découvert autorisé", type: "" },
  { terme: "das Budget", definition: "budget", type: "" },
  { terme: "die Ausgabe", definition: "dépense", type: "" },
  { terme: "das Einkommen", definition: "revenu", type: "" },
  { terme: "der Gewinn", definition: "bénéfice", type: "" },
  { terme: "der Verlust", definition: "perte", type: "" },
  { terme: "der Umsatz", definition: "chiffre d'affaires", type: "" },
  { terme: "die Kosten", definition: "coûts", type: "" },
  { terme: "der Preis", definition: "prix", type: "" },
  { terme: "die Gebühr", definition: "frais", type: "" },
  { terme: "der Tarif", definition: "tarif", type: "" },
  { terme: "das Schnäppchen", definition: "bonne affaire", type: "" },
  { terme: "die Investition", definition: "investissement", type: "" },
  { terme: "die Börse", definition: "bourse", type: "" },
  { terme: "die Anleihe", definition: "obligation financière", type: "" },
  { terme: "die Dividende", definition: "dividende", type: "" },
  { terme: "das Depot", definition: "portefeuille de titres", type: "" },
  { terme: "die Pleite", definition: "faillite", type: "" },
  { terme: "die Rezession", definition: "récession", type: "" },
  { terme: "die Volkswirtschaft", definition: "économie d'un pays", type: "" },
  { terme: "der Markt", definition: "marché", type: "" },
  { terme: "der Handel", definition: "commerce", type: "" },
  { terme: "die Einfuhr", definition: "importation", type: "" },
  { terme: "die Ausfuhr", definition: "exportation", type: "" },
  { terme: "der Verbraucher", definition: "consommateur", type: "" },
  { terme: "der Lieferant", definition: "fournisseur", type: "" },
  { terme: "die Handelsrechnung", definition: "facture commerciale", type: "" },
  { terme: "die Erstattung", definition: "remboursement", type: "" },
  { terme: "das Taschengeld", definition: "argent de poche", type: "" },
  { terme: "der Zuschuss", definition: "subvention", type: "" },
  { terme: "das Vermögen", definition: "patrimoine", type: "" },
  { terme: "die Buchhaltung", definition: "comptabilité", type: "" },
  { terme: "die Wirtschaftsprüfung", definition: "audit", type: "" },
  { terme: "der Kassenwart", definition: "trésorier", type: "" },
  { terme: "der Kassierer", definition: "caissier", type: "" },
  { terme: "die Überweisung", definition: "virement", type: "" },
  { terme: "der Kontostand", definition: "solde du compte", type: "" },
  { terme: "die Barabhebung", definition: "retrait d'espèces", type: "" },
  { terme: "die Einzahlung", definition: "dépôt d'argent", type: "" },
  { terme: "der Makler", definition: "courtier", type: "" },
  { terme: "die Portokasse", definition: "petite caisse", type: "" },
  { terme: "der Fonds", definition: "fonds", type: "" },
  { terme: "die Erbschaft", definition: "héritage", type: "" },
  { terme: "die Mehrwertsteuer", definition: "TVA", type: "" },
  { terme: "das Bankkonto", definition: "compte bancaire", type: "" },
  { terme: "der Staatshaushalt", definition: "budget de l'État", type: "" },
  { terme: "die Quittung", definition: "reçu", type: "" },
  // —— 15 verbes à particule séparable ——
  { terme: "ausgeben", definition: "dépenser", type: "" },
  { terme: "einzahlen", definition: "verser sur un compte", type: "" },
  { terme: "auszahlen", definition: "verser une somme due", type: "" },
  { terme: "ansparen", definition: "mettre de l'argent de côté", type: "" },
  { terme: "nachzahlen", definition: "payer un complément", type: "" },
  { terme: "gutschreiben", definition: "créditer un compte", type: "" },
  { terme: "abbuchen", definition: "débiter un compte", type: "" },
  { terme: "ausleihen", definition: "prêter", type: "" },
  { terme: "zurückzahlen", definition: "rembourser", type: "" },
  { terme: "anlegen", definition: "placer de l'argent", type: "" },
  { terme: "heruntersetzen", definition: "baisser un prix", type: "" },
  { terme: "aufrechnen", definition: "compenser des sommes entre elles", type: "" },
  { terme: "vorauszahlen", definition: "payer d'avance", type: "" },
  { terme: "einlösen", definition: "encaisser un chèque ou un bon", type: "" },
  { terme: "draufzahlen", definition: "payer de sa poche en plus", type: "" },
  // —— 20 expressions ——
  { terme: "über die Runden kommen", definition: "joindre les deux bouts", type: "expression" },
  { terme: "das Geld zum Fenster hinauswerfen", definition: "gaspiller son argent", type: "expression" },
  { terme: "auf großem Fuß leben", definition: "vivre sur un grand pied", type: "expression" },
  { terme: "den Gürtel enger schnallen", definition: "se serrer la ceinture", type: "expression" },
  { terme: "in den roten Zahlen sein", definition: "être en déficit", type: "expression" },
  { terme: "in den schwarzen Zahlen sein", definition: "être bénéficiaire", type: "expression" },
  { terme: "jeden Cent zweimal umdrehen", definition: "peser chaque dépense", type: "expression" },
  { terme: "das Geld liegt nicht auf der Straße", definition: "l'argent ne tombe pas du ciel", type: "expression" },
  { terme: "Zeit ist Geld", definition: "le temps a une valeur d'argent", type: "expression" },
  { terme: "die Katze im Sack kaufen", definition: "acheter sans avoir vu la marchandise", type: "expression" },
  { terme: "tief in die Tasche greifen", definition: "devoir sortir beaucoup d'argent", type: "expression" },
  { terme: "auf Pump leben", definition: "vivre à crédit", type: "expression" },
  { terme: "sein Schäfchen ins Trockene bringen", definition: "mettre son avoir à l'abri", type: "expression" },
  { terme: "Geld wie Heu haben", definition: "crouler sous l'argent", type: "expression" },
  { terme: "von der Hand in den Mund leben", definition: "vivre au jour le jour", type: "expression" },
  { terme: "eine goldene Nase verdienen", definition: "gagner énormément d'argent", type: "expression" },
  { terme: "ein Fass ohne Boden", definition: "gouffre où l'argent disparaît", type: "expression" },
  { terme: "mit einem blauen Auge davonkommen", definition: "s'en tirer à bon compte", type: "expression" },
  { terme: "pleite sein", definition: "être sans le sou", type: "expression" },
  { terme: "Kohle machen", definition: "gagner de l'argent", type: "expression" },
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
XLSX.writeFile(wb, join(__dirname, "pack-13-argent-economie.xlsx"));
